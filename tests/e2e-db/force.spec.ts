import { catalog, closeDatabase, expect, expectedOffer, sql, test } from "./yardimci";

/**
 * FORCE SAYFASI (veritabani modu; docs/WEBSITE-KULLANIM.md › Force Serisi)
 *
 * Teknik ozelliklerdeki dort makinenin fiyati ve stok durumu veritabanindaki
 * urunlerden gelir; teknik degerler Force katalogundan (koddan) gelir, urun
 * kaydindaki teknik ozellikler kullanilmaz. Force bayileri haritasi dealers
 * tablosundan (aktif ve force_dealer). Anasayfa tanitim alanindaki Force dugmesi
 * settings('home_hero') kaydindan gelir. Demo modundaki hali:
 * tests/e2e/force.spec.ts.
 */
test.afterAll(closeDatabase);
test.use({ viewport: { width: 1440, height: 900 } });

type Hero = { slides: { id: string; primary: { label: string; href: string }; secondary?: { label: string; href: string } }[] };

test("/force: teknik özelliklerde dört makine; fiyat ve stok veritabanıyla aynı, teknik değerler katalogdan; sepete eklenir", async ({ page, problems }) => {
  const { products, warehouseStock } = await catalog();
  const slugs = ["forcemig-200", "forcetig-200", "forcearc-200-mma", "forcecut-45"];

  await page.goto("/force#karsilastirma");
  const table = page.locator("#karsilastirma table");
  await expect(table.locator("thead [data-model]")).toHaveText(["ForceMIG 200", "ForceTIG 200", "ForceArc 200", "ForceCut 45"]);

  const cells = table.locator("tfoot td");
  for (const [i, slug] of slugs.entries()) {
    const product = products.find((p) => p.slug === slug && p.active);
    expect(product, `${slug}: veritabanında yayında değil`).toBeTruthy();
    const offer = expectedOffer(product!, warehouseStock);
    await expect(cells.nth(i)).toContainText(offer.price.toLocaleString("tr-TR"));
    await expect(cells.nth(i).getByRole("button", { name: /Sepete Ekle/i })).toHaveCount(offer.inStock ? 1 : 0);
  }

  // Teknik degerler katalogdan: ForceTIG 200'un net agirligi katalogda 5,00 kg
  const weight = table.locator("tbody tr").filter({ has: page.getByRole("rowheader", { name: "Net ağırlık" }) }).locator("td");
  await expect(weight).toHaveText(["11,00 kg", "5,00 kg", "3,56 kg", "4,60 kg"]);

  await cells.nth(0).getByRole("button", { name: /Sepete Ekle/i }).click();
  await expect(cells.nth(0).getByRole("link", { name: /Sepete Git/i })).toBeVisible();
  expect(problems).toEqual([]);
});

test("/force: haritadaki iller ve listedeki bayiler veritabanındaki aktif Force bayileri", async ({ page, problems }) => {
  const rows = await sql<{ id: string; city: string }>("SELECT id, city FROM dealers WHERE active AND force_dealer ORDER BY id");
  expect(rows.length).toBeGreaterThan(0);
  await page.goto("/force");
  const map = page.locator("#force-bayileri");
  await map.scrollIntoViewIfNeeded();
  const listed = map.locator("[data-force-dealer]");
  await expect(listed).toHaveCount(rows.length);
  const ids = await listed.evaluateAll((els) => els.map((e) => e.getAttribute("data-force-dealer")).sort());
  expect(ids).toEqual(rows.map((r) => r.id).sort());
  await expect(map.locator("[data-force-city]")).toHaveCount(new Set(rows.map((r) => r.city)).size);
  expect(problems).toEqual([]);
});

test("üst menüde FORCE ilk başlık; anasayfa Force sayfasında tek düğme, kayıttaki adrese (/force) gider", async ({ page, problems }) => {
  const [{ value: hero }] = await sql<{ value: Hero }>("SELECT value FROM settings WHERE key = 'home_hero'");
  const forceSlide = hero.slides.find((s) => s.id === "force")!;
  expect(forceSlide.primary.href).toBe("/force");
  // Force sayfasinda tek dugme (Teklif Al yok).
  expect(forceSlide.secondary).toBeUndefined();

  await page.goto("/");
  await expect(page.locator("header nav > *").first()).toHaveText("FORCE");
  const carousel = page.locator('section[aria-roledescription="carousel"]');
  await carousel.getByRole("button", { name: "Force Serisi" }).click();
  await carousel.getByRole("link", { name: forceSlide.primary.label }).click();
  await expect(page).toHaveURL(/\/force$/);
  await expect(page.getByRole("heading", { level: 1, name: "Zenweld Force Serisi", exact: true })).toBeVisible();
  expect(problems).toEqual([]);
});
