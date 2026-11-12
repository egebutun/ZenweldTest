import { catalog, closeDatabase, expect, expectedOffer, sql, test } from "./yardimci";

/**
 * FORCE SAYFASI (veritabani modu; docs/WEBSITE-KULLANIM.md › Force Serisi)
 *
 * Teknik tablonun modelleri, teknik ozellikleri, fiyatlari ve stok durumu
 * veritabanindaki urunlerden gelir (Model Serisi "Force" olan yayindaki
 * urunler). Anasayfa tanitim alanindaki Force dugmesi settings('home_hero')
 * kaydindan gelir. Demo modundaki hali: tests/e2e/force.spec.ts.
 */
test.afterAll(closeDatabase);
test.use({ viewport: { width: 1440, height: 900 } });

type Hero = { slides: { id: string; primary: { label: string; href: string } }[] };

test("/force: tablo veritabanındaki Force ürünlerinden; fiyat ve stok aynı; sepete eklenir", async ({ page, problems }) => {
  const { products, warehouseStock } = await catalog();
  const force = products.filter((p) => p.active && p.filterValues?.["model-serisi"]?.includes("force"));
  expect(force.length).toBeGreaterThan(0);

  await page.goto("/force#karsilastirma");
  const table = page.locator("#karsilastirma table");
  const heads = table.locator("thead tr").nth(1).locator("th");
  await expect(heads).toHaveCount(force.length + 1);

  // Her kolon bir Force urunu: kisa model adi urun adinin basidir; fiyat ve stok veritabaniyla ayni.
  const names = (await heads.allInnerTexts()).slice(1).map((s) => s.trim());
  const cells = table.locator("tfoot td");
  for (const [i, name] of names.entries()) {
    const product = force.find((p) => p.name.startsWith(name));
    expect(product, `${name}: veritabanında yok`).toBeTruthy();
    const offer = expectedOffer(product!, warehouseStock);
    await expect(cells.nth(i)).toContainText(offer.price.toLocaleString("tr-TR"));
    await expect(cells.nth(i).getByRole("button", { name: /Sepete Ekle/i })).toHaveCount(offer.inStock ? 1 : 0);
  }

  // Bir ozellik degeri dogrudan urunun teknik ozelliklerinden
  const mig = force.find((p) => p.slug === "forcemig-200")!;
  const weight = mig.specs.find((s) => s.label === "Ağırlık")!.value;
  const column = names.findIndex((n) => mig.name.startsWith(n));
  const row = table.locator("tbody tr").filter({ has: page.getByRole("rowheader", { name: "Ağırlık" }) });
  await expect(row.locator("td").nth(column)).toHaveText(weight);

  await cells.nth(column).getByRole("button", { name: /Sepete Ekle/i }).click();
  await expect(cells.nth(column).getByRole("link", { name: /Sepete Git/i })).toBeVisible();
  expect(problems).toEqual([]);
});

test("üst menüde FORCE ilk başlık; anasayfa Force düğmesi kayıttaki adrese (/force) gider", async ({ page, problems }) => {
  const [{ value: hero }] = await sql<{ value: Hero }>("SELECT value FROM settings WHERE key = 'home_hero'");
  const forceSlide = hero.slides.find((s) => s.id === "force")!;
  expect(forceSlide.primary.href).toBe("/force");

  await page.goto("/");
  await expect(page.locator("header nav > *").first()).toHaveText("FORCE");
  const carousel = page.locator('section[aria-roledescription="carousel"]');
  await carousel.getByRole("button", { name: "Force Serisi" }).click();
  await carousel.getByRole("link", { name: forceSlide.primary.label }).click();
  await expect(page).toHaveURL(/\/force$/);
  await expect(page.getByRole("heading", { level: 1, name: "Zenweld Force Serisi", exact: true })).toBeVisible();
  expect(problems).toEqual([]);
});
