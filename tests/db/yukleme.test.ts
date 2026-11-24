import { mkdtempSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, describe, expect, it } from "vitest";
import { drizzle } from "drizzle-orm/node-postgres";
import type { PoolClient } from "pg";
import { createSeedDatabase, uploadKeyOf, type ZenweldDatabase } from "@zenweld/data";
import { diskStorage } from "../../packages/db/src/file-storage";
import { isContentImage, storeSiteImages } from "../../packages/db/src/site-images";
import * as schema from "../../packages/db/src/schema";
import { loadableData, loadData, type LoadMode, type LoadResult, type LoadTarget } from "../../packages/db/src/load";
import { readDatabase } from "../../packages/db/src/read";
import { category, closePool, expected, group, inTransaction, normalize, product, sorted, user } from "./ortak";

/*
 * npm run db:yukle (packages/db/src/load.ts; KARARLAR K-91): bugunku veri
 * canli ya da deneme veritabanina yuklenir; satis hareketleri hic, ornek
 * yorum, kupon ve bayi stoklari yalnizca denemeye. Tekrar calistirilabilir,
 * hicbir kaydi silmez, stogun uzerine yazmaz.
 */

afterAll(closePool);

const data: ZenweldDatabase = createSeedDatabase(Date.parse("2026-11-02T09:00:00Z"));

const load = (client: PoolClient, target: LoadTarget, mode: LoadMode = "tam", source = data) =>
  loadData(drizzle(client, { schema }), source, { target, mode });

const count = async (client: PoolClient, table: string) =>
  (await client.query(`SELECT count(*)::int AS n FROM ${table}`)).rows[0].n as number;

const total = (results: LoadResult[], key: "added" | "updated") => results.reduce((sum, r) => sum + r[key], 0);
const result = (results: LoadResult[], table: string) => results.find((r) => r.table === table);

/** Hic yuklenmeyen satis hareketleri ve sayaclar. */
const ACTIVITY = [
  "users",
  "addresses",
  "quotes",
  "orders",
  "return_requests",
  "coupon_redemptions",
  "service_requests",
  "warranties",
  "record_counters",
  "sap_sync_runs",
];
/** Yalnizca deneme veritabanina yuklenen ornekler. */
const SAMPLES = ["reviews", "coupons", "dealer_stock", "retailer_stock", "stock_imports"];

