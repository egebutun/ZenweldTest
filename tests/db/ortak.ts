import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { Pool, type PoolClient } from "pg";

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
