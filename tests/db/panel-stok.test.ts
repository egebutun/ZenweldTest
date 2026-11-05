import { afterAll, describe, expect, it } from "vitest";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import type { PoolClient } from "pg";
import { tr } from "@zenweld/i18n";
import {
  adminDeleteStockLevel,
  adminSaveStockSettings,
  adminSetStockLevel,
  readStockPanel,
  type Actor,
} from "../../packages/db/src";
import * as schema from "../../packages/db/src/schema";
import { category, closePool, group, inTransaction, optionDefinition, product, variant } from "./ortak";

/*
 * PANEL › STOK MATRISI SUNUCUDA, ADIM 4.2 (packages/db/src/admin-stock.ts;
 * Asama 5, 4. alan, KARARLAR K-99, K-103): her gorunum yalnizca gereken
 * stogu okur; elle duzeltme (adet, fiyat, link, satir ekleme ve silme) ve
 * "kac gunden eski stok gosterilmez" ayari sunucuda, stok gecmisine ve
 * audit_log'a yazilir; ekran acildiktan sonra degismis satir kaydedilmez.
 * Her test kendi isleminde calisir ve geri alinir.
 */

afterAll(closePool);

type Db = NodePgDatabase<typeof schema>;

const admin: Actor = { id: "u-stok", name: "Stok Yöneticisi" };
const T0 = new Date("2026-03-10T09:00:00.000Z");
const T1 = new Date("2026-03-11T09:00:00.000Z");
const T2 = new Date("2026-03-11T10:00:00.000Z");
const stale = { ok: false, status: 409, error: tr.panel.staleRecord };

/**
 * Ornek: urun p1 (3 m / 5 m secenekli) ve p2; bayi d1 (magazasi r1), pasif bayi
 * d2, bayiye bagli olmayan satici r2. Satir anlari T0.
 */
async function withStock(run: (db: Db, client: PoolClient) => Promise<void>) {
  await inTransaction(async (client) => {
    await group(client);
    await category(client);
    await product(client, "p1", "ZW-P1");
    await product(client, "p2", "ZW-P2");
    await optionDefinition(client);
    await variant(client, "p1", "3-m", "ZW-P1-3");
    await client.query(
      `INSERT INTO retailers (id, name, website_url, logo_text)
       VALUES ('r1', 'Mağaza Bir', 'https://bir.ornek', 'BİR'), ('r2', 'Mağaza İki', 'https://iki.ornek', 'İKİ')`,
    );
    await client.query(
      `INSERT INTO dealers (id, name, city, district, address, phone, lat, lng, badges, working_hours, retailer_id, active)
       VALUES ('d1', 'Bayi Bir', 'Konya', 'Selçuklu', 'Adres', '0555', 37.9, 32.5, '{yetkili-satici}', '09-18', 'r1', true),
              ('d2', 'Bayi İki', 'Ankara', 'Çankaya', 'Adres', '0555', 39.9, 32.8, '{yetkili-satici}', '09-18', NULL, false)`,
    );
    await client.query(
      `INSERT INTO dealer_stock (dealer_id, product_id, variant_id, sku, quantity, updated_at) VALUES
         ('d1', 'p1', '3-m', 'ZW-P1-3', 4, $1), ('d1', 'p2', '', 'ZW-P2', 0, $2), ('d2', 'p1', '', 'ZW-P1', 9, $1)`,
      [T0, T1],
    );
    await client.query(
      "INSERT INTO retailer_stock (retailer_id, product_id, sku, quantity, url, updated_at) VALUES ('r2', 'p2', 'ZW-P2', 5, 'https://iki.ornek/p2', $1)",
      [T0],
    );
    await client.query(
      `INSERT INTO stock_imports (id, source_type, source_id, kind, file_name, rows, matched, unmatched, invalid, added, changed, zeroed, previous, created_at)
       VALUES ('si-1', 'dealer', 'd1', 'file', 'bir.csv', 2, 2, 0, 0, 1, 0, 0, '[{"productId":"p1","sku":"ZW-P1","quantity":1,"updatedAt":"2026-03-01T00:00:00.000Z"}]', $1),
              ('si-2', 'retailer', 'r2', 'file', 'iki.csv', 1, 1, 0, 0, 1, 0, 0, NULL, $1)`,
      [T0],
    );
    await client.query("INSERT INTO sku_aliases (source_id, code, product_id) VALUES ('d1', 'BAYI-P2', 'p2'), ('r2', 'SATICI-P2', 'p2')");
    await run(drizzle(client, { schema }), client);
  });
}

const audit = async (client: PoolClient) =>
  (
    await client.query(
      "SELECT action, entity_type, entity_id, entity_label, changes FROM audit_log WHERE actor_user_id = $1 ORDER BY id",
      [admin.id],
    )
  ).rows;

