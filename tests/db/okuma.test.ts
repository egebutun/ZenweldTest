import { afterAll, describe, expect, it } from "vitest";
import { drizzle } from "drizzle-orm/node-postgres";
import { createSeedDatabase, type ZenweldDatabase } from "@zenweld/data";
import * as schema from "../../packages/db/src/schema";
import { readCatalog, readDatabase, readSettings } from "../../packages/db/src/read";
import { seedDatabase } from "../../packages/db/src/seed";
import { closePool, inTransaction } from "./ortak";

/*
 * Okuma katmani (packages/db/src/read.ts): ornek veri tablolara yazilip geri
 * okununca sitenin kullandigi veriyle birebir ayni cikar (gidis-donus).
 * Boylece site ve panel veritabanina baglandiginda ayni kayitlari gorur.
 */

afterAll(closePool);

const data: ZenweldDatabase = createSeedDatabase(Date.parse("2026-11-02T09:00:00Z"));

const ISO_DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

/**
 * Karsilastirma bicimi: bos alanlar (undefined) yok sayilir; tarih-saatler
 * ayni an olarak karsilastirilir ("…+03:00" ile "…Z" ayni an).
 */
function normalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, normalize(v)]),
    );
  }
  if (typeof value === "string" && ISO_DATE_TIME.test(value)) return new Date(value).toISOString();
  return value;
}

/** Listelerin sirasi anlam tasimayanlar kimlige gore siralanir; sirali olanlar (SSS, belgeler) oldugu gibi kalir. */
function sorted(db: ZenweldDatabase): ZenweldDatabase {
  const by = <T>(rows: T[], key: (row: T) => string) => [...rows].sort((a, b) => key(a).localeCompare(key(b)));
  return {
    ...db,
    products: by(db.products, (p) => p.id),
    categories: by(db.categories, (c) => c.id),
    categoryGroups: by(db.categoryGroups, (g) => g.id),
    optionDefinitions: by(db.optionDefinitions, (d) => d.id),
    dealers: by(db.dealers, (d) => d.id),
    retailers: by(db.retailers, (r) => r.id),
    dealerStock: by(db.dealerStock, (r) => `${r.dealerId}|${r.productId}|${r.variantId ?? ""}`),
    retailerStock: by(db.retailerStock, (r) => `${r.retailerId}|${r.productId}|${r.variantId ?? ""}`),
    stockImports: by(db.stockImports, (i) => i.id),
    skuAliases: by(db.skuAliases, (a) => `${a.sourceId}|${a.code}`),
    warehouseStock: by(db.warehouseStock, (r) => r.sapItemCode),
    users: by(db.users, (u) => u.id),
    addresses: by(db.addresses, (a) => a.id),
    quotes: by(db.quotes, (q) => q.id),
    orders: by(db.orders, (o) => o.id),
    coupons: by(db.coupons, (c) => c.id),
    couponRedemptions: by(db.couponRedemptions, (r) => r.orderId),
    blogPosts: by(db.blogPosts, (b) => b.id),
    events: by(db.events, (e) => e.id),
    news: by(db.news, (n) => n.id),
    reviews: by(db.reviews, (r) => r.id),
    warranties: by(db.warranties, (w) => w.id),
    salesReps: by(db.salesReps, (r) => r.id),
    legalPages: by(db.legalPages, (l) => l.id),
    serviceRequests: by(db.serviceRequests, (r) => r.id),
    returnRequests: by(db.returnRequests, (r) => r.id),
    documentPages: by(db.documentPages, (p) => p.section),
  };
}

/**
 * Bugunku veride bilerek farkli tutulanlar: eski blog kayitlarinda "yayinda"
 * alani yoksa yayinda sayilir; sayfa SEO kaydi yoksa bos liste.
 */
function expected(db: ZenweldDatabase): ZenweldDatabase {
  return {
    ...db,
    blogPosts: db.blogPosts.map((b) => ({ ...b, active: b.active ?? true })),
    pageSeo: db.pageSeo ?? {},
  };
}

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

  it("mağaza ayarları: POS sırası, taksitler, havale hesapları ve kargo firmaları", async () => {
    await inTransaction(async (client) => {
      const db = drizzle(client, { schema });
      await seedDatabase(db, data);
      expect(await readSettings(db)).toEqual(normalize(data.settings));
    });
  });
});