describe("veri yükleme (db:yukle)", () => {
  it("canlı: bugünkü veri satış hareketleri, örnek yorum, kupon, bayi stoğu ve depo stoğu olmadan birebir yüklenir", async () => {
    await inTransaction(async (client) => {
      await load(client, "canli");
      for (const table of [...ACTIVITY, ...SAMPLES]) expect(await count(client, table), table).toBe(0);

      // Site ve panel veritabanindan okuyunca yuklenen veriyi birebir gorur.
      const read = normalize(sorted(await readDatabase(drizzle(client, { schema })))) as Record<string, unknown>;
      const want = normalize(sorted(expected(loadableData(data, "canli")))) as Record<string, unknown>;
      for (const key of Object.keys(want)) expect(read[key], key).toEqual(want[key]);
      expect((want.products as unknown[]).length).toBe(data.products.length);
      // Depo stogu canlida yalnizca SAP okumasindan gelir (K-122).
      expect(await count(client, "warehouse_stock")).toBe(0);
      expect(data.warehouseStock.length).toBeGreaterThan(0);
    });
  });

  it("deneme: ayrıca örnek yorumlar, kuponlar ve bayi stok listeleri; yorumlar üyeye bağlanmaz", async () => {
    await inTransaction(async (client) => {
      await load(client, "deneme");
      for (const table of ACTIVITY) expect(await count(client, table), table).toBe(0);
      expect(await count(client, "reviews")).toBe(data.reviews.length);
      expect(await count(client, "coupons")).toBe(data.coupons.length);
      expect(await count(client, "dealer_stock")).toBe(data.dealerStock.length);
      expect(await count(client, "retailer_stock")).toBe(data.retailerStock.length);
      expect(await count(client, "reviews WHERE user_id IS NOT NULL")).toBe(0);
      expect(await count(client, "warehouse_stock")).toBe(data.warehouseStock.length);
    });
  });

  it("tekrar çalıştırmak bir şey değiştirmez", async () => {
    await inTransaction(async (client) => {
      await load(client, "deneme");
      for (const target of ["deneme", "canli"] as const) {
        const again = await load(client, target);
        expect([total(again, "added"), total(again, "updated")], target).toEqual([0, 0]);
      }
    });
  });

  it("değişen kayıt güncellenir, yeni kayıt eklenir; veride olmayan kayıt ve üyeler silinmez", async () => {
    await inTransaction(async (client) => {
      await load(client, "canli");
      await user(client, "u-gercek", "gercek@ornek.com");
      await client.query("INSERT INTO faqs (id, question, answer, topic, position) VALUES ('sss-panel', 'Panelden?', 'Evet.', 'genel', 99)");

      const [changed, dropped] = data.products;
      const next: ZenweldDatabase = {
        ...data,
        products: [{ ...changed, priceExVat: changed.priceExVat + 100 }, ...data.products.slice(2)],
        faqs: [...data.faqs, { ...data.faqs[0], id: "sss-yeni", question: "Yeni soru?" }],
      };
      const results = await load(client, "canli", "tam", next);
      expect(result(results, "products")).toMatchObject({ added: 0, updated: 1 });
      expect(result(results, "faqs")).toMatchObject({ added: 1, updated: 0 });

      const price = await client.query("SELECT price_ex_vat::float AS p FROM products WHERE id = $1", [changed.id]);
      expect(price.rows[0].p).toBe(changed.priceExVat + 100);
      expect(await count(client, `products WHERE id = '${dropped.id}'`)).toBe(1);
      expect(await count(client, "faqs WHERE id = 'sss-panel'")).toBe(1);
      expect(await count(client, "users WHERE id = 'u-gercek'")).toBe(1);
    });
  });

  it("eksikler: var olan kayda dokunmaz, yalnızca olmayanı ekler", async () => {
    await inTransaction(async (client) => {
      await load(client, "canli");
      // Panelde degistirilmis gibi.
      await client.query("UPDATE products SET price_ex_vat = 1 WHERE id = $1", [data.products[0].id]);
      const next = { ...data, faqs: [...data.faqs, { ...data.faqs[0], id: "sss-yeni", question: "Yeni soru?" }] };

      const results = await load(client, "canli", "eksikler", next);
      expect([total(results, "added"), total(results, "updated")]).toEqual([1, 0]);
      const price = await client.query("SELECT price_ex_vat::float AS p FROM products WHERE id = $1", [data.products[0].id]);
      expect(price.rows[0].p).toBe(1);

      // Tam guncelleme ise veriyle ayni yapar.
      await load(client, "canli", "tam", next);
      const again = await client.query("SELECT price_ex_vat::float AS p FROM products WHERE id = $1", [data.products[0].id]);
      expect(again.rows[0].p).toBe(data.products[0].priceExVat);
    });
  });

  it("stoğun üzerine yazılmaz: depo stoğunu SAP, bayi stoğunu bayinin dosyası günceller", async () => {
    await inTransaction(async (client) => {
      await load(client, "deneme");
      const code = data.warehouseStock[0].sapItemCode;
      const dealer = data.dealerStock[0];
      await client.query("UPDATE warehouse_stock SET quantity = 777 WHERE sap_item_code = $1", [code]);
      await client.query("UPDATE dealer_stock SET quantity = 555 WHERE dealer_id = $1 AND product_id = $2 AND variant_id = $3", [
        dealer.dealerId,
        dealer.productId,
        dealer.variantId ?? "",
      ]);

      await load(client, "deneme");
      const sap = await client.query("SELECT quantity::float AS quantity FROM warehouse_stock WHERE sap_item_code = $1", [code]);
      const file = await client.query(
        "SELECT quantity FROM dealer_stock WHERE dealer_id = $1 AND product_id = $2 AND variant_id = $3",
        [dealer.dealerId, dealer.productId, dealer.variantId ?? ""],
      );
      expect([sap.rows[0].quantity, file.rows[0].quantity]).toEqual([777, 555]);
    });
  });

  it("çakışan kayıt yüklemeyi durdurur ve nedeni anlaşılır", async () => {
    await inTransaction(async (client) => {
      // Veritabaninda ayni urun koduyla baska bir urun var.
      await group(client, "g-test", "test-grubu");
      await category(client, "c-test", "g-test", "test-kategorisi");
      await product(client, "baska-urun", data.products[0].sku, "c-test");
      const error = await load(client, "canli").then(
        () => undefined,
        (e: { cause?: { message?: string }; message: string }) => e.cause?.message ?? e.message,
      );
      expect(error).toMatch(/Ürün kodu başka bir üründe ya da seçenekte kullanılıyor/);
    });
  });
});

