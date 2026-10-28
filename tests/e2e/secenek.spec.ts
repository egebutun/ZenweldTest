import { changeDb, expect, test } from "./yardimci";

/**
 * BIRDEN COK SECENEKLI URUN (docs/IS-KURALLARI.md › 3, KABUL-KONTROL-LISTESI › 3)
 *
 * Test kendi iki secenekli urununu kurar (ornek veriden bagimsiz): MB-36
 * torcuna Soğutma (Hava / Su) eklenir; "Su · 3 m" satilmaz.
 */
test("iki seçenekli üründe kombinasyon seçilir ve sepete o kodla girer", async ({ page, problems }) => {
  await page.goto("/urun/mig-torcu-mb36");
  await changeDb(page, (db) => {
    db.optionDefinitions.push({
      id: "e2e-sogutma",
      name: "Soğutma",
      values: [
        { id: "hava", label: "Hava Soğutmalı" },
        { id: "su", label: "Su Soğutmalı" },
      ],
    });
    const torch = db.products.find((p) => p.slug === "mig-torcu-mb36")!;
    const row = (cooling: string, length: string, sku: string) => ({
      id: `${cooling}_${length}`,
      values: { "e2e-sogutma": cooling, "hortum-uzunlugu": length },
      sku,
      priceDeltaExVat: 0,
    });
    torch.options = {
      optionIds: ["e2e-sogutma", "hortum-uzunlugu"],
      variants: [row("hava", "3-m", "ZW-E2E-H3"), row("hava", "4-m", "ZW-E2E-H4"), row("su", "4-m", "ZW-E2E-S4")],
    };
  });

  const main = page.locator("main");
  await expect(main).toContainText("Soğutma");
  await expect(main).toContainText("ZW-E2E-H3");

  // Su · 3 m satilmiyor: Su secilince Su · 4 m'ye gecilir, 3 m soluk kalir.
  await page.getByRole("button", { name: "Su Soğutmalı" }).click();
  await expect(main).toContainText("ZW-E2E-S4");
  await expect(page).toHaveURL(/secenek=su_4-m/);
  await expect(page.getByRole("button", { name: "3 m", exact: true })).toHaveAttribute("title", /satılmıyor/);

  await page.getByRole("button", { name: "Sepete Ekle" }).first().click();
  await page.goto("/sepet");
  await expect(main).toContainText("ZW-E2E-S4");
  await expect(main).toContainText("Soğutma: Su Soğutmalı · Hortum Uzunluğu: 4 m");

  // Link kombinasyonla acilir.
  await page.goto("/urun/mig-torcu-mb36?secenek=hava_4-m");
  await expect(main).toContainText("ZW-E2E-H4");
  expect(problems).toEqual([]);
});
