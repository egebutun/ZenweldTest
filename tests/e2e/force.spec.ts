import { SESSION, expect, openDrawer, test } from "./yardimci";

/**
 * FORCE SAYFASI (/force; demo modu; docs/WEBSITE-KULLANIM.md › Force Serisi)
 *
 * Ust menunun ilk basligi FORCE dogrudan /force'u acar (menusu yok).
 * Sayfada dort makinenin bolumu; teknik tabloda ziyaretci modelleri
 * isaretler, tablo yalnizca secilenleri gosterir (her kolonun altinda
 * fiyat, Sepete Ekle ve favori kalbi). En altta Force bayileri haritasi
 * (KARARLAR K-115). Veritabani modundaki hali: tests/e2e-db/force.spec.ts.
 */

const MACHINES = [
  ["ForceMIG 200", "Tek makine. Dört yöntem.", "/urun/forcemig-200"],
  ["ForceTIG 200", "İnce işin ustası.", "/urun/forcetig-200"],
  ["ForceArc 200", "Küçük gövde. Büyük ark.", "/urun/forcearc-200-mma"],
  ["ForceCut 45", "Çeliği çizer gibi keser.", "/urun/forcecut-45"],
] as const;

/** Secilebilen modeller: aile sirasiyla (ForceMIG, ForceTIG, ForceArc, ForceCut), aile icinde numaraya gore. */
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
  // Acilis: FORCE yazisinin altindan yukselen kaynak ustasi (dekoratif) yuklenir.
  const welder = page.locator('img[src$="/images/force/kaynak-ustasi.webp"]');
  await expect(welder).toBeVisible();
  await expect.poll(() => welder.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
  // Dort makine aralikli durur: hicbiri yanindakinin ustune binmez; kaydirinca yerleri degismez.
  const rects = () => page.locator(".zw-force-unit").evaluateAll((els) => els.map((e) => e.getBoundingClientRect().toJSON()));
  const units = await rects();
  expect(units).toHaveLength(4);
  for (let i = 1; i < units.length; i++) expect(units[i].left).toBeGreaterThanOrEqual(units[i - 1].right);
  await page.mouse.wheel(0, 300);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  expect((await rects()).map((r) => r.left)).toEqual(units.map((r) => r.left));
  // Kaydirin yazisi ve numaralar yok
  await expect(page.getByText("Kaydırın")).toHaveCount(0);
  await expect(page.locator("#makineler")).not.toContainText("01");

  for (const [name, slogan, href] of MACHINES) {
    const chapter = page.locator("section").filter({ has: page.getByRole("heading", { level: 2, name }) });
    await expect(chapter).toHaveCount(1);
    await expect(chapter).toContainText(slogan);
    await expect(chapter.getByRole("link", { name: /Ürünü İncele/ })).toHaveAttribute("href", href);
    await expect(chapter.getByRole("button", { name: /Sepete Ekle/i })).toBeVisible();
  }
  expect(problems).toEqual([]);
});

