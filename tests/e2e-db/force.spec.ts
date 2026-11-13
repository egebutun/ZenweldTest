import { catalog, closeDatabase, expect, expectedOffer, sql, test } from "./yardimci";

/**
 * FORCE SAYFASI (veritabani modu; docs/WEBSITE-KULLANIM.md › Force Serisi)
 *
 * Teknik tablonun secilebilen modelleri, teknik ozellikleri, fiyatlari ve
 * stok durumu veritabanindaki urunlerden gelir (Model Serisi "Force" olan
 * yayindaki urunler). Force bayileri haritasi dealers tablosundan (aktif ve
 * force_dealer). Anasayfa tanitim alanindaki Force dugmesi
 * settings('home_hero') kaydindan gelir. Demo modundaki hali:
 * tests/e2e/force.spec.ts.
 */
test.afterAll(closeDatabase);
test.use({ viewport: { width: 1440, height: 900 } });

type Hero = { slides: { id: string; primary: { label: string; href: string }; secondary?: { label: string; href: string } }[] };

test("/force: seçilebilen modeller veritabanındaki Force ürünleri; tablodaki fiyat ve stok aynı; sepete eklenir", async ({ page, problems }) => {
  const { products, warehouseStock } = await catalog();
  const force = products.filter((p) => p.active && p.filterValues?.["model-serisi"]?.includes("force"));
  expect(force.length).toBeGreaterThan(0);

  await page.goto("/force#karsilastirma");
  const section = page.locator("#karsilastirma");
  await expect(section.getByRole("checkbox")).toHaveCount(force.length);
  // Her secenek bir Force urunu: kisa model adi urun adinin basidir.
  for (const label of await section.locator("fieldset label").allInnerTexts()) {
    expect(force.some((p) => p.name.startsWith(label.trim())), `${label}: veritabanında yok`).toBeTruthy();
  }

  // Acilista secili kolonlar: fiyat ve stok veritabaniyla ayni
  const table = section.locator("table");
  const names = (await table.locator("thead [data-model]").allInnerTexts()).map((s) => s.trim());
  expect(names.length).toBeGreaterThan(0);
  const cells = table.locator("tfoot td");
  for (const [i, name] of names.entries()) {
    const product = force.find((p) => p.name.startsWith(name))!;
    const offer = expectedOffer(product, warehouseStock);
    await expect(cells.nth(i)).toContainText(offer.price.toLocaleString("tr-TR"));
    await expect(cells.nth(i).getByRole("button", { name: /Sepete Ekle/i })).toHaveCount(offer.inStock ? 1 : 0);
  }

  // Bir ozellik degeri dogrudan urunun teknik ozelliklerinden
  const mig = force.find((p) => p.slug === "forcemig-200")!;
  const weight = mig.specs.find((s) => s.label === "Ağırlık")!.value;
  const column = names.findIndex((n) => mig.name.startsWith(n));
  expect(column).toBeGreaterThanOrEqual(0);
  const row = table.locator("tbody tr").filter({ has: page.getByRole("rowheader", { name: "Ağırlık" }) });
  await expect(row.locator("td").nth(column)).toHaveText(weight);

  await cells.nth(column).getByRole("button", { name: /Sepete Ekle/i }).click();
  await expect(cells.nth(column).getByRole("link", { name: /Sepete Git/i })).toBeVisible();
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
