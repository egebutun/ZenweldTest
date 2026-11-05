import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, afterEach, describe, expect, it } from "vitest";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { tr } from "@zenweld/i18n";
import {
  adminRequeueSapOrder,
  exportSapOrders,
  fileOrderExporter,
  orderExporterFromEnv,
  readOrdersPanel,
  SAP_ORDER_MAX_ATTEMPTS,
  sapRetryDelayMinutes,
  type SapOrderExporter,
  type SapOrderPayload,
  type SapSendResult,
} from "../../packages/db/src";
import * as schema from "../../packages/db/src/schema";
import { testDatabaseUrl } from "./ortak";

/*
 * SIPARISLERIN SAP'A AKTARIMI (packages/db/src/sap-orders.ts; KARARLAR
 * K-108): sira, gonderme, artan aralarla yeniden deneme, basarisiz ve
 * atlanan siparis, panelden yeniden siraya alma, deneme dosyasi, ayni anda
 * iki calisma. Is her siparis icin kendi islemini actigi icin testler
 * kayitlari gercekten yazar ve sonda siler (audit_log silinemez, onun
 * kaydi kalir). Siradaki kayitlar 2001 yilina tarihlenir: baska testlerin
 * biraktigi bugunku kayitlar bu testlerin calismalarinda "zamani gelmis"
 * sayilmaz.
 */

const pool = new Pool({ connectionString: testDatabaseUrl(), max: 4 });
const db = drizzle(pool, { schema });
afterAll(() => pool.end());

const T0 = new Date("2001-01-01T09:00:00.000Z");
const minutes = (from: Date, n: number) => new Date(from.getTime() + n * 60_000);

let prefix = "";
afterEach(async () => {
  await pool.query("DELETE FROM sap_order_exports WHERE order_id LIKE $1", [`${prefix}%`]);
  await pool.query("DELETE FROM orders WHERE id LIKE $1", [`${prefix}%`]);
  await pool.query("DELETE FROM users WHERE id LIKE $1", [`${prefix}%`]);
});

const address = { fullName: "Ad Soyad", phone: "05550000000", city: "Konya", district: "Selçuklu", line: "Örnek Cad. No:1" };

/** Odenmis kart siparisi (2 x 1.200 + kargo 250, 3 taksit) ve aktarim sirasi kaydi. */
async function queued(id: string, extra: { status?: string; exportStatus?: string; attempts?: number } = {}) {
  const p = `${prefix}${id}`;
  await pool.query(
    `INSERT INTO orders (id, code, status, customer_name, email, phone, shipping_address, invoice, subtotal, vat, shipping,
                         installment_fee, total, payment_method, installments, pos_name, paid_at, terms_accepted_at, created_at, updated_at)
     VALUES ($1, 'SIP-' || $1, $2, 'Ad Soyad', 'a@ornek.com', '05550000000', $3, $4, 2400, 400, 250, 133, 2783, 'card', 3,
             'Banka Bonus', $5, $5, $5, $5)`,
    [p, extra.status ?? "preparing", address, { type: "individual", fullName: "Ad Soyad", tcKimlikNo: "10000000146", address }, T0],
  );
  await pool.query(
    `INSERT INTO order_items (order_id, line, product_name, sku, variant_label, quantity, unit_price_ex_vat, vat_rate, unit_price)
     VALUES ($1, 0, 'Makine', 'ZW-P1', 'Uzunluk: 3 m', 2, 1000, 20, 1200)`,
    [p],
  );
  await pool.query(
    "INSERT INTO sap_order_exports (order_id, status, attempts, next_attempt_at, created_at, updated_at) VALUES ($1, $2, $3, $4, $4, $4)",
    [p, extra.exportStatus ?? "pending", extra.attempts ?? 0, T0],
  );
  return p;
}

const row = async (orderId: string) =>
  (
    await pool.query(
      "SELECT status, attempts, next_attempt_at, sap_doc_no, last_error, sent_at FROM sap_order_exports WHERE order_id = $1",
      [orderId],
    )
  ).rows[0] as { status: string; attempts: number; next_attempt_at: Date; sap_doc_no: string | null; last_error: string | null; sent_at: Date | null };

/** Verilen cevaplari sirayla veren aktarici; gonderilen siparisleri toplar. */
function exporter(...answers: SapSendResult[]): SapOrderExporter & { sent: SapOrderPayload[] } {
  const sent: SapOrderPayload[] = [];
  return {
    id: "deneme",
    sent,
    send: async (order) => {
      sent.push(order);
      return answers.length > 1 ? answers.shift()! : answers[0];
    },
  };
}
const ok = (docNo: string): SapSendResult => ({ ok: true, docNo });
const down: SapSendResult = { ok: false, retry: true, error: "SAP'a ulaşılamadı." };

