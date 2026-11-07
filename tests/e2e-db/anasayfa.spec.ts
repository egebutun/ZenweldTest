import type { Page } from "@playwright/test";
import { catalog, closeDatabase, expect, sql, test } from "./yardimci";

/**
 * ANASAYFA (veritabani modu; docs/WEBSITE-KULLANIM.md › 3, KARARLAR K-112)
 *
 * Guven seridindeki sayilar, kategori kartlari ve Force / Jasic seritleri
 * veritabanindan gelir. Demo modundaki hali: tests/e2e/anasayfa.spec.ts.
 */
test.afterAll(closeDatabase);
test.use({ viewport: { width: 1440, height: 900 } });

const section = (page: Page, title: string) =>
  page.locator("section").filter({ has: page.getByRole("heading", { level: 2, name: title, exact: true }) });

const price = (amount: number) =>
  new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);

test("anasayfa: güven şeridi, kategori kartları ve seri şeritleri veritabanından", async ({ page, problems }) => {
  const [{ count }] = await sql<{ count: number }>("SELECT count(*)::int AS count FROM dealers WHERE active");
  const [{ value: shop }] = await sql<{ value: { freeShippingThreshold: number } }>("SELECT value FROM settings WHERE key = 'shop'");
  const { products, categories } = await catalog();
  await page.goto("/");

  const trust = page.getByRole("region", { name: "Neden güvenle alışveriş" }).locator("ul").first();
  await expect(trust).toContainText(`${count}+Yetkili bayi ve servis noktası`);
  if (shop.freeShippingThreshold > 0) await expect(trust).toContainText(`${price(shop.freeShippingThreshold)}Üzeri siparişlerde ücretsiz kargo`);

  const cards = section(page, "Ne arıyorsunuz?");
  const equipment = categories.filter((c) => c.section === "ekipmanlar");
  await expect(cards.locator(`a[href^="/ekipmanlar/"]`)).toHaveCount(equipment.length);

  const active = products.filter((p) => p.active);
  const force = active.filter((p) => p.filterValues?.["model-serisi"]?.includes("force"));
  const jasic = active.filter((p) => p.brand === "Jasic");
  for (const p of force) await expect(section(page, "Force Serisi")).toContainText(p.name);
  for (const p of jasic) await expect(section(page, "Jasic Lazer Ürünleri")).toContainText(p.name);
  await expect(page.getByText("Yeni Gelenler")).toHaveCount(0);
  expect(problems).toEqual([]);
});
