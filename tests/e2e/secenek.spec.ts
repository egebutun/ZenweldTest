import { addTestOptions, expect, test } from "./yardimci";

/**
 * BIRDEN COK SECENEKLI URUN (docs/IS-KURALLARI.md › 3, KABUL-KONTROL-LISTESI › 5)
 *
 * Sitenin secenek isleyisini dener; urunlerin gercek secenekleri (torc
 * uzunluklari, kutu icerigi) bu testin konusu degildir. Seceneksiz bir
 * ekipmana deneme secenekleri kurulur (yardimci.ts › addTestOptions); Su
 * kombinasyonu secilince galeri onun fotografina gecer.
 */
test("iki seçenekli üründe kombinasyon seçilir ve sepete o kodla girer", async ({ page, problems }) => {
  const slug = "ultimate-255-mma";
  await page.goto(`/urun/${slug}`);
  await addTestOptions(page, slug);

  const main = page.locator("main");
  await expect(main).toContainText("Deneme Soğutma");
  await expect(main).toContainText("ZW-E2E-H3");

  // Su · 3 m satilmiyor: Su secilince Su · 4 m'ye gecilir, 3 m soluk kalir.
  const photo = main.locator("img").first();
  await expect(photo).toHaveAttribute("src", /mma-ortulu-elektrod-kaynak-makineleri\.svg/);
  await page.getByRole("button", { name: "Su Soğutmalı", exact: true }).click();
  await expect(main).toContainText("ZW-E2E-S4");
  await expect(photo).toHaveAttribute("src", /ultimate-405-mts-su-sogutmali\.webp/);
  await expect(page).toHaveURL(/secenek=su_4-m/);
  await expect(page.getByRole("button", { name: "3 m", exact: true })).toHaveAttribute("title", /satılmıyor/);

  await page.getByRole("button", { name: "Sepete Ekle" }).first().click();
  await page.goto("/sepet");
  await expect(main).toContainText("ZW-E2E-S4");
  await expect(main).toContainText("Deneme Soğutma: Su Soğutmalı · Deneme Uzunluk: 4 m");

  // Link kombinasyonla acilir.
  await page.goto(`/urun/${slug}?secenek=hava_4-m`);
  await expect(main).toContainText("ZW-E2E-H4");
  expect(problems).toEqual([]);
});
