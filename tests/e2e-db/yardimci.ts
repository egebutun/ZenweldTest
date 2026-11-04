import { writeFile } from "node:fs/promises";
import type { APIRequestContext, Page } from "@playwright/test";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { isInWarehouse, salePriceExVat, warehouseStockMap, type Product, type WarehouseStockRow } from "@zenweld/data";
import { readCatalog, readWarehouseStock } from "../../packages/db/src/read";
import * as schema from "../../packages/db/src/schema";
import { demoAccount, expect, test } from "../e2e/yardimci";

/**
 * VERITABANI MODUNUN TARAYICI TESTLERI ICIN ORTAK PARCALAR
 *
 * Testler npm run test:e2e:db ile calisir (scripts/e2e-db.mts): site test
 * veritabanindan (TEST_DATABASE_URL) okur. Testler beklenen degerleri ayni
 * veritabanindan ve sitenin kendi kurallariyla (packages/data) hesaplar.
 */
export { expect, test };

let pool: Pool | undefined;

export function database(): Pool {
  pool ??= new Pool({ connectionString: process.env.TEST_DATABASE_URL });
  return pool;
}

export async function closeDatabase(): Promise<void> {
  await pool?.end();
  pool = undefined;
}

export async function sql<T = Record<string, unknown>>(text: string, params: unknown[] = []): Promise<T[]> {
  return (await database().query(text, params)).rows as T[];
}

/** Katalog ve Zenweld depo stogu, sitenin okudugu sekliyle. */
export async function catalog() {
  const db = drizzle(database(), { schema });
  return { ...(await readCatalog(db)), warehouseStock: await readWarehouseStock(db) };
}

/** Musterinin odeyecegi fiyat (KDV dahil, kampanyali) ve stok durumu. */
export function expectedOffer(product: Product, stock: WarehouseStockRow[], now = new Date()) {
  return {
    price: Math.round(salePriceExVat(product, now) * (1 + product.vatRate / 100)),
    inStock: isInWarehouse(product, warehouseStockMap(stock)),
  };
}

/** Urun sayfasinin arama motoruna verdigi fiyat ve stok bilgisi (yapisal veri). */
export async function offerOnPage(request: APIRequestContext, path: string) {
  const html = await (await request.get(path)).text();
  const data = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)]
    .map((m) => JSON.parse(m[1]) as { "@type"?: string; offers?: { price?: number; availability?: string } })
    .find((d) => d["@type"] === "Product");
  return { price: data?.offers?.price, availability: data?.offers?.availability };
}

/** Siteyi beklemeden yeniler (Asama 3.6; anahtari scripts/e2e-db.mts verir). */
export async function refreshSite(request: APIRequestContext, kinds?: string[]): Promise<void> {
  const response = await request.post("/api/yenile", {
    headers: { authorization: `Bearer ${process.env.REVALIDATE_SECRET}` },
    data: kinds ? { kayitlar: kinds } : {},
  });
  expect(response.status()).toBe(200);
}

/**
 * SAP stok okumasi (deneme kaynagi): satirlar deneme dosyasina yazilir, sonra
 * okuma ucu cagrilir (anahtari ve dosyanin yolunu scripts/e2e-db.mts verir).
 */
export async function sapStockRead(
  request: APIRequestContext,
  lines: { code: string; name?: string | null; quantity: number | string }[] | string,
  options: { force?: boolean } = {},
) {
  const csv = typeof lines === "string" ? lines : ["kod;ad;miktar", ...lines.map((l) => `${l.code};${l.name ?? ""};${l.quantity}`)].join("\n");
  await writeFile(process.env.SAP_STOK_DOSYASI!, csv);
  const response = await request.post("/api/sap/stok", {
    headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
    data: options.force ? { zorla: true } : {},
  });
  return { status: response.status(), body: (await response.json()) as Record<string, unknown> };
}

/** Bireysel demo uyesiyle giris (hesap README'deki tablodan). */
export async function memberLogin(page: Page): Promise<void> {
  const { email, password } = demoAccount("Bireysel");
  await page.goto("/giris");
  // Yalnizca sayfanin formu: alt bilgideki bulten kutusu da e-posta alanidir.
  const form = page.locator("main form").filter({ has: page.locator("input[type=password]") });
  await form.locator("input[type=email]").fill(email);
  await form.locator("input[type=password]").fill(password);
  await form.locator("button[type=submit]").click();
  await expect(page).toHaveURL(/\/hesabim/);
}

/** Sayfa kaynagindaki (tarayiciya giden veri) bir alanin kac kez gectigi. */
export function countInPayload(html: string, key: string): number {
  return html.split(`\\"${key}\\":`).length - 1;
}
