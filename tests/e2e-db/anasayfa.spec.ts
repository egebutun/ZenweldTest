import type { Page } from "@playwright/test";
import { catalog, closeDatabase, expect, test } from "./yardimci";

/**
 * ANASAYFA (veritabani modu; docs/WEBSITE-KULLANIM.md › 3, KARARLAR K-47)
 *
 * Guven seridi sabit yazidir; kategori kartlari ve Force / Jasic seritleri
 * veritabanindan gelir. Demo modundaki hali: tests/e2e/anasayfa.spec.ts.
 */
test.afterAll(closeDatabase);
test.use({ viewport: { width: 1440, height: 900 } });

const section = (page: Page, title: string) =>
  page.locator("section").filter({ has: page.getByRole("heading", { level: 2, name: title, exact: true }) });

test("anasayfa: sabit güven şeridi; kategori kartları ve seri şeritleri veritabanından", async ({ page, problems }) => {
  const { products, categories } = await catalog();
  await page.goto("/");

  const trust = page.getByRole("region", { name: "Neden güvenle alışveriş" }).locator("ul").first();
  await expect(trust).toContainText("29+Yetkili bayi ve servis noktası");
  await expect(trust).toContainText("14 günİade hakkı");
  await expect(trust).toContainText("Havale & Kredi Kartı & Vadeli & ÇekÖdeme seçenekleri");

  const cards = section(page, "Ne arıyorsunuz?");
  const equipment = categories.filter((c) => c.section === "ekipmanlar");
  await expect(cards.locator(`a[href^="/ekipmanlar/"]`)).toHaveCount(equipment.length);

  const active = products.filter((p) => p.active);
  const force = active.filter((p) => p.filterValues?.["model-serisi"]?.includes("force"));
  const jasic = active.filter((p) => p.brand === "Jasic");
  for (const p of force) await expect(section(page, "Force Serisi")).toContainText(p.name);
  for (const p of jasic) await expect(section(page, "Jasic Lazer Ürünleri")).toContainText(p.name);
  expect(problems).toEqual([]);
});