const manual = async (client: PoolClient) =>
  (
    await client.query(
      "SELECT note, created_by, added, changed, zeroed FROM stock_imports WHERE kind = 'manual' ORDER BY created_at, note",
    )
  ).rows;

const d1 = { sourceType: "dealer", sourceId: "d1" };

describe("stok matrisi okuma", () => {
  it("liste kaynak başına özet sayıları; kaynak sayfası yalnızca o kaynağın satırlarını, geçmişini ve eşleştirmelerini; Ürün Bazında aktif kaynakların stoktaki satırlarını okur", async () => {
    await withStock(async (db) => {
      const list = await readStockPanel(db, { tab: "kaynaklar" });
      expect(list.data.dealerStock).toEqual([]);
      expect(list.summaries?.sort((a, b) => a.id.localeCompare(b.id))).toEqual([
        { type: "dealer", id: "d1", rows: 2, inStock: 1, lastUpdate: T1.toISOString() },
        { type: "dealer", id: "d2", rows: 1, inStock: 1, lastUpdate: T0.toISOString() },
        { type: "retailer", id: "r2", rows: 1, inStock: 1, lastUpdate: T0.toISOString() },
      ]);

      const source = await readStockPanel(db, { source: { type: "dealer", id: "d1" } });
      expect(source.data.dealerStock?.map((r) => [r.dealerId, r.productId, r.variantId])).toEqual([
        ["d1", "p1", "3-m"],
        ["d1", "p2", undefined],
      ]);
      expect(source.data.retailerStock).toEqual([]);
      // Geri alma kopyasinin kendisi gonderilmez; yalnizca var oldugu.
      expect(source.data.stockImports).toMatchObject([{ id: "si-1", fileName: "bir.csv", previous: [] }]);
      expect(source.data.skuAliases).toEqual([{ sourceId: "d1", code: "BAYI-P2", productId: "p2", variantId: undefined }]);

      // Pasif bayi d2 ve adedi 0 olan satir gelmez.
      const byProduct = await readStockPanel(db, { tab: "urun" });
      expect(byProduct.data.dealerStock?.map((r) => [r.dealerId, r.productId])).toEqual([["d1", "p1"]]);
      expect(byProduct.data.retailerStock?.map((r) => [r.retailerId, r.productId])).toEqual([["r2", "p2"]]);
      expect(byProduct.data.products?.map((p) => p.id).sort()).toEqual(["p1", "p2"]);
    });
  });
});

