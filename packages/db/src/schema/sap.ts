import { sql } from "drizzle-orm";
import { bigint, check, index, integer, numeric, pgTable, text } from "drizzle-orm/pg-core";
import { oneOf, timestamps, tstz } from "./columns";
import { orders } from "./sales";

/**
 * SAP: ZENWELD DEPO STOGU (docs/VERITABANI.md › 4, KARARLAR K-82)
 *
 * SAP ekibinin hazirladigi "kullanilabilir stok" gorunumu (view) duzenli
 * araliklarla okunup buraya yazilir. Site ve panel stogu buradan okur;
 * sayfa acilirken SAP'a gidilmez (hiz, K-83).
 */

/** Her SAP okumasi: ne zaman, kac satir, sonuc. */
export const sapSyncRuns = pgTable(
  "sap_sync_runs",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    kind: text("kind").notNull().default("stock"),
    startedAt: tstz("started_at").notNull().defaultNow(),
    finishedAt: tstz("finished_at"),
    status: text("status").notNull().default("running"),
    rowsRead: integer("rows_read"),
    error: text("error"),
  },
  (t) => [
    check("sap_sync_runs_kind", oneOf(t.kind, ["stock"])),
    check("sap_sync_runs_status", oneOf(t.status, ["running", "success", "failed"])),
  ],
);

/**
 * SAP kalemi basina kullanilabilir stok. Her basarili okumada tablo tek
 * islemde yenilenir. Urun ve secenek kodlariyla eslesmesi:
 * IS-KURALLARI › Zenweld depo stogu.
 */
export const warehouseStock = pgTable(
  "warehouse_stock",
  {
    /** SAP kalem kodu: bosluksuz, buyuk harf */
    sapItemCode: text("sap_item_code").primaryKey(),
    /** SAP'taki kalem adi (eslesmeyen kodlari panelde tanimak icin) */
    itemName: text("item_name"),
    /** Kullanilabilir stok; kg ile satilan kalemler icin ondalikli */
    quantity: numeric("quantity", { precision: 14, scale: 3, mode: "number" }).notNull(),
    syncedAt: tstz("synced_at").notNull(),
    syncRunId: bigint("sync_run_id", { mode: "number" }).references(() => sapSyncRuns.id, { onDelete: "set null" }),
  },
  (t) => [check("warehouse_stock_quantity", sql`${t.quantity} >= 0`)],
);

/**
 * SAP'A SIPARIS AKTARIM SIRASI (KARARLAR K-84, K-108)
 *
 * Odemesi kesinlesen siparis (kartla verildiginde ya da havalesi
 * onaylandiginda) buraya "bekliyor" olarak girer. Zamanlanmis is
 * siparisleri SAP'a gonderir (packages/db/src/sap-orders.ts); basarisizsa
 * artan aralarla yeniden dener, en fazla deneme sayisinda "basarisiz" olur.
 * Gonderilmeden iptal edilen siparis aktarilmaz ("atlandi").
 */
export const sapOrderExports = pgTable(
  "sap_order_exports",
  {
    orderId: text("order_id")
      .primaryKey()
      .references(() => orders.id, { onDelete: "restrict" }),
    status: text("status").notNull().default("pending"),
    /** Yapilan gonderme denemesi */
    attempts: integer("attempts").notNull().default(0),
    /** Bekleyen siparisin en erken gonderilecegi an */
    nextAttemptAt: tstz("next_attempt_at").notNull().defaultNow(),
    /** SAP'in verdigi belge numarasi */
    sapDocNo: text("sap_doc_no"),
    lastError: text("last_error"),
    sentAt: tstz("sent_at"),
    ...timestamps(),
  },
  (t) => [
    check("sap_order_exports_status", oneOf(t.status, ["pending", "sent", "failed", "skipped"])),
    check("sap_order_exports_attempts", sql`${t.attempts} >= 0`),
    index("sap_order_exports_due").on(t.status, t.nextAttemptAt),
  ],
);