test("/force teknik tablo: modeller işaretlenir, tablo yalnızca seçilenleri gösterir; fiyat, Sepete Ekle ve kalp; stokta olmayan eklenmez", async ({ page, problems }) => {
  await page.goto("/force#karsilastirma");
  const section = page.locator("#karsilastirma");
  const table = section.locator("table");
  const box = (name: string) => section.getByRole("checkbox", { name, exact: true });
  const pick = (name: string) => section.locator("fieldset label").filter({ hasText: new RegExp(`^${name}$`) });
  const columns = table.locator("thead [data-model]");

  // Butun modeller ailelerine gore isaretlenebilir; acilista tanitilan dort makine secili
  await expect(section.locator("fieldset legend")).toHaveText(["ForceMIG", "ForceTIG", "ForceArc", "ForceCut"]);
  await expect(section.getByRole("checkbox")).toHaveCount(MODELS.length);
  for (const name of MODELS) await expect(box(name)).toBeAttached();
  await expect(columns).toHaveText(["ForceMIG 200", "ForceTIG 200 TIG", "ForceArc 200 MMA", "ForceCut 45"]);
  await expect(section).toContainText("4 / 4 model seçili");
  // Dort secili iken baska model isaretlenemez
  await expect(box("ForceMIG 125")).toBeDisabled();

  // Kolonun carpisi modeli cikarir; yeni secilen seri sirasiyla yerine girer
  await table.getByRole("button", { name: "ForceCut 45: Tablodan çıkar" }).click();
  await expect(box("ForceCut 45")).not.toBeChecked();
  await pick("ForceArc 400 CEL MMA").click();
  await expect(box("ForceArc 400 CEL MMA")).toBeChecked();
  await expect(columns).toHaveText(["ForceMIG 200", "ForceTIG 200 TIG", "ForceArc 200 MMA", "ForceArc 400 CEL MMA"]);

  // Ozellik satiri: urunde olmayan ozellik "—"
  const weight = table.locator("tbody tr").filter({ has: page.getByRole("rowheader", { name: "Ağırlık" }) });
  await expect(weight.locator("td").nth(0)).toHaveText("11 kg");
  await expect(weight.locator("td").nth(3)).toHaveText("—");

  // Secim temizlenince tablo yok, yonlendiren yazi var
  await section.getByRole("button", { name: "Seçimi temizle" }).click();
  await expect(table).toHaveCount(0);
  await expect(section).toContainText("en az bir model işaretleyin");

  await pick("ForceMIG 200").click();
  await pick("ForceArc 280 MMA").click();
  await expect(columns).toHaveText(["ForceMIG 200", "ForceArc 280 MMA"]);
  const prices = table.locator("tfoot td");
  await expect(prices).toHaveCount(2);
  for (const cell of await prices.all()) {
    await expect(cell).toContainText("₺");
    await expect(cell.getByRole("button", { name: "Favori" })).toBeVisible();
  }
  // ForceArc 280 ornek veride depoda yok (KARARLAR K-82)
  await expect(prices.nth(1)).toContainText(/Stokta Yok/i);
  await expect(prices.nth(1).getByRole("button", { name: /Sepete Ekle/i })).toHaveCount(0);

  // ForceMIG 200: sepete eklenir; kalp favorilere ekler
  const mig = prices.nth(0);
  await mig.getByRole("button", { name: /Sepete Ekle/i }).click();
  await expect(mig.getByRole("link", { name: /Sepete Git/i })).toHaveAttribute("href", "/sepet");
  const heart = mig.getByRole("button", { name: "Favori" });
  await heart.click();
  await expect(heart).toHaveAttribute("aria-pressed", "true");

  await page.goto("/sepet");
  await expect(page.locator("main")).toContainText("ForceMIG 200");
  expect(problems).toEqual([]);
});