describe("elle düzeltme", () => {
  it("satır eklenir (kod üründen ya da seçenekten); adet, fiyat ve link düzeltilir; ekran eskiyse kaydedilmez; değişiklik yoksa yazılmaz", async () => {
    await withStock(async (db, client) => {
      const add = { ...d1, productId: "p1", variantId: "", label: "Ürün p1" };
      expect(await adminSetStockLevel(db, admin, { ...add, patch: { quantity: 2 } }, T1)).toEqual({ ok: true, updatedAt: T1.toISOString() });
      // Ayni satir yeniden "yeni" diye eklenemez: bu arada eklenmis.
      expect(await adminSetStockLevel(db, admin, { ...add, patch: { quantity: 3 } }, T2)).toEqual(stale);

      const row3 = { ...d1, productId: "p1", variantId: "3-m", label: "Ürün p1 (Uzunluk: 3 m)" };
      expect(await adminSetStockLevel(db, admin, { ...row3, patch: { quantity: 7 }, updatedAt: T1.toISOString() }, T2)).toEqual(stale);
      expect(await adminSetStockLevel(db, admin, { ...row3, patch: { quantity: 7 }, updatedAt: T0.toISOString() }, T1)).toMatchObject({ ok: true });
      expect(
        await adminSetStockLevel(db, admin, { ...row3, patch: { price: 1500.555, url: " https://bir.ornek/p1-3m " }, updatedAt: T1.toISOString() }, T2),
      ).toEqual({ ok: true, updatedAt: T2.toISOString() });
      // Ayni deger: hicbir sey yazilmaz.
      expect(await adminSetStockLevel(db, admin, { ...row3, patch: { quantity: 7 }, updatedAt: T2.toISOString() }, T2)).toEqual({
        ok: true,
        updatedAt: T2.toISOString(),
      });
      expect(await adminSetStockLevel(db, admin, { ...row3, patch: { url: "ftp://x" }, updatedAt: T2.toISOString() }, T2)).toMatchObject({ status: 400 });
      expect(await adminSetStockLevel(db, admin, { ...row3, patch: { quantity: 1.5 }, updatedAt: T2.toISOString() }, T2)).toMatchObject({ status: 400 });
      // Bir bayiye bagli online satici ayri kaynak degildir.
      expect(await adminSetStockLevel(db, admin, { sourceType: "retailer", sourceId: "r1", productId: "p1", label: "x", patch: { quantity: 1 } }, T2)).toMatchObject({
        status: 400,
      });
      expect(await adminSetStockLevel(db, admin, { ...d1, productId: "p1", variantId: "9-m", label: "x", patch: { quantity: 1 } }, T2)).toMatchObject({ status: 404 });

      // Dogrudan sorguda ondalik sayi metin olarak doner.
      const rows = (await client.query("SELECT variant_id, sku, quantity, price, url FROM dealer_stock WHERE dealer_id = 'd1' AND product_id = 'p1' ORDER BY 1")).rows;
      expect(rows).toEqual([
        { variant_id: "", sku: "ZW-P1", quantity: 2, price: null, url: null },
        { variant_id: "3-m", sku: "ZW-P1-3", quantity: 7, price: "1500.56", url: "https://bir.ornek/p1-3m" },
      ]);
      expect(await manual(client)).toEqual([
        { note: "Ürün p1 (Uzunluk: 3 m): adet 4 → 7", created_by: "Stok Yöneticisi", added: 0, changed: 1, zeroed: 0 },
        { note: "Ürün p1: adet — → 2 (yeni satır)", created_by: "Stok Yöneticisi", added: 1, changed: 0, zeroed: 0 },
        { note: "Ürün p1 (Uzunluk: 3 m): fiyat — → 1500.56, link değişti", created_by: "Stok Yöneticisi", added: 0, changed: 1, zeroed: 0 },
      ]);
      const changes = await audit(client);
      expect(changes.map((r) => [r.action, r.entity_type, r.entity_id])).toEqual([
        ["create", "dealer_stock", "d1/p1|"],
        ["update", "dealer_stock", "d1/p1|3-m"],
        ["update", "dealer_stock", "d1/p1|3-m"],
      ]);
      expect(changes[1].changes).toEqual({ quantity: [4, 7] });
    });
  });

  it("satır listeden çıkarılır; adedi varsa geçmişte 'çıkan' sayılır; ekran eskiyse çıkarılmaz", async () => {
    await withStock(async (db, client) => {
      const row3 = { ...d1, productId: "p1", variantId: "3-m", label: "Ürün p1 (Uzunluk: 3 m)" };
      expect(await adminDeleteStockLevel(db, admin, { ...row3, updatedAt: T1.toISOString() }, T1)).toEqual(stale);
      expect(await adminDeleteStockLevel(db, admin, { ...row3, updatedAt: T0.toISOString() }, T1)).toEqual({ ok: true });
      expect(await adminDeleteStockLevel(db, admin, { ...row3, updatedAt: T0.toISOString() }, T1)).toMatchObject({ status: 404 });
      expect((await client.query("SELECT count(*)::int AS n FROM dealer_stock WHERE dealer_id = 'd1'")).rows[0].n).toBe(1);
      expect(await manual(client)).toEqual([
        { note: "Ürün p1 (Uzunluk: 3 m): listeden çıkarıldı (adet 4)", created_by: "Stok Yöneticisi", added: 0, changed: 0, zeroed: 1 },
      ]);
      expect((await audit(client))[0]).toMatchObject({ action: "delete", entity_id: "d1/p1|3-m", changes: { sku: "ZW-P1-3", quantity: 4 } });
    });
  });
});

describe("stok ayarı", () => {
  it("'kaç günden eski stok gösterilmez' kaydedilir; ekran eskiyse kaydedilmez; 0–365 dışı reddedilir", async () => {
    await withStock(async (db, client) => {
      expect(await adminSaveStockSettings(db, admin, { staleDays: 400 }, T1)).toMatchObject({ status: 400 });
      expect(await adminSaveStockSettings(db, admin, { staleDays: 5 }, T1)).toEqual({ ok: true, updatedAt: T1.toISOString() });
      expect(await adminSaveStockSettings(db, admin, { staleDays: 7 }, T2)).toEqual(stale);
      expect(await adminSaveStockSettings(db, admin, { staleDays: 0, updatedAt: T1.toISOString() }, T2)).toEqual({ ok: true, updatedAt: T2.toISOString() });
      const panel = await readStockPanel(db, { tab: "kaynaklar" });
      expect(panel.data.settings?.stock).toEqual({ staleDays: 0, updatedAt: T2.toISOString() });
      expect((await audit(client)).map((r) => r.changes)).toEqual([{ staleDays: [null, 5] }, { staleDays: [5, 0] }]);
    });
  });
});
