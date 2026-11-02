import { changeDb, expect, test } from "./yardimci";

/**
 * BIRDEN COK SECENEKLI URUN (docs/IS-KURALLARI.md › 3, KABUL-KONTROL-LISTESI › 5)
 *
 * Sitenin secenek isleyisini dener; urunlerin gercek secenekleri (torc
 * uzunluklari, kutu icerigi) bu testin konusu degildir. Test, seceneksiz bir
 * ekipmana yalnizca bu tarayicida gecerli iki deneme secenegi kurar (ornek
 * veriden bagimsiz): Deneme Soğutma (Hava / Su) ve Deneme Uzunluk (3 m / 4 m);
 * "Su · 3 m" satilmaz. Su kombinasyonunun kendi fotografi var; secilince
 * galeri ona gecer.
 */
test("iki seçenekli üründe kombinasyon seçilir ve sepete o kodla girer", async ({ page, problems }) => {
  const slug = "ultimate-255-mma";
  await page.goto(`/urun/${slug}`);
  await changeDb(page, (db) => {
    db.optionDefinitions.push(
      {
        id: "e2e-sogutma",
        name: "Deneme Soğutma",
        values: [
          { id: "hava", label: "Hava Soğutmalı" },
          { id: "su", label: "Su Soğutmalı" },
        ],
      },
      {
        id: "e2e-uzunluk",
        name: "Deneme Uzunluk",
        values: [
          { id: "3-m", label: "3 m" },
          { id: "4-m", label: "4 m" },
        ],
      },
    );
    const product = db.products.find((p) => p.slug === slug)!;
    product.images = [
      { url: "/images/categories/mma-ortulu-elektrod-kaynak-makineleri.svg", alt: "Hava" },
      { url: "/images/products/ultimate-405-mts-su-sogutmali.webp", alt: "Su" },
    ];
    const row = (cooling: string, length: string, sku: string) => ({
      id: `${cooling}_${length}`,
      values: { "e2e-sogutma": cooling, "e2e-uzunluk": length },
      sku,
      priceDeltaExVat: 0,
      ...(cooling === "su" ? { image: product.images[1].url } : {}),
    });
    product.options = {
      optionIds: ["e2e-sogutma", "e2e-uzunluk"],
      variants: [row("hava", "3-m", "ZW-E2E-H3"), row("hava", "4-m", "ZW-E2E-H4"), row("su", "4-m", "ZW-E2E-S4")],
    };
  });

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
