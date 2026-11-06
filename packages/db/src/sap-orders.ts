import { appendFile } from "node:fs/promises";
import { resolve } from "node:path";
import { and, asc, eq, inArray, lte } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { Order, OrderSapExport } from "@zenweld/data";
import type { AuditDb } from "./audit";
import { readOrders } from "./read";
import * as s from "./schema";

/**
 * SIPARISLERIN SAP'A AKTARIMI (KARARLAR K-84, K-108; docs/VERITABANI.md ›
 * sap_order_exports, SUNUCU › 11)
 *
 * Odemesi kesinlesen siparis aktarim sirasina girer (queueSapOrder):
 * kartla verilen siparis verildigi anda, havale siparisi panelde "Odeme
 * Alindi" denince. Zamanlanmis is (exportSapOrders) sirayi gonderir:
 * - Siparis SAP'a "aktarici" parcayla gonderilir (SapOrderExporter). SAP
 *   bilgileri gelince SAP'a yazan aktarici eklenir; o zamana kadar siparisi
 *   dosyaya yazan deneme aktaricisi calisir (SAP_SIPARIS_DOSYASI).
 * - Basarisiz gonderme artan aralarla yeniden denenir (5 dk, 10 dk, 20 dk…,
 *   en fazla 6 saat); MAX_ATTEMPTS denemede ya da aktarici "yeniden
 *   deneme" demezse siparis "basarisiz" olur. Panelden yeniden siraya
 *   alinabilir.
 * - Gonderilmeden iptal edilen siparis aktarilmaz ("atlandi").
 * - Her siparis ayri islemde gonderilir; ayni anda calisan iki is ayni
 *   siparisi almaz (SKIP LOCKED).
 *
 * Siparisin SAP'a nasil yazilacagi (cari, KDV, kargo, kupon, vade farki)
 * SAP danismaniyla netlesir (YAPILACAKLAR › Sirketten ogrenilecekler ›
 * SAP danismani); aktarici siparisin butun bilgisini alir (SapOrderPayload)
 * ve SAP'in istedigi bicime kendisi cevirir.
 */

type Database = NodePgDatabase<typeof s>;

/** En fazla deneme; sonra "basarisiz". */
export const SAP_ORDER_MAX_ATTEMPTS = 8;
/** Bir calismada en fazla kac siparis gonderilir. */
const BATCH = 20;

/** n. basarisiz denemeden sonra bekleme (dakika): 5, 10, 20... en fazla 360. */
export const sapRetryDelayMinutes = (attempts: number) => Math.min(5 * 2 ** Math.max(0, attempts - 1), 360);

/** Siparis aktarim sirasina girer (zaten varsa degismez). Islem icinde cagrilir. */
export async function queueSapOrder(db: AuditDb, orderId: string, at: Date): Promise<void> {
  await db
    .insert(s.sapOrderExports)
    .values({ orderId, status: "pending", nextAttemptAt: at, createdAt: at, updatedAt: at })
    .onConflictDoNothing();
}

/** Aktariciya giden siparis: SAP'a yazilacak butun bilgi. */
export interface SapOrderPayload {
  orderCode: string;
  orderedAt: string;
  paidAt?: string;
  customer: { userId: string; name: string; email: string; phone: string };
  invoice: Order["invoice"];
  shippingAddress: Order["shippingAddress"];
  lines: {
    sku: string;
    name: string;
    variantLabel?: string;
    quantity: number;
    /** Birim fiyat (KDV haric) */
    unitPriceExVat: number;
    vatRate: number;
    /** Kupon indiriminin satira dusen payi (satirin tamami, KDV dahil) */
    couponDiscount: number;
  }[];
  /** Kargo ucreti (KDV dahil) */
  shipping: number;
  /** Vade farki */
  installmentFee: number;
  coupon?: { code: string; discount: number };
  /** Musterinin odedigi toplam */
  total: number;
  payment: { method: Order["payment"]["method"]; installments?: number; posName?: string };
}

export function sapOrderPayload(order: Order): SapOrderPayload {
  return {
    orderCode: order.code,
    orderedAt: order.createdAt,
    ...(order.payment.paidAt && { paidAt: order.payment.paidAt }),
    customer: { userId: order.userId, name: order.customerName, email: order.email, phone: order.phone },
    invoice: order.invoice,
    shippingAddress: order.shippingAddress,
    lines: order.items.map((i) => ({
      sku: i.sku,
      name: i.productName,
      ...(i.variantLabel && { variantLabel: i.variantLabel }),
      quantity: i.quantity,
      unitPriceExVat: i.unitPriceExVat,
      vatRate: i.vatRate,
      couponDiscount: i.couponDiscount ?? 0,
    })),
    shipping: order.shipping,
    installmentFee: order.installmentFee,
    ...(order.coupon && { coupon: { code: order.coupon.code, discount: order.coupon.discount } }),
    total: order.total,
    payment: {
      method: order.payment.method,
      ...(order.payment.installments && { installments: order.payment.installments }),
      ...(order.payment.posName && { posName: order.payment.posName }),
    },
  };
}

export type SapSendResult = { ok: true; /** SAP belge numarasi */ docNo: string } | { ok: false; error: string; /** gecici hata mi */ retry: boolean };

/**
 * Siparisi SAP'a yazan parca. Gonderme sonucu yazilamazsa (sunucu o anda
 * kapanirsa) ayni siparis yeniden gelebilir: SAP'a yazan aktarici siparisi
 * siparis numarasiyla yazar, numara SAP'ta varsa yeni siparis acmaz, var
 * olanin belge numarasini dondurur.
 */
