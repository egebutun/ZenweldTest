import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { Pool, type PoolClient } from "pg";
import type { ZenweldDatabase } from "@zenweld/data";

/**
 * VERITABANI TESTLERI ICIN ORTAK PARCALAR
 *
 * Her test kendi islemi (transaction) icinde calisir ve sonunda geri alinir;
 * testler birbirinin verisini gormez.
 */

const envFile = fileURLToPath(new URL("../../apps/zenweld-web/.env.local", import.meta.url));
if (!process.env.TEST_DATABASE_URL && existsSync(envFile)) process.loadEnvFile(envFile);

export function testDatabaseUrl(): string {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) throw new Error("TEST_DATABASE_URL tanımlı değil (README › Veritabanı).");
  if (url === process.env.DATABASE_URL) throw new Error("TEST_DATABASE_URL, DATABASE_URL ile aynı olamaz: testler veritabanını siler.");
  return url;
}

let pool: Pool | undefined;

/** Testi bir islem icinde calistirir ve sonunda geri alir. */
export async function inTransaction(run: (db: PoolClient) => Promise<void>): Promise<void> {
  pool ??= new Pool({ connectionString: testDatabaseUrl() });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await run(client);
  } finally {
    await client.query("ROLLBACK");
    client.release();
  }
}

export async function closePool(): Promise<void> {
  await pool?.end();
  pool = undefined;
}

/** Sorgu hata vermeli; islem bozulmasin diye kayit noktasina donulur. Hata kodunu dondurur. */
export async function expectFailure(db: PoolClient, sql: string, params: unknown[] = []): Promise<{ code: string; message: string }> {
  await db.query("SAVEPOINT beklenen_hata");
  try {
    await db.query(sql, params);
  } catch (error) {
    await db.query("ROLLBACK TO SAVEPOINT beklenen_hata");
    const { code, message } = error as { code: string; message: string };
    return { code, message };
  }
  throw new Error(`Sorgu hata vermeliydi: ${sql}`);
}

/* Kucuk ornek kayitlar */

export async function group(db: PoolClient, id = "g1", slug = "kaynak-makineleri"): Promise<void> {
  await db.query(
    "INSERT INTO category_groups (id, section, slug, name, position) VALUES ($1, 'ekipmanlar', $2, 'Grup', 1)",
    [id, slug],
  );
}

export async function category(db: PoolClient, id = "c1", groupId = "g1", slug = `kategori-${id}`): Promise<void> {
  await db.query(
    "INSERT INTO categories (id, group_id, slug, name, description, position) VALUES ($1, $2, $3, 'Kategori', '', 1)",
    [id, groupId, slug],
  );
}

export async function product(db: PoolClient, id: string, sku: string, categoryId = "c1"): Promise<void> {
  await db.query(
    `INSERT INTO products (id, slug, sku, name, category_id, price_ex_vat, vat_rate, warranty_months)
     VALUES ($1, $1, $2, 'Ürün ' || $1, $3, 1000, 20, 24)`,
    [id, sku, categoryId],
  );
}

/** Tek secenekli urun: "Uzunluk" tanimi (3 m / 5 m) ve verilen varyantlar. */
export async function optionDefinition(db: PoolClient, id = "uzunluk", name = "Uzunluk"): Promise<void> {
  await db.query("INSERT INTO option_definitions (id, name, position) VALUES ($1, $2, 1)", [id, name]);
  await db.query(
    "INSERT INTO option_values (option_definition_id, id, label, position) VALUES ($1, '3-m', '3 m', 1), ($1, '5-m', '5 m', 2)",
    [id],
  );
}

export async function variant(db: PoolClient, productId: string, valueId: string, sku: string, definitionId = "uzunluk"): Promise<void> {
  await db.query(
    "INSERT INTO product_options (product_id, option_definition_id, position) VALUES ($1, $2, 0) ON CONFLICT DO NOTHING",
    [productId, definitionId],
  );
  await db.query(
    "INSERT INTO product_variants (product_id, id, combination_key, sku, position) VALUES ($1, $2, $3, $4, 0)",
    [productId, valueId, `${definitionId}=${valueId}`, sku],
  );
  await db.query(
    "INSERT INTO product_variant_values (product_id, variant_id, option_definition_id, option_value_id) VALUES ($1, $2, $3, $2)",
    [productId, valueId, definitionId],
  );
}

export async function user(db: PoolClient, id: string, email: string): Promise<void> {
  await db.query(
    `INSERT INTO users (id, role, email, password_hash, first_name, last_name, phone)
     VALUES ($1, 'individual', $2, 'ozet', 'Ad', 'Soyad', '05550000000')`,
    [id, email],
  );
}

/* Okunan veriyle bugunku verinin karsilastirilmasi (okuma ve yukleme testleri) */

const ISO_DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

/**
 * Karsilastirma bicimi: bos alanlar (undefined) yok sayilir; tarih-saatler
 * ayni an olarak karsilastirilir ("…+03:00" ile "…Z" ayni an).
 */
export function normalize(value: unknown): unknown {
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
export function sorted(db: ZenweldDatabase): ZenweldDatabase {
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
export function expected(db: ZenweldDatabase): ZenweldDatabase {
  return {
    ...db,
    blogPosts: db.blogPosts.map((b) => ({ ...b, active: b.active ?? true })),
    pageSeo: db.pageSeo ?? {},
  };
}