test("/force kapanış: Destek ve Garanti düğmesi, Yetkili Bayi Bul yok; haritada Force bayileri il il, liste ve bayi bilgisi", async ({ page, problems }) => {
  await page.goto("/force");
  const cta = page.locator("section").filter({ has: page.getByRole("heading", { name: "Force'u yakından görün." }) });
  await expect(cta.getByRole("link", { name: "Destek ve Garanti" })).toHaveAttribute("href", "/destek");
  await expect(cta.getByRole("link", { name: /Yetkili Bayi Bul/ })).toHaveCount(0);

  const map = page.locator("#force-bayileri");
  await map.scrollIntoViewIfNeeded();
  await expect(map.getByRole("img", { name: "Force bayilerinin Türkiye haritası" })).toBeVisible();
  // Ornek veride butun aktif bayiler Force Bayi isaretli: listede 29 bayi, haritada il basina bir nokta
  await expect(map.locator("[data-force-dealer]")).toHaveCount(29);
  await expect(map.locator("[data-force-city]")).toHaveCount(25);
  await expect(map).toContainText("29 bayi · 25 il");

  // Il noktasina dokununca il secilir, listede o ilin bayileri kalir
  await map.getByRole("button", { name: "Ankara: 2 Force bayisi" }).click();
  await expect(map.locator("select")).toHaveValue("Ankara");
  await expect(map.locator("ul > li")).toHaveCount(2);
  // Listedeki bayiye dokununca adres, Ara ve Yol Tarifi
  await map.locator("ul").getByRole("button", { name: /Ostim Kaynak Ekipmanları/ }).click();
  await expect(map).toContainText("Ostim OSB, Örnek Sok. No:7, Yenimahalle / Ankara");
  await expect(map.getByRole("link", { name: "Ara", exact: true })).toHaveAttribute("href", "tel:+903120000004");
  await expect(map.getByRole("link", { name: /Yol Tarifi/ })).toHaveAttribute("href", /google\.com\/maps\/dir/);

  // Tek bayili ilde bayinin bilgileri hemen acilir
  await map.getByRole("button", { name: "Konya: 1 Force bayisi" }).click();
  await expect(map).toContainText("Büsan Örnek Cad. No:55, Selçuklu / Konya");

  // Il secimi listeyi daraltir; Tum iller hepsini gosterir
  await map.locator("select").selectOption("İzmir");
  await expect(map.locator("ul > li")).toHaveCount(2);
  await expect(map.locator("ul")).toContainText("Ege Kaynak Sanayi");
  await map.locator("select").selectOption("");
  await expect(map.locator("ul > li")).toHaveCount(29);
  expect(problems).toEqual([]);
});

test.describe("panel", () => {
  test.use({ storageState: SESSION.admin });

  test("Bayiler: Force Bayi işareti kaldırılan bayi Force haritasından çıkar; etiket sitenin başka yerinde görünmez", async ({ page, problems }) => {
    await page.goto("/yonetim/bayiler");
    const row = page.locator("tr", { hasText: "Ostim Kaynak Ekipmanları" });
    await expect(row.getByText("Force", { exact: true })).toBeVisible();
    await row.getByRole("button", { name: "Düzenle" }).click();
    const dialog = page.getByRole("dialog");
    const force = dialog.getByRole("checkbox", { name: /Force Bayi/ });
    await expect(force).toBeChecked();
    await force.uncheck();
    await dialog.getByRole("button", { name: "Kaydet" }).click();
    await expect(dialog).toHaveCount(0);
    await expect(row.getByText("Force", { exact: true })).toHaveCount(0);

    await page.goto("/force");
    const map = page.locator("#force-bayileri");
    await map.scrollIntoViewIfNeeded();
    await expect(map.locator("[data-force-dealer]")).toHaveCount(28);
    await expect(map.getByRole("button", { name: /Ostim Kaynak Ekipmanları/ })).toHaveCount(0);
    await expect(map.getByRole("button", { name: "Ankara: 1 Force bayisi" })).toBeVisible();

    // Bayi ve servis aginda bayi yerinde; Force Bayi diye bir etiket yok
    await page.goto("/yetkili-bayi-ve-servis-agi");
    await expect(page.getByText("Ostim Kaynak Ekipmanları").first()).toBeVisible();
    await expect(page.locator("main")).not.toContainText("Force Bayi");
    expect(problems).toEqual([]);
  });
});

test("anasayfa: Force Serisi şeridinin Tümünü Gör'ü ve tanıtım alanındaki tek düğme /force'a gider", async ({ page, problems }) => {
  await page.goto("/");
  const strip = page.locator("section").filter({ has: page.getByRole("heading", { name: "Force Serisi", exact: true }) });
  await expect(strip.getByRole("link", { name: /Tümünü Gör/ })).toHaveAttribute("href", "/force");
  const hero = page.locator('section[aria-roledescription="carousel"]');
  await hero.getByRole("button", { name: "Force Serisi" }).click();
  const cta = hero.getByRole("link", { name: /Force Serisini İncele/ });
  // Force sayfasinda Teklif Al dugmesi yok (yalnizca Force Serisini Incele).
  await expect(cta.locator("..").getByRole("link")).toHaveCount(1);
  await cta.click();
  await expect(page).toHaveURL(/\/force$/);
  expect(problems).toEqual([]);
});