describe("SAP sipariş aktarımı", () => {
  it("zamanı gelen sipariş gönderilir: aktarıcı siparişin bütün bilgisini alır, belge no yazılır", async () => {
    prefix = `sap1-${Date.now()}-`;
    const id = await queued("o1");
    const sap = exporter(ok("SAP-100"));
    const at = minutes(T0, 1);
    const run = await exportSapOrders(db, sap, at);
    expect(run).toEqual({ sent: [`SIP-${id}`], retrying: [], failed: [], skipped: [] });
    expect(sap.sent).toEqual([
      {
        orderCode: `SIP-${id}`,
        orderedAt: T0.toISOString(),
        paidAt: T0.toISOString(),
        customer: { userId: "", name: "Ad Soyad", email: "a@ornek.com", phone: "05550000000" },
        invoice: { type: "individual", fullName: "Ad Soyad", tcKimlikNo: "10000000146", address },
        shippingAddress: address,
        lines: [{ sku: "ZW-P1", name: "Makine", variantLabel: "Uzunluk: 3 m", quantity: 2, unitPriceExVat: 1000, vatRate: 20, couponDiscount: 0 }],
        shipping: 250,
        installmentFee: 133,
        total: 2783,
        payment: { method: "card", installments: 3, posName: "Banka Bonus" },
      },
    ]);
    expect(await row(id)).toMatchObject({ status: "sent", attempts: 1, sap_doc_no: "SAP-100", last_error: null, sent_at: at });

    // Gonderilen siparis bir daha gonderilmez.
    expect((await exportSapOrders(db, sap, minutes(T0, 60))).sent).toEqual([]);
    expect(sap.sent).toHaveLength(1);
  });

  it("zamanı gelmemiş sipariş beklemede kalır", async () => {
    prefix = `sap2-${Date.now()}-`;
    const id = await queued("o1");
    const sap = exporter(ok("SAP-1"));
    expect(await exportSapOrders(db, sap, minutes(T0, -1))).toEqual({ sent: [], retrying: [], failed: [], skipped: [] });
    expect(await row(id)).toMatchObject({ status: "pending", attempts: 0 });
  });

  it("geçici hata: artan aralarla yeniden denenir; deneme hakkı bitince başarısız olur", async () => {
    prefix = `sap3-${Date.now()}-`;
    const id = await queued("o1");
    const sap = exporter(down);
    let at = T0;
    for (let attempt = 1; attempt < SAP_ORDER_MAX_ATTEMPTS; attempt++) {
      expect((await exportSapOrders(db, sap, at)).retrying).toEqual([`SIP-${id}`]);
      const next = minutes(at, sapRetryDelayMinutes(attempt));
      expect(await row(id)).toMatchObject({ status: "pending", attempts: attempt, next_attempt_at: next, last_error: down.error });
      // Bekleme bitmeden denenmez.
      expect((await exportSapOrders(db, sap, minutes(next, -1))).retrying).toEqual([]);
      at = next;
    }
    expect([1, 2, 3, 7, 8].map(sapRetryDelayMinutes)).toEqual([5, 10, 20, 320, 360]);
    expect((await exportSapOrders(db, sap, at)).failed).toEqual([`SIP-${id}`]);
    expect(await row(id)).toMatchObject({ status: "failed", attempts: SAP_ORDER_MAX_ATTEMPTS, last_error: down.error });
    expect(sap.sent).toHaveLength(SAP_ORDER_MAX_ATTEMPTS);
  });

  it("aktarıcı 'yeniden deneme' demezse ilk denemede başarısız olur", async () => {
    prefix = `sap4-${Date.now()}-`;
    const id = await queued("o1");
    const run = await exportSapOrders(db, exporter({ ok: false, retry: false, error: "Cari bulunamadı." }), T0);
    expect(run.failed).toEqual([`SIP-${id}`]);
    expect(await row(id)).toMatchObject({ status: "failed", attempts: 1, last_error: "Cari bulunamadı." });
  });

  it("gönderilmeden iptal edilen sipariş aktarılmaz (atlandı)", async () => {
    prefix = `sap5-${Date.now()}-`;
    const id = await queued("o1", { status: "cancelled" });
    const sap = exporter(ok("SAP-1"));
    expect((await exportSapOrders(db, sap, T0)).skipped).toEqual([`SIP-${id}`]);
    expect(sap.sent).toEqual([]);
    expect(await row(id)).toMatchObject({ status: "skipped", attempts: 0, last_error: "Sipariş gönderilmeden iptal edildi; aktarılmadı." });
  });

  it("panel: başarısız sipariş yeniden sıraya alınır (deneme sayısı sıfırdan, audit_log'a yazılır); başarısız olmayan alınmaz", async () => {
    prefix = `sap6-${Date.now()}-`;
    const id = await queued("o1", { exportStatus: "failed", attempts: SAP_ORDER_MAX_ATTEMPTS });
    const actor = { id: `${prefix}u-yonetici`, name: "Yönetici Bir" };
    await pool.query(
      "INSERT INTO users (id, role, email, password_hash, first_name, last_name, phone) VALUES ($1, 'admin', $2, 'ozet', 'Y', 'B', '0555')",
      [actor.id, `${prefix}y@ornek.com`],
    );
    const panel = async () => (await readOrdersPanel(db, minutes(T0, 5), id)).orders[0].sapExport;
    expect(await panel()).toEqual({ status: "failed", attempts: SAP_ORDER_MAX_ATTEMPTS });

    // Bugunun tarihiyle: audit_log silinemez; eski tarihli kayit 2 yil temizligi testini bozar.
    const at = new Date();
    const requeue = () => db.transaction((tx) => adminRequeueSapOrder(tx, actor, { id }, at));
    expect(await requeue()).toEqual({ ok: true });
    expect(await row(id)).toMatchObject({ status: "pending", attempts: 0, next_attempt_at: at });
    expect(await panel()).toEqual({ status: "pending", attempts: 0, nextAttemptAt: at.toISOString() });
    const audit = await pool.query("SELECT action, entity_type, entity_label, changes FROM audit_log WHERE actor_user_id = $1", [actor.id]);
    expect(audit.rows).toEqual([{ action: "update", entity_type: "orders", entity_label: `SIP-${id}`, changes: { sapExport: ["failed", "pending"] } }]);

    // Ikinci kez (baska yonetici once yaptiysa) alinmaz; olmayan siparis 404.
    expect(await requeue()).toEqual({ ok: false, status: 409, error: tr.panel.sapNotFailed });
    expect(await db.transaction((tx) => adminRequeueSapOrder(tx, actor, { id: `${prefix}yok` }, at))).toEqual({
      ok: false,
      status: 404,
      error: tr.panel.orderNotFound,
    });

    // Sirada: bir sonraki calismada gonderilir (zamani gelmis baska siparisler de gidebilir).
    expect((await exportSapOrders(db, exporter(ok("SAP-9")), at)).sent).toContain(`SIP-${id}`);
    expect(await panel()).toEqual({ status: "sent", attempts: 1, sapDocNo: "SAP-9", sentAt: at.toISOString() });
  });

  it("aynı anda iki çalışma aynı siparişi iki kez göndermez", async () => {
    prefix = `sap7-${Date.now()}-`;
    const ids = [await queued("o1"), await queued("o2"), await queued("o3")];
    const slow = (): SapOrderExporter & { sent: string[] } => {
      const sent: string[] = [];
      return {
        id: "yavas",
        sent,
        send: async (order) => {
          sent.push(order.orderCode);
          await new Promise((resolve) => setTimeout(resolve, 150));
          return ok(`SAP-${order.orderCode}`);
        },
      };
    };
    const [a, b] = [slow(), slow()];
    const runs = await Promise.all([exportSapOrders(db, a, T0), exportSapOrders(db, b, T0)]);
    const sent = [...runs[0].sent, ...runs[1].sent].sort();
    expect(sent).toEqual(ids.map((id) => `SIP-${id}`).sort());
    expect([...a.sent, ...b.sent].sort()).toEqual(sent);
    for (const id of ids) expect(await row(id)).toMatchObject({ status: "sent", attempts: 1 });
  });

  it("deneme aktarıcısı siparişleri dosyaya satır satır yazar; ortam değişkeni yoksa aktarıcı yok", async () => {
    prefix = `sap8-${Date.now()}-`;
    const dir = await mkdtemp(join(tmpdir(), "sap-siparis-"));
    try {
      const file = join(dir, "siparisler.jsonl");
      const id = await queued("o1");
      const sap = orderExporterFromEnv({ SAP_SIPARIS_DOSYASI: file });
      expect(sap?.id).toBe("deneme-dosya");
      expect((await exportSapOrders(db, sap!, T0)).sent).toEqual([`SIP-${id}`]);
      const lines = (await readFile(file, "utf8")).trim().split("\n");
      expect(lines.map((l) => JSON.parse(l).orderCode)).toEqual([`SIP-${id}`]);
      expect(await row(id)).toMatchObject({ sap_doc_no: `DENEME-SIP-${id}` });

      // Yazilamayan dosya: gecici hata, yeniden denenecek.
      const broken = await fileOrderExporter(join(dir, "yok", "x.jsonl")).send(JSON.parse(lines[0]));
      expect(broken).toMatchObject({ ok: false, retry: true });
      expect(orderExporterFromEnv({})).toBeNull();
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
