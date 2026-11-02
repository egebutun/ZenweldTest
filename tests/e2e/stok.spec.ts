import { SESSION, addTestOptions, changeDb, expect, readDb, setWarehouseStock, test } from "./yardimci";

/**
 * ZENWELD DEPO STOGU (docs/IS-KURALLARI.md › 20, KARARLAR K-82)
 *
 * Stok test icinde ayarlanir (ornek veriden bagimsiz): depoda olmayan urun
 * ve secenek "STOKTA YOK" gosterir ve sepete eklenmez; sepete eklendikten
 * sonra stogu biten urunle odemeye gecilmez; panelde depo stogu gorunur.
 */
test.use({ storageState: SESSION.admin });

test("depoda olmayan ürün STOKTA YOK gösterir ve sepete eklenmez", async ({ page, problems }) => {
  await page.goto("/urun/ultimate-255-mma");
  const db = await readDb(page);
  const product = db.products.find((p) => p.slug === "ultimate-255-mma")!;
  await setWarehouseStock(page, { [product.sku]: 0 });

  const main = page.locator("main");
  // Sayfanın sepet düğmesi yerine devre dışı STOKTA YOK (alttaki önerilen
  // ürünlerin kendi düğmeleri kalır).
  await expect(page.getByRole("button", { name: "STOKTA YOK" })).toBeDisabled();

  // Kategori sayfasındaki kartında da STOKTA YOK yazar.
  const category = db.categories.find((c) => c.slug === product.categorySlug)!;
  const group = db.categoryGroups.find((g) => g.slug === category.group)!;
  await page.goto(`/${group.section}/${group.slug}/${category.slug}`);
  const card = main.locator("div.group", { hasText: product.name }).first();
  await expect(card).toContainText("STOKTA YOK");
  expect(problems).toEqual([]);
});

test("seçenekli üründe yalnızca stoksuz seçenek sepete eklenmez", async ({ page, problems }) => {
  const slug = "ultimate-255-mma";
  await page.goto(`/urun/${slug}`);
  await addTestOptions(page, slug);
  await setWarehouseStock(page, { "ZW-E2E-S4": 0 });

  const outOfStock = page.getByRole("button", { name: "STOKTA YOK" });
  await expect(outOfStock).toHaveCount(0);
  await page.getByRole("button", { name: "Su Soğutmalı", exact: true }).click();
  await expect(outOfStock).toBeDisabled();
  await page.getByRole("button", { name: "Hava Soğutmalı", exact: true }).click();
  await expect(outOfStock).toHaveCount(0);
  expect(problems).toEqual([]);
});

test("sepete eklendikten sonra stoğu biten ürünle ödemeye geçilmez", async ({ page, problems }) => {
  await page.goto("/urun/ultimate-255-mma");
  // İlk "Sepete Ekle" sayfanın kendi düğmesidir (önerilen ürünler altta).
  await page.locator("main").getByRole("button", { name: "Sepete Ekle" }).first().click();
  await expect(page.locator("main")).toContainText("Sepete eklendi");
  const db = await readDb(page);
  const sku = db.products.find((p) => p.slug === "ultimate-255-mma")!.sku;
  await setWarehouseStock(page, { [sku]: 0 });

  await page.goto("/sepet");
  const main = page.locator("main");
  await expect(main).toContainText("STOKTA YOK");
  await expect(page.getByRole("button", { name: "Ödemeye Geç" })).toBeDisabled();
  await expect(main).toContainText("Sepetinizde stokta olmayan ürün var");

  // Stok gelince yeniden ödemeye geçilebilir.
  await setWarehouseStock(page, { [sku]: 3 });
  await expect(page.getByRole("button", { name: "Ödemeye Geç" })).toBeEnabled();
  expect(problems).toEqual([]);
});

test("panelde Ürünler listesinde depo stoğu görünür", async ({ page, problems }) => {
  await page.goto("/yonetim/urunler");
  const db = await readDb(page);
  const product = db.products.find((p) => p.slug === "ultimate-255-mma")!;
  await changeDb(page, (d) => {
    d.warehouseStock = d.warehouseStock.filter((r) => r.sapItemCode !== product.sku);
    d.warehouseStock.push({ sapItemCode: product.sku, quantity: 7, syncedAt: new Date().toISOString() });
  });
  await expect(page.locator("th", { hasText: "Depo Stoğu" })).toBeVisible();
  await expect(page.locator("body")).toContainText("SAP'tan okunur");
  await expect(page.locator("tr", { hasText: product.sku })).toContainText("7 adet");

  await setWarehouseStock(page, { [product.sku]: 0 });
  await expect(page.locator("tr", { hasText: product.sku })).toContainText("Stokta yok");
  expect(problems).toEqual([]);
});
