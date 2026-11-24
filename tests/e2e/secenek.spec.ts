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

/**
 * KARTTA SEPETE EKLE (KARARLAR K-126; KABUL-KONTROL-LISTESI › Ürün kartı)
 *
 * Kartta adet kutusu ve her urunde "Sepete Ekle". Secenekli urunde hizli
 * secim penceresi acilir (secenek ve adet; adet karttan gelir); seceneksiz
 * urun karttaki adetle dogrudan eklenir. Eklenince dugme 2 saniye "Sepete
 * eklendi" yazar, sonra yine "Sepete Ekle"; adet 1'e doner. Ornek veride
 * Ultimate 405 MTS'nin su sogutmali kombinasyonlari depoda yok.
 */
test("kartta Sepete Ekle: seçenekli üründe hızlı seçim penceresi, seçeneksizde karttaki adet; sepette ayrı satırlar", async ({ page, problems }) => {
  await page.goto("/ekipmanlar/kaynak-makineleri/mig-gazalti-kaynak-makineleri");
  const card = page.locator("div.group").filter({ has: page.getByRole("heading", { name: "Ultimate 405 MTS MIG Gazaltı Kaynak Makinesi", exact: true }) });
  const cardQuantity = card.getByRole("spinbutton", { name: "Adet" });
  const add = card.getByRole("button", { name: "Sepete Ekle" });
  const dialog = page.getByRole("dialog");

  // 1. kombinasyon, 2 adet: adet karttan pencereye gelir; ilk kombinasyon secili.
  await card.getByRole("button", { name: "Artır" }).click();
  await expect(cardQuantity).toHaveValue("2");
  await add.click();
  await expect(dialog).toContainText("Ultimate 405 MTS MIG Gazaltı Kaynak Makinesi");
  await expect(dialog.getByRole("spinbutton", { name: "Adet" })).toHaveValue("2");
  await expect(dialog.getByRole("button", { name: "Hava Soğutmalı" })).toHaveAttribute("aria-pressed", "true");
  await expect(dialog.getByRole("button", { name: "3 m", exact: true })).toHaveAttribute("aria-pressed", "true");
  await dialog.getByRole("button", { name: "Sepete Ekle" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(card.getByRole("button", { name: "Sepete eklendi" })).toBeVisible();
  await expect(cardQuantity).toHaveValue("1");
  await expect(page.getByRole("link", { name: "Sepetim" })).toContainText("2");
  await expect(add).toBeVisible({ timeout: 5_000 });

  // Depoda olmayan kombinasyon eklenmez; baska kombinasyon 3 adet.
  await add.click();
  await dialog.getByRole("button", { name: "Su Soğutmalı" }).click();
  await expect(dialog.getByRole("button", { name: "STOKTA YOK" })).toBeDisabled();
  await dialog.getByRole("button", { name: "Hava Soğutmalı" }).click();
  await dialog.getByRole("button", { name: "4 m", exact: true }).click();
  await dialog.getByRole("button", { name: "10 m", exact: true }).click();
  await dialog.getByRole("button", { name: "Artır" }).click();
  await dialog.getByRole("button", { name: "Artır" }).click();
  await dialog.getByRole("button", { name: "Sepete Ekle" }).click();
  await expect(dialog).toHaveCount(0);

  // Seceneksiz urun: pencere acilmaz, karttaki adet eklenir.
  await page.goto("/ekipmanlar/kaynak-makineleri/cok-fonksiyonlu-kaynak-makineleri");
  const plain = page.locator("div.group").filter({ has: page.getByRole("heading", { name: "ForceMIG 200 Çok Fonksiyonlu Kaynak Makinesi", exact: true }) });
  await plain.getByRole("button", { name: "Artır" }).click();
  await plain.getByRole("button", { name: "Sepete Ekle" }).click();
  await expect(plain.getByRole("button", { name: "Sepete eklendi" })).toBeVisible();
  await expect(dialog).toHaveCount(0);

  // Sepet: her kombinasyon ayri satir.
  await page.goto("/sepet");
  const main = page.locator("main");
  await expect(main).toContainText("Soğutma: Hava Soğutmalı · Torç Uzunluğu: 3 m · Ara Paket Uzunluğu: 5 m");
  await expect(main).toContainText("Soğutma: Hava Soğutmalı · Torç Uzunluğu: 4 m · Ara Paket Uzunluğu: 10 m");
  const quantities = main.getByRole("spinbutton", { name: "Adet" });
  await expect(quantities).toHaveCount(3);
  expect(await quantities.evaluateAll((els) => els.map((e) => (e as HTMLInputElement).value))).toEqual(["2", "3", "2"]);
  expect(problems).toEqual([]);
});