export interface SapOrderExporter {
  /** Kayitlarda gorunen ad: "deneme-dosya", "sap-service-layer"... */
  id: string;
  send(order: SapOrderPayload): Promise<SapSendResult>;
}

/**
 * Deneme aktaricisi: SAP baglanana kadar siparisleri bir dosyaya (her
 * satira bir siparis, JSON) yazar; belge numarasi "DENEME-<siparis no>".
 */
export function fileOrderExporter(path: string): SapOrderExporter {
  return {
    id: "deneme-dosya",
    send: async (order) => {
      try {
        await appendFile(path, `${JSON.stringify(order)}\n`, "utf8");
        return { ok: true, docNo: `DENEME-${order.orderCode}` };
      } catch (error) {
        return { ok: false, retry: true, error: `Dosyaya yazılamadı: ${(error as Error).message}` };
      }
    },
  };
}

/**
 * Ortam degiskenlerinden aktarici; tanimli degilse null (is calismaz,
 * siparisler sirada bekler).
 * - SAP_SIPARIS_DOSYASI: deneme dosyasi; goreli yol sitenin klasorune
 *   (apps/zenweld-web) gore.
 * SAP baglantisi gelince onun ayarlari burada once denenir.
 */
export function orderExporterFromEnv(env: Record<string, string | undefined> = process.env): SapOrderExporter | null {
  if (env.SAP_SIPARIS_DOSYASI) return fileOrderExporter(resolve(env.SAP_SIPARIS_DOSYASI));
  return null;
}

export interface SapExportRun {
  sent: string[];
  retrying: string[];
  failed: string[];
  skipped: string[];
}

/**
 * Siradaki (zamani gelmis) siparisleri gonderir. Her siparis ayri islemde:
 * satir kilitlenir (baska calisma atlar), siparis okunur, aktariciya
 * gonderilir, sonuc yazilir. Donen listeler siparis numaralaridir.
 */
export async function exportSapOrders(db: Database, exporter: SapOrderExporter, at: Date, limit = BATCH): Promise<SapExportRun> {
  const run: SapExportRun = { sent: [], retrying: [], failed: [], skipped: [] };
  for (let i = 0; i < limit; i++) {
    const done = await db.transaction(async (tx) => {
      const [row] = await tx
        .select()
        .from(s.sapOrderExports)
        .where(and(eq(s.sapOrderExports.status, "pending"), lte(s.sapOrderExports.nextAttemptAt, at)))
        .orderBy(asc(s.sapOrderExports.nextAttemptAt), asc(s.sapOrderExports.orderId))
        .limit(1)
        .for("update", { skipLocked: true });
      if (!row) return false;
      const [order] = await readOrders(tx, eq(s.orders.id, row.orderId));
      const update = (values: Partial<typeof s.sapOrderExports.$inferInsert>) =>
        tx.update(s.sapOrderExports).set({ ...values, updatedAt: at }).where(eq(s.sapOrderExports.orderId, row.orderId));

      if (order.status === "cancelled") {
        await update({ status: "skipped", lastError: "Sipariş gönderilmeden iptal edildi; aktarılmadı." });
        run.skipped.push(order.code);
        return true;
      }
      const result = await exporter.send(sapOrderPayload(order));
      const attempts = row.attempts + 1;
      if (result.ok) {
        await update({ status: "sent", attempts, sapDocNo: result.docNo, sentAt: at, lastError: null });
        run.sent.push(order.code);
      } else if (result.retry && attempts < SAP_ORDER_MAX_ATTEMPTS) {
        const next = new Date(at.getTime() + sapRetryDelayMinutes(attempts) * 60_000);
        await update({ attempts, lastError: result.error, nextAttemptAt: next });
        run.retrying.push(order.code);
      } else {
        await update({ status: "failed", attempts, lastError: result.error });
        run.failed.push(order.code);
      }
      return true;
    });
    if (!done) break;
  }
  return run;
}

/** Panel: siparislerin aktarim durumu (sipariş kimligine gore). */
export async function readSapExports(db: AuditDb, orderIds: string[]): Promise<Map<string, OrderSapExport>> {
  if (!orderIds.length) return new Map();
  const rows = await db.select().from(s.sapOrderExports).where(inArray(s.sapOrderExports.orderId, orderIds));
  const iso = (d: Date | null) => (d ? d.toISOString() : undefined);
  return new Map(
    rows.map((r) => [
      r.orderId,
      {
        status: r.status as OrderSapExport["status"],
        attempts: r.attempts,
        ...(r.status === "pending" && { nextAttemptAt: iso(r.nextAttemptAt) }),
        ...(r.sapDocNo && { sapDocNo: r.sapDocNo }),
        ...(r.lastError && { lastError: r.lastError }),
        ...(r.sentAt && { sentAt: iso(r.sentAt) }),
      },
    ]),
  );
}

/** "Basarisiz" siparisi yeniden siraya alir: hemen, deneme sayisi sifirdan. Islem icinde cagrilir. */
export async function requeueSapOrder(db: AuditDb, orderId: string, at: Date): Promise<boolean> {
  const updated = await db
    .update(s.sapOrderExports)
    .set({ status: "pending", attempts: 0, nextAttemptAt: at, updatedAt: at })
    .where(and(eq(s.sapOrderExports.orderId, orderId), eq(s.sapOrderExports.status, "failed")))
    .returning({ orderId: s.sapOrderExports.orderId });
  return updated.length > 0;
}
