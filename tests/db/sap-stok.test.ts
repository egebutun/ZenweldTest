import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import type { SapStockLine } from "@zenweld/data";
import * as schema from "../../packages/db/src/schema";
import {
  fileStockSource,
  parseStockCsv,
  stockSourceFromEnv,
  syncWarehouseStock,
  type StockSource,
} from "../../packages/db/src/sap-stock";
import { testDatabaseUrl } from "./ortak";

/*
 * SAP depo stogu okuma isi (packages/db/src/sap-stock.ts): okuma kaydi,
 * tek islemde yenileme, hatada son iyi stogun korunmasi, ayni anda tek
 * okuma, deneme dosyasi. Is kendi islemini actigi icin testler kayitlari
 * gercekten yazar; her testin basinda ve sonunda iki tablo bosaltilir.
 */

const pool = new Pool({ connectionString: testDatabaseUrl() });
const db = drizzle(pool, { schema });

// Bastan bos ve numaralar 1'den (diger testlerin geri alinan yazmalari numara tuketir);
// sonda bos (diger testler bos tabloya yukler).
const empty = () => pool.query("TRUNCATE warehouse_stock, sap_sync_runs RESTART IDENTITY");
beforeEach(empty);
afterEach(empty);
afterAll(() => pool.end());

const source = (lines: SapStockLine[]): StockSource => ({ read: async () => lines });
const failing = (message: string): StockSource => ({
  read: async () => {
    throw new Error(message);
  },
});

const stock = async () =>
  (await pool.query("SELECT sap_item_code AS code, quantity::float AS quantity, sync_run_id AS run FROM warehouse_stock ORDER BY 1"))
    .rows as { code: string; quantity: number; run: string }[];
const runs = async () =>
  (await pool.query("SELECT id, status, rows_read, error, finished_at IS NOT NULL AS finished FROM sap_sync_runs ORDER BY id"))
    .rows as { id: string; status: string; rows_read: number | null; error: string | null; finished: boolean }[];

const first: SapStockLine[] = [
  { code: "ZW1", name: "Makine 1", quantity: 4 },
  { code: "ZW2", quantity: "2" },
  { code: "ZW3", quantity: 7 },
];

