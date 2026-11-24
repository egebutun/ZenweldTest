import { catalog, closeDatabase, expect, expectedOffer, test } from "./yardimci";

/**
 * KARTTA SEPETE EKLE VERITABANINDA (KARARLAR K-126, K-110)
 *
 * Kategori sayfasindaki kartta: secenekli urunde hizli secim penceresi
 * (secenek ve adet), seceneksiz urunde karttaki adet. Fiyat ve stok
 * veritabanindan; sepete secilen kombinasyon ve adet girer. Demo modundaki
 * hali: tests/e2e/secenek.spec.ts.
 */
test.afterAll(closeDatabase);

test("kartta Sepete Ekle: hızlı seçim penceresi ve karttaki adet; sepette seçilen kombinasyon ve adet", async ({ page, problems }) => {
  const { products, warehouseStock } = await catalog();
  const mts = products.find((p) => p.slug === "ultimate-405-mts")!;
  const offer = expectedOffer(mts, warehouseStock, new Date(), "hava_4-m_10-m");
  expect(offer.inStock, "Ultimate 405 MTS hava · 4 m · 10 m depoda olmalı").toBe(true);

  await page.goto("/ekipmanlar/kaynak-makineleri/mig-gazalti-kaynak-makineleri");
  const card = page.locator("div.group").filter({ has: page.getByRole("heading", { name: mts.name, exact: true }) });
  const dialog = page.getByRole("dialog");
  await card.getByRole("button", { name: "Artır" }).click();
  await card.getByRole("button", { name: "Sepete Ekle" }).click();
  await expect(dialog.getByRole("spinbutton", { name: "Adet" })).toHaveValue("2");
  await dialog.getByRole("button", { name: "4 m", exact: true }).click();
  await dialog.getByRole("button", { name: "10 m", exact: true }).click();
  // Pencerede secilen kombinasyonun fiyati (veritabanindaki fiyat ve kampanya).
  await expect(dialog).toContainText(offer.price.toLocaleString("tr-TR"));
  await dialog.getByRole("button", { name: "Artır" }).click();
  await dialog.getByRole("button", { name: "Sepete Ekle" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(card.getByRole("button", { name: "Sepete eklendi" })).toBeVisible();

  // Seceneksiz urun: pencere acilmaz, karttaki adet eklenir.
  const plain = products.find((p) => p.slug === "forcemig-200")!;
  expect(expectedOffer(plain, warehouseStock).inStock, "ForceMIG 200 depoda olmalı").toBe(true);
  await page.goto("/ekipmanlar/kaynak-makineleri/cok-fonksiyonlu-kaynak-makineleri");
  const plainCard = page.locator("div.group").filter({ has: page.getByRole("heading", { name: plain.name, exact: true }) });
  await plainCard.getByRole("button", { name: "Artır" }).click();
  await plainCard.getByRole("button", { name: "Sepete Ekle" }).click();
  await expect(plainCard.getByRole("button", { name: "Sepete eklendi" })).toBeVisible();
  await expect(dialog).toHaveCount(0);

  await page.goto("/sepet");
  const main = page.locator("main");
  await expect(main).toContainText("Soğutma: Hava Soğutmalı · Torç Uzunluğu: 4 m · Ara Paket Uzunluğu: 10 m");
  await expect(main).toContainText(plain.name);
  const quantities = main.getByRole("spinbutton", { name: "Adet" });
  await expect(quantities).toHaveCount(2);
  expect(await quantities.evaluateAll((els) => els.map((e) => (e as HTMLInputElement).value))).toEqual(["3", "2"]);
  expect(problems).toEqual([]);
});
