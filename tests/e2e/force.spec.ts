import { expect, openDrawer, test } from "./yardimci";

/**
 * FORCE SAYFASI (/force; demo modu; docs/WEBSITE-KULLANIM.md › Force Serisi)
 *
 * Ust menunun ilk basligi FORCE dogrudan /force'u acar (menusu yok).
 * Sayfada dort makinenin bolumu ve en altta Force serisinin butun
 * modelleri yan yana teknik tablo: her kolonun altinda fiyat, Sepete Ekle
 * ve favori kalbi. Veritabani modundaki hali: tests/e2e-db/force.spec.ts.
 */

const MACHINES = [
  ["ForceMIG 200", "Tek makine. Dört yöntem.", "/urun/forcemig-200"],
  ["ForceTIG 200", "İnce işin ustası.", "/urun/forcetig-200"],
  ["ForceArc 200", "Küçük gövde. Büyük ark.", "/urun/forcearc-200-mma"],
  ["ForceCut 45", "Çeliği çizer gibi keser.", "/urun/forcecut-45"],
] as const;

/** Tablodaki modeller: aile sirasiyla (ForceMIG, ForceTIG, ForceArc, ForceCut), aile icinde numaraya gore. */
const MODELS = [
  "ForceMIG 125",
  "ForceMIG 185 MP",
  "ForceMIG 200",
  "ForceMIG 205 DP",
  "ForceTIG 200 TIG",
  "ForceArc 200 MMA",
  "ForceArc 250 MMA",
  "ForceArc 280 MMA",
  "ForceArc 400 CEL MMA",
  "ForceCut 45",
];

test.use({ viewport: { width: 1440, height: 900 } });

test("üst menü: FORCE ilk başlık, menü açmadan /force'a gider", async ({ page, problems }) => {
  await page.goto("/");
  const nav = page.locator("header nav");
  await expect(nav.locator("> *").first()).toHaveText("FORCE");
  await nav.getByRole("link", { name: "FORCE" }).hover();
  await expect(page.locator(".zw-mega")).toHaveCount(0);
  await nav.getByRole("link", { name: "FORCE" }).click();
  await expect(page).toHaveURL(/\/force$/);
  await expect(page).toHaveTitle(/Force Serisi/);
  expect(problems).toEqual([]);
});

test("telefon menüsü: FORCE en üstte, doğrudan bağlantı", async ({ page, problems }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const drawer = await openDrawer(page);
  await expect(drawer.locator("a, button").first()).toHaveText("FORCE");
  await drawer.getByRole("link", { name: "FORCE" }).click();
  await expect(page).toHaveURL(/\/force$/);
  expect(problems).toEqual([]);
});

test("/force: başlık, dört makine bölümü ürün sayfalarına bağlanır", async ({ page, problems }) => {
  await page.goto("/force");
  // Basligin adi ekran okuyucu icin "Zenweld Force Serisi"; dev FORCE yazisi okunmaz.
  await expect(page.getByRole("heading", { level: 1, name: "Zenweld Force Serisi", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: /Makineleri Keşfet/ })).toHaveAttribute("href", "#makineler");
  await expect(page.getByRole("link", { name: "Teknik Karşılaştırma" })).toHaveAttribute("href", "#karsilastirma");

  for (const [name, slogan, href] of MACHINES) {
    const chapter = page.locator("section").filter({ has: page.getByRole("heading", { level: 2, name }) });
    await expect(chapter).toHaveCount(1);
    await expect(chapter).toContainText(slogan);
    await expect(chapter.getByRole("link", { name: /Ürünü İncele/ })).toHaveAttribute("href", href);
    await expect(chapter.getByRole("button", { name: /Sepete Ekle/i })).toBeVisible();
  }
  expect(problems).toEqual([]);
});

test("/force teknik tablo: Force serisinin bütün modelleri yan yana; fiyat, Sepete Ekle ve kalp; stokta olmayan eklenmez", async ({ page, problems }) => {
  await page.goto("/force#karsilastirma");
  const table = page.locator("#karsilastirma table");
  const models = table.locator("thead tr").nth(1).locator("th").filter({ hasNot: page.getByText("Model", { exact: true }) });
  await expect(models).toHaveText(MODELS);
  await expect(table.locator("thead tr").first().locator("th")).toHaveText(["ForceMIG", "ForceTIG", "ForceArc", "ForceCut"]);

  // Ozellik satiri: urunde olmayan ozellik "—"
  const weight = table.locator("tbody tr").filter({ has: page.getByRole("rowheader", { name: "Ağırlık" }) });
  await expect(weight.locator("td").nth(2)).toHaveText("11 kg");
  await expect(weight.locator("td").nth(8)).toHaveText("—");

  const prices = table.locator("tfoot td");
  await expect(prices).toHaveCount(MODELS.length);
  for (const cell of await prices.all()) {
    await expect(cell).toContainText("₺");
    await expect(cell.getByRole("button", { name: "Favori" })).toBeVisible();
  }
  // ForceArc 280 ornek veride depoda yok (KARARLAR K-82)
  await expect(prices.nth(7)).toContainText(/Stokta Yok/i);
  await expect(prices.nth(7).getByRole("button", { name: /Sepete Ekle/i })).toHaveCount(0);

  // ForceMIG 200: sepete eklenir; kalp favorilere ekler
  const mig = prices.nth(2);
  await mig.getByRole("button", { name: /Sepete Ekle/i }).click();
  await expect(mig.getByRole("link", { name: /Sepete Git/i })).toHaveAttribute("href", "/sepet");
  const heart = mig.getByRole("button", { name: "Favori" });
  await heart.click();
  await expect(heart).toHaveAttribute("aria-pressed", "true");

  await page.goto("/sepet");
  await expect(page.locator("main")).toContainText("ForceMIG 200");
  expect(problems).toEqual([]);
});

test("anasayfa: Force Serisi şeridinin Tümünü Gör'ü ve tanıtım alanındaki düğme /force'a gider", async ({ page, problems }) => {
  await page.goto("/");
  const strip = page.locator("section").filter({ has: page.getByRole("heading", { name: "Force Serisi", exact: true }) });
  await expect(strip.getByRole("link", { name: /Tümünü Gör/ })).toHaveAttribute("href", "/force");
  const hero = page.locator('section[aria-roledescription="carousel"]');
  await hero.getByRole("button", { name: "Force Serisi" }).click();
  await hero.getByRole("link", { name: /Force Serisini İncele/ }).click();
  await expect(page).toHaveURL(/\/force$/);
  expect(problems).toEqual([]);
});