describe("görseller dosya deposuna (db:yukle; packages/db/src/site-images.ts)", () => {
  const site = fileURLToPath(new URL("../../apps/zenweld-web/public", import.meta.url));
  const readSiteFile = (path: string) => readFile(join(site, path));
  const strings = (value: unknown): string[] =>
    typeof value === "string"
      ? [value]
      : Array.isArray(value)
        ? value.flatMap(strings)
        : value && typeof value === "object"
          ? Object.values(value).flatMap(strings)
          : [];

  it("ürün, haber, etkinlik ve anasayfa görselleri depoya kopyalanır, adresleri depo adresi olur; tasarım görselleri kalır; tekrar yüklemede aynı adres", async () => {
    const root = mkdtempSync(join(tmpdir(), "zenweld-yukleme-"));
    const storage = diskStorage(root);
    const before = new Set(strings(data).filter(isContentImage));
    expect(before.size).toBeGreaterThan(40);

    const first = await storeSiteImages(data, storage, readSiteFile);
    // Her adres bir kez okunur; icerigi ayni olan iki dosya tek dosya olarak yazilir.
    expect(first.copied + first.existing).toBe(before.size);
    expect(first.copied).toBeGreaterThan(40);
    expect(strings(first.data).filter(isContentImage)).toEqual([]);

    // Urun fotografi: depo adresi, dosya birebir.
    const original = data.products.find((p) => p.images[0]?.url.startsWith("/images/products/"))!;
    const moved = first.data.products.find((p) => p.id === original.id)!;
    expect(moved.images[0].url).toMatch(/^\/dosya\/gorsel\/2026\/11\/[0-9a-f]{16}\.webp$/);
    const key = uploadKeyOf(moved.images[0].url)!;
    expect(Buffer.from((await storage.get(key))!)).toEqual(await readSiteFile(original.images[0].url));
    // Haber kapagi, etkinlik logosu ve anasayfa tanitim gorseli de tasinir.
    expect(first.data.news[0].coverUrl).toMatch(/^\/dosya\/gorsel\//);
    expect(first.data.events.every((e) => !e.logoUrl.startsWith("/images/"))).toBe(true);
    // Tasarim gorselleri sitede kalir: kategori ve grup cizimleri, cizimli urunler.
    expect(first.data.categories.map((c) => c.image)).toEqual(data.categories.map((c) => c.image));
    expect(first.data.categoryGroups.map((g) => g.image)).toEqual(data.categoryGroups.map((g) => g.image));
    expect(strings(first.data).some((s) => s.startsWith("/images/categories/"))).toBe(true);
    // Veri degismez (kopyasi doner).
    expect(data.products.find((p) => p.id === original.id)!.images[0].url).toBe(original.images[0].url);

    // Tekrar: hicbir dosya yeniden yazilmaz, adresler ayni.
    const second = await storeSiteImages(data, storage, readSiteFile);
    expect([second.copied, second.existing]).toEqual([0, before.size]);
    expect(second.data).toEqual(first.data);

    // Yuklenince veritabaninda depo adresi.
    await inTransaction(async (client) => {
      await load(client, "canli", "tam", first.data);
      const row = await client.query("SELECT images FROM products WHERE id = $1", [original.id]);
      expect(row.rows[0].images[0].url).toBe(moved.images[0].url);
      expect(await count(client, "products WHERE images::text LIKE '%/images/products/%'")).toBe(0);
    });
  });

  it("sitede olmayan dosya yüklemeyi durdurur", async () => {
    const storage = diskStorage(mkdtempSync(join(tmpdir(), "zenweld-yukleme-")));
    const broken = { ...data, news: [{ ...data.news[0], coverUrl: "/images/news/olmayan.webp" }] };
    await expect(storeSiteImages(broken, storage, readSiteFile)).rejects.toThrow(/ENOENT/);
  });
});
