import { afterAll, describe, expect, it } from "vitest";
import { drizzle } from "drizzle-orm/node-postgres";
import type { PoolClient } from "pg";
import { createSeedDatabase, type ZenweldDatabase } from "@zenweld/data";
import * as schema from "../../packages/db/src/schema";
import { seedDatabase } from "../../packages/db/src/seed";
import { closePool, inTransaction } from "./ortak";

/*
 * npm run db:seed: sitenin ornek verisi (packages/data) tablolara hatasiz
 * yuklenir ve tablolar veriyle ayni sayida, ayni baglarla dolar
 * (docs/SUNUCU.md › 5). Her test kendi isleminde yukler, sonunda geri alir.
 */

afterAll(closePool);

const data: ZenweldDatabase = createSeedDatabase(Date.parse("2026-11-02T09:00:00Z"));

async function seeded(run: (db: PoolClient, counts: Record<string, number>) => Promise<void>): Promise<void> {
  await inTransaction(async (db) => {
    const counts = await seedDatabase(drizzle(db, { schema }), data);
    await run(db, counts);
  });
}

const count = async (db: PoolClient, sql: string, params: unknown[] = []) =>
  (await db.query(`SELECT count(*)::int AS n FROM ${sql}`, params)).rows[0].n as number;

const sum = <T>(rows: T[], n: (row: T) => number) => rows.reduce((total, row) => total + n(row), 0);

describe("örnek veri (db:seed)", () => {
  it("bütün kayıtlar hatasız yüklenir; tablolardaki satır sayısı veriyle aynı", async () => {
    await seeded(async (db, counts) => {
      const expected: Record<string, number> = {
        category_groups: data.categoryGroups.length,
        categories: data.categories.length,
        option_definitions: data.optionDefinitions.length,
        option_values: sum(data.optionDefinitions, (d) => d.values.length),
        products: data.products.length,
        product_variants: sum(data.products, (p) => p.options?.variants.length ?? 0),
        dealers: data.dealers.length,
        retailers: data.retailers.length,
        dealer_stock: data.dealerStock.length,
        retailer_stock: data.retailerStock.length,
        users: data.users.length,
        addresses: data.addresses.length,
        quotes: data.quotes.length,
        quote_items: sum(data.quotes, (q) => q.items.length),
        orders: data.orders.length,
        order_items: sum(data.orders, (o) => o.items.length),
        order_status_history: sum(data.orders, (o) => o.history.length),
        shipments: data.orders.filter((o) => o.shipment).length,
        coupons: data.coupons.length,
        service_requests: data.serviceRequests.length,
        warranties: data.warranties.length,
        reviews: data.reviews.length,
        blog_posts: data.blogPosts.length,
        legal_pages: data.legalPages.length,
        warehouse_stock: data.warehouseStock.length,
      };
      for (const [table, n] of Object.entries(expected)) {
        expect(await count(db, table), table).toBe(n);
        expect(counts[table], table).toBe(n);
      }
    });
  });

  it("ürün ve varyant kodları tek havuza yazılır", async () => {
    await seeded(async (db) => {
      const variants = sum(data.products, (p) => p.options?.variants.length ?? 0);
      expect(await count(db, "sku_codes")).toBe(data.products.length + variants);
    });
  });

  it("ürün kategorisine, kategori grubuna kimlikle bağlanır; linkler aynı kalır", async () => {
    await seeded(async (db) => {
      const { rows } = await db.query(
        `SELECT p.id, c.slug AS category, g.slug AS "group", g.section
           FROM products p JOIN categories c ON c.id = p.category_id JOIN category_groups g ON g.id = c.group_id`,
      );
      expect(rows).toHaveLength(data.products.length);
      for (const row of rows) {
        const product = data.products.find((p) => p.id === row.id)!;
        const category = data.categories.find((c) => c.slug === product.categorySlug)!;
        expect([row.category, row.group, row.section]).toEqual([category.slug, category.group, product.section]);
      }
    });
  });

  it("seçenekli ürünün kombinasyonları ve değerleri; kombinasyon yazımı tanım=değer", async () => {
    await seeded(async (db) => {
      const product = data.products.find((p) => (p.options?.optionIds.length ?? 0) > 1)!;
      const variant = product.options!.variants[0];
      const { rows } = await db.query(
        "SELECT combination_key, sku FROM product_variants WHERE product_id = $1 AND id = $2",
        [product.id, variant.id],
      );
      expect(rows[0]).toEqual({
        combination_key: product.options!.optionIds.map((id) => `${id}=${variant.values[id]}`).join("|"),
        sku: variant.sku,
      });
      expect(await count(db, "product_variant_values WHERE product_id = $1 AND variant_id = $2", [product.id, variant.id])).toBe(
        product.options!.optionIds.length,
      );
    });
  });

  it("siparişin tutarları, adresi, ödemesi ve kargosu veriyle aynı; JSON alan adları uygulamadaki gibi", async () => {
    await seeded(async (db) => {
      const order = data.orders.find((o) => o.shipment && o.payment.method === "card")!;
      const { rows } = await db.query(
        `SELECT o.total::float, o.subtotal::float, o.shipping_address, o.payment_method, o.card_last4,
                s.tracking_number, s.carrier_id
           FROM orders o JOIN shipments s ON s.order_id = o.id WHERE o.id = $1`,
        [order.id],
      );
      expect(rows[0]).toMatchObject({
        total: order.total,
        subtotal: order.subtotal,
        shipping_address: order.shippingAddress,
        payment_method: "card",
        card_last4: order.payment.cardLast4 ?? null,
        tracking_number: order.shipment!.trackingNumber,
      });
      expect(rows[0].carrier_id).not.toBeNull();
      const pos = await db.query("SELECT installments FROM payment_pos ORDER BY position LIMIT 1");
      expect(pos.rows[0].installments).toEqual(data.settings.shop.pos[0].installments);
    });
  });

  it("silinmiş ürüne bağlı kopya satırlarda bağ boş, ad ve kod kopyası durur", async () => {
    await seeded(async (db) => {
      const ids = new Set(data.products.map((p) => p.id));
      const missing = sum(data.quotes, (q) => q.items.filter((i) => !ids.has(i.productId)).length);
      expect(await count(db, "quote_items WHERE product_id IS NULL")).toBe(missing);
      expect(await count(db, "quote_items WHERE product_name = '' OR product_name IS NULL")).toBe(0);
      const orderMissing = sum(data.orders, (o) => o.items.filter((i) => !ids.has(i.productId)).length);
      expect(await count(db, "order_items WHERE product_id IS NULL")).toBe(orderMissing);
    });
  });

  it("kuponların kapsamı ve kişiye özel e-postaları; depo stoğu bir SAP okumasına bağlı", async () => {
    await seeded(async (db) => {
      expect(await count(db, "coupon_targets")).toBe(sum(data.coupons, (c) => c.productIds.length + c.categoryIds.length));
      expect(await count(db, "coupon_customers")).toBe(sum(data.coupons, (c) => c.customerEmails.length));
      expect(await count(db, "coupons WHERE audience = 'customers'")).toBe(
        data.coupons.filter((c) => c.audience === "customers").length,
      );
      expect(await count(db, "warehouse_stock w JOIN sap_sync_runs r ON r.id = w.sync_run_id WHERE r.status = 'success'")).toBe(
        data.warehouseStock.length,
      );
    });
  });
});
