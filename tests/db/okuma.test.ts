import { afterAll, describe, expect, it } from "vitest";
import { drizzle } from "drizzle-orm/node-postgres";
import { createSeedDatabase, type ZenweldDatabase } from "@zenweld/data";
import * as schema from "../../packages/db/src/schema";
import {
  readCatalog,
  readDatabase,
  readProductStock,
  readPublishedReviews,
  readSettings,
} from "../../packages/db/src/read";
import { seedDatabase } from "../../packages/db/src/seed";
import { closePool, expected, inTransaction, normalize, sorted } from "./ortak";

/*
 * Okuma katmani (packages/db/src/read.ts): ornek veri tablolara yazilip geri
 * okununca sitenin kullandigi veriyle birebir ayni cikar (gidis-donus).
 * Boylece site ve panel veritabanina baglandiginda ayni kayitlari gorur.
 */

afterAll(closePool);

const data: ZenweldDatabase = createSeedDatabase(Date.parse("2026-11-02T09:00:00Z"));

describe("okuma katmanı (gidiş-dönüş)", () => {
  it("tablolara yazılan örnek veri geri okununca birebir aynı", async () => {
    await inTransaction(async (client) => {
      const db = drizzle(client, { schema });
      await seedDatabase(db, data);
      const read = await readDatabase(db);
      const actual = normalize(sorted(read)) as Record<string, unknown>;
      const want = normalize(sorted(expected(data))) as Record<string, unknown>;
      // Kayit turu basina karsilastirilir: fark varsa hangi turde oldugu gorunur.
      for (const key of Object.keys(want)) expect(actual[key], key).toEqual(want[key]);
      expect(Object.keys(actual).sort()).toEqual(Object.keys(want).sort());
    });
  });

  it("katalog tek başına okunabilir: ürün kategorisi, bölümü, seçenekleri ve filtreleri yerinde", async () => {
    await inTransaction(async (client) => {
      const db = drizzle(client, { schema });
      await seedDatabase(db, data);
      const catalog = await readCatalog(db);
      const withOptions = data.products.find((p) => (p.options?.optionIds.length ?? 0) > 1)!;
      const read = catalog.products.find((p) => p.id === withOptions.id)!;
      expect([read.section, read.categorySlug]).toEqual([withOptions.section, withOptions.categorySlug]);
      expect(read.options).toEqual(normalize(withOptions.options));
      // Sitedeki siralama: kategori ve gruplar kendi sirasiyla gelir.
      const groupOrders = catalog.categoryGroups.filter((g) => g.section === "ekipmanlar").map((g) => g.order);
      expect(groupOrders).toEqual([...groupOrders].sort((a, b) => a - b));
    });
  });

  it("ürün sayfasının stoğu: yalnızca o ürünün adedi 0'dan büyük bayi ve satıcı satırları", async () => {
    await inTransaction(async (client) => {
      const db = drizzle(client, { schema });
      await seedDatabase(db, data);
      const product = data.products.find(
        (p) =>
          data.dealerStock.some((r) => r.productId === p.id && r.quantity === 0) &&
          data.retailerStock.some((r) => r.productId === p.id && r.quantity > 0),
      )!;
      const stock = await readProductStock(db, product.id);
      const bySource = <T extends { variantId?: string }>(rows: T[], source: (row: T) => string) =>
        normalize([...rows].sort((a, b) => `${source(a)}|${a.variantId ?? ""}`.localeCompare(`${source(b)}|${b.variantId ?? ""}`)));
      const wanted = <T extends { productId: string; quantity: number }>(rows: T[]) =>
        rows.filter((r) => r.productId === product.id && r.quantity > 0);
      expect(bySource(stock.dealerStock, (r) => r.dealerId)).toEqual(bySource(wanted(data.dealerStock), (r) => r.dealerId));
      expect(bySource(stock.retailerStock, (r) => r.retailerId)).toEqual(
        bySource(wanted(data.retailerStock), (r) => r.retailerId),
      );
      expect(stock.dealerStock.length).toBeGreaterThan(0);
    });
  });

  it("yorumlar: ürünün yayındaki yorumları ve anasayfada öne çıkanlar; onay bekleyen gitmez", async () => {
    await inTransaction(async (client) => {
      const db = drizzle(client, { schema });
      await seedDatabase(db, data);
      const ids = (rows: { id: string }[]) => rows.map((r) => r.id).sort();
      const product = data.reviews.find((r) => r.approved)!.productId;
      expect(ids(await readPublishedReviews(db, { productId: product }))).toEqual(
        ids(data.reviews.filter((r) => r.productId === product && r.approved)),
      );
      expect(ids(await readPublishedReviews(db, { featured: true }))).toEqual(
        ids(data.reviews.filter((r) => r.approved && r.featured && r.productId)),
      );
      // Onay bekleyen yorum hicbir sorguda donmez.
      await client.query("UPDATE reviews SET approved = false WHERE product_id = $1", [product]);
      expect(await readPublishedReviews(db, { productId: product })).toEqual([]);
    });
  });

  it("mağaza ayarları: POS sırası, taksitler, havale hesapları ve kargo firmaları", async () => {
    await inTransaction(async (client) => {
      const db = drizzle(client, { schema });
      await seedDatabase(db, data);
      expect(await readSettings(db)).toEqual(normalize(data.settings));
    });
  });
});
