import type { Page } from "@playwright/test";
import { expect, readDb, test } from "./yardimci";

/**
 * ANASAYFA (demo modu; docs/WEBSITE-KULLANIM.md › 3, KARARLAR K-112, K-113)
 *
 * Tanitim alaninin uc sayfasi, guven seridi, kategori kartlari ve Force /
 * Jasic seritleri tarayicidaki veriyle. Veritabani modundaki hali:
 * tests/e2e-db/anasayfa.spec.ts.
 */
test.use({ viewport: { width: 1440, height: 900 } });

const section = (page: Page, title: string) =>
  page.locator("section").filter({ has: page.getByRole("heading", { level: 2, name: title, exact: true }) });

test("tanıtım alanı: üç sayfa; sekme ve oklar değiştirir; fare dışarıdayken kendiliğinden döner", async ({ page, problems }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Zenweld Kaynak Makineleri ve Plazma Kesme Sistemleri");

  const hero = page.locator('section[aria-roledescription="carousel"]');
  const slides = hero.locator('[aria-roledescription="slide"]');
  await expect(slides).toHaveCount(3);
  await expect(slides.nth(0)).toHaveAttribute("aria-hidden", "false");
  await expect(slides.nth(0).getByRole("link", { name: /Ürünleri Keşfet/ })).toHaveAttribute("href", "/ekipmanlar");

  await hero.getByRole("button", { name: "Force Serisi" }).click();
  await expect(slides.nth(1)).toHaveAttribute("aria-hidden", "false");
  await expect(slides.nth(0)).toHaveAttribute("aria-hidden", "true");
  await expect(slides.nth(1).getByRole("link", { name: /Force Serisini İncele/ })).toHaveAttribute("href", "/arama?q=Force");

  await hero.getByRole("button", { name: "Sonraki" }).click();
  await expect(slides.nth(2)).toHaveAttribute("aria-hidden", "false");
  await expect(slides.nth(2).getByRole("link", { name: /Lazer Makinelerini İncele/ })).toHaveAttribute(
    "href",
    "/ekipmanlar/lazer-makineleri",
  );
  await hero.getByRole("button", { name: "Sonraki" }).click();
  await expect(slides.nth(0)).toHaveAttribute("aria-hidden", "false");

  // Fare tanitim alanindan cikinca 7 saniye sonra sonraki sayfa gelir.
  await page.mouse.move(700, 890);
  await expect(slides.nth(1)).toHaveAttribute("aria-hidden", "false", { timeout: 10_000 });
  expect(problems).toEqual([]);
});

test("güven şeridi, kategori kartları, Force ve Jasic şeritleri; Yeni Gelenler ve YENİ etiketi yok", async ({ page, problems }) => {
  await page.goto("/");
  const db = await readDb(page);

  const dealers = db.dealers.filter((d) => d.active);
  const trust = page.getByRole("region", { name: "Neden güvenle alışveriş" });
  await expect(trust.locator("ul").first()).toContainText(`${dealers.length}+Yetkili bayi ve servis noktası`);

  // Ekipmanlar'in kategorileri ve diger uc bolum
  const cards = section(page, "Ne arıyorsunuz?");
  const equipment = db.categories.filter((c) => c.section === "ekipmanlar");
  for (const c of equipment) {
    await expect(cards.getByRole("link", { name: new RegExp(c.name.replace(/[()]/g, "\\$&")) })).toHaveAttribute(
      "href",
      `/ekipmanlar/${c.group}/${c.slug}`,
    );
  }
  for (const [name, href] of [["Güvenlik", "/guvenlik"], ["Aksesuarlar", "/aksesuarlar"], ["Dolgu Metalleri", "/dolgu-metalleri"]]) {
    await expect(cards.getByRole("link", { name: new RegExp(`^${name}`) })).toHaveAttribute("href", href);
  }

  const active = db.products.filter((p) => p.active);
  const force = active.filter((p) => p.filterValues?.["model-serisi"]?.includes("force"));
  const jasic = active.filter((p) => p.brand === "Jasic");
  expect(force.length).toBeGreaterThan(0);
  expect(jasic.length).toBeGreaterThan(0);
  for (const p of force) await expect(section(page, "Force Serisi")).toContainText(p.name);
  for (const p of jasic) await expect(section(page, "Jasic Lazer Ürünleri")).toContainText(p.name);

  await expect(page.getByText("Yeni Gelenler")).toHaveCount(0);
  await expect(page.getByText("YENİ", { exact: true })).toHaveCount(0);
  expect(problems).toEqual([]);
});