describe("SAP stok okuma işi", () => {
  it("başarılı okuma stoğu yazar ve okumayı kaydeder; tekrar okuma değişiklik bulmaz", async () => {
    const result = await syncWarehouseStock(db, source(first));
    expect(result).toMatchObject({ status: "success", rowsRead: 3, added: ["ZW1", "ZW2", "ZW3"], removed: [], changed: [] });
    expect(await stock()).toEqual([
      { code: "ZW1", quantity: 4, run: "1" },
      { code: "ZW2", quantity: 2, run: "1" },
      { code: "ZW3", quantity: 7, run: "1" },
    ]);
    expect(await runs()).toEqual([{ id: "1", status: "success", rows_read: 3, error: null, finished: true }]);

    const again = await syncWarehouseStock(db, source(first));
    expect(again).toMatchObject({ status: "success", added: [], removed: [], changed: [] });
    expect((await stock()).every((r) => r.run === "2")).toBe(true);
  });

  it("stok tek seferde yenilenir: okumada olmayan kalem çıkar, miktarı değişen güncellenir", async () => {
    await syncWarehouseStock(db, source(first));
    const result = await syncWarehouseStock(db, source([{ code: "ZW1", quantity: 4 }, { code: "ZW2", quantity: 0 }, { code: "ZW9", quantity: 1 }]));
    expect(result).toMatchObject({ status: "success", added: ["ZW9"], removed: ["ZW3"], changed: ["ZW2"] });
    expect((await stock()).map((r) => [r.code, r.quantity])).toEqual([
      ["ZW1", 4],
      ["ZW2", 0],
      ["ZW9", 1],
    ]);
  });

  it("kaynağa ulaşılamazsa ya da okuma geçersizse son iyi stok kalır, hata kaydedilir", async () => {
    await syncWarehouseStock(db, source(first));
    const before = await stock();

    expect(await syncWarehouseStock(db, failing("SAP'a bağlanılamadı"))).toEqual({
      status: "failed",
      runId: 2,
      error: "SAP'a bağlanılamadı",
    });
    expect(await syncWarehouseStock(db, source([]))).toMatchObject({ status: "failed", error: "SAP'tan hiç kalem gelmedi." });
    expect(await syncWarehouseStock(db, source([{ code: "ZW1", quantity: "?" }]))).toMatchObject({
      status: "failed",
      error: "ZW1: miktar okunamadı (?).",
    });

    expect(await stock()).toEqual(before);
    expect((await runs()).map((r) => [r.status, r.finished])).toEqual([
      ["success", true],
      ["failed", true],
      ["failed", true],
      ["failed", true],
    ]);
  });

  it("aynı anda ikinci okuma uygulanmaz; yarıda kalmış eski okuma kapatılır", async () => {
    await syncWarehouseStock(db, source(first));
    await pool.query(
      "INSERT INTO sap_sync_runs (kind, status, started_at) VALUES ('stock', 'running', now() - interval '2 hours')",
    );

    // Baska bir okuma kilidi tutuyor.
    const other = await pool.connect();
    try {
      await other.query("SELECT pg_advisory_lock(82084)");
      const result = await syncWarehouseStock(db, source([{ code: "ZW1", quantity: 0 }]));
      expect(result).toMatchObject({ status: "failed", error: "Başka bir stok okuması sürüyor; bu okuma uygulanmadı." });
    } finally {
      await other.query("SELECT pg_advisory_unlock(82084)");
      other.release();
    }
    expect((await stock()).find((r) => r.code === "ZW1")?.quantity).toBe(4);
    expect((await runs()).map((r) => [r.id, r.status, r.error])).toEqual([
      ["1", "success", null],
      ["2", "failed", "Yarıda kaldı (okuma tamamlanamadı)."],
      ["3", "failed", "Başka bir stok okuması sürüyor; bu okuma uygulanmadı."],
    ]);
  });
});

describe("deneme dosyası", () => {
  it("başlıklı CSV: noktalı virgül, virgül ya da sekme; tırnak; Excel'in BOM'u", () => {
    expect(parseStockCsv('﻿Kod;Kalem Adı;Miktar\r\nZW1;"Makine; 220V";4\r\n\r\nZW2;;1,5\r\n')).toEqual([
      { code: "ZW1", name: "Makine; 220V", quantity: "4" },
      { code: "ZW2", name: "", quantity: "1,5" },
    ]);
    expect(parseStockCsv('ItemCode,ItemName,Available\nZW1,"Tel ""1,0 mm""",12')).toEqual([
      { code: "ZW1", name: 'Tel "1,0 mm"', quantity: "12" },
    ]);
    expect(parseStockCsv("kod\tmiktar\nZW1\t3")).toEqual([{ code: "ZW1", name: undefined, quantity: "3" }]);
    expect(() => parseStockCsv("ZW1;4")).toThrow("Deneme dosyasının ilk satırı başlık olmalı: kod;ad;miktar");
  });

  it("dosyadan okunur; dosya yoksa anlaşılır hata; ayar yoksa kaynak yok", async () => {
    const dir = await mkdtemp(join(tmpdir(), "sap-stok-"));
    try {
      const file = join(dir, "stok.csv");
      await writeFile(file, "kod;ad;miktar\nZW1;Makine 1;4\n");
      expect(await fileStockSource(file).read()).toEqual([{ code: "ZW1", name: "Makine 1", quantity: "4" }]);
      await expect(fileStockSource(join(dir, "yok.csv")).read()).rejects.toThrow(/Deneme dosyası okunamadı: .*yok\.csv \(ENOENT\)\./);
      expect(stockSourceFromEnv({})).toBeNull();
      expect(await stockSourceFromEnv({ SAP_STOK_DOSYASI: file })?.read()).toHaveLength(1);
    } finally {
      await rm(dir, { recursive: true });
    }
  });
});
