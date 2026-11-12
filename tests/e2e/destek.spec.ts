import { expect, openDrawer, test } from "./yardimci";

/**
 * DESTEK VE GARANTI VE KESFET: UST MENU, /destek VE /yasal/iade (demo modu;
 * docs/WEBSITE-KULLANIM.md › 2 Ust menu, 19 Destek ve Garanti, 21 Yasal metinler)
 *
 * Veritabani modundaki hali: tests/e2e-db/destek.spec.ts.
 */

/** Destek ve Garanti: menudeki iki kolon (yukaridan asagi) ve /destek kartlari bu sirada. */
const LINKS: [string, string][] = [
  ["İletişim", "/iletisim"],
  ["Yetkili Bayi ve Servis Bul", "/yetkili-bayi-ve-servis-agi"],
  ["Servis Talebi", "/servis-talebi"],
  ["Sık Sorulan Sorular", "/sss"],
  ["Garanti Kaydı", "/garanti/kayit"],
  ["Garanti Sorgulama", "/garanti/sorgulama"],
  ["Garanti Koşulları", "/garanti/kosullar"],
  ["İade ve Değişim", "/yasal/iade"],
];

/** Kesfet: uc kolon ve sirayla baglantilari. */
const EXPLORE: [string, [string, string][]][] = [
  ["Kurumsal", [["Hakkımızda", "/hakkimizda"], ["Satış Temsilcilerimiz", "/satis-temsilcilerimiz"], ["Bayimiz Olun", "/bayilik-basvurusu"]]],
  ["Güncel", [["Haberler", "/haberler"], ["Etkinlikler", "/etkinlikler"], ["Blog", "/blog"], ["Welders Club", "/welders-club"]]],
  ["Diğer", [["Ürün Seçici", "/urun-secici"], ["Ultimate Kaynak Rehberi", "/kaynak-rehberi"], ["MSDS", "/msds"], ["Parti Sertifikaları", "/parti-sertifikalari"]]],
];

/** Iade ve Degisim sayfasinin basindaki sabit yazi (KARARLAR K-65). */
const RETURNS_NOTICE =
  "İade veya Değişim Talebi işlemleriniz için SİPARİŞLERİM menüsündeki ilgili siparişi (son 14 gün içerisinde teslim edilmiş) seçerek ilerleyebilirsiniz.";

test.use({ viewport: { width: 1440, height: 900 } });

test("üst menü sırası: FORCE, ürün bölümleri, Destek ve Garanti, en sonda Keşfet", async ({ page, problems }) => {
  await page.goto("/");
  await expect(page.locator("header nav > *")).toHaveText(["FORCE", "Ekipmanlar", "Güvenlik", "Aksesuarlar", "Dolgu Metalleri", "Destek ve Garanti", "Keşfet"]);
  expect(problems).toEqual([]);
});

test("Destek ve Garanti menüsü: iki kolonda sekiz sembollü bağlantı; Tümünü Gör /destek'i açar; Esc ve dışarı tıklama kapatır", async ({ page, problems }) => {
  await page.goto("/");
  const title = page.locator("header nav").getByRole("link", { name: "Destek ve Garanti" });
  await expect(title).toHaveAttribute("href", "/destek");

  await title.hover();
  const panel = page.locator(".zw-mega");
  await expect(panel.getByRole("link", { name: "Tümünü Gör" })).toBeVisible();
  const links = panel.locator("ul a");
  await expect(links).toHaveCount(LINKS.length);
  for (const [i, [label, href]] of LINKS.entries()) {
    await expect(links.nth(i)).toHaveAttribute("href", href);
    await expect(links.nth(i)).toContainText(label);
    await expect(links.nth(i).locator("svg").first()).toBeVisible();
  }
  // Ilk dort sol kolonda, son dort sag kolonda (kolon basligi yok).
  await expect(panel.locator("ul").nth(0).locator("a")).toHaveCount(4);
  await expect(panel.locator("ul").nth(1).locator("a").first()).toContainText("Garanti Kaydı");

  // Esc menuyu kapatir; tekrar acilinca bulanik alana tiklamak da kapatir
  // (dokunmatik ekranda fare menuden cikmaz).
  await page.keyboard.press("Escape");
  await expect(panel).toHaveCount(0);
  await page.mouse.move(700, 600);
  await title.hover();
  await expect(panel).toBeVisible();
  await page.locator(".zw-mega-backdrop").dispatchEvent("click");
  await expect(panel).toHaveCount(0);

  await page.mouse.move(700, 600);
  await title.hover();
  await panel.getByRole("link", { name: "Tümünü Gör" }).click();
  await expect(page).toHaveURL(/\/destek$/);
  await expect(page.locator(".zw-mega")).toHaveCount(0);
  expect(problems).toEqual([]);
});

test("Keşfet menüsü: başlığı sayfa açmaz; solda açıklama, sağda Kurumsal, Güncel, Diğer kolonlarında sembollü bağlantılar", async ({ page, problems }) => {
  await page.goto("/");
  const title = page.locator("header nav").getByRole("button", { name: "Keşfet" });
  await expect(page.locator("header nav").getByRole("link", { name: "Keşfet" })).toHaveCount(0);

  await title.hover();
  const panel = page.locator(".zw-mega");
  const intro = panel.getByText("Zenweld'i tanıyın; haberler, etkinlikler, rehberler ve belgeler tek yerde.");
  // Fare panelin icine gecer: yavas makinede ust menu kayarsa baska basligin uzerine dusmesin.
  await intro.hover();
  await expect(panel.getByRole("link", { name: "Tümünü Gör" })).toHaveCount(0);
  for (const [i, [heading, links]] of EXPLORE.entries()) {
    const column = panel.locator("ul").nth(i).locator("..");
    await expect(column).toContainText(heading);
    const items = column.locator("a");
    await expect(items).toHaveCount(links.length);
    for (const [j, [label, href]] of links.entries()) {
      await expect(items.nth(j)).toHaveAttribute("href", href);
      await expect(items.nth(j)).toContainText(label);
      await expect(items.nth(j).locator("svg").first()).toBeVisible();
    }
  }

  // Basliga tiklamak bir sayfa acmaz.
  await title.click();
  await expect(page).toHaveURL(/\/$/);
  expect(problems).toEqual([]);
});

test("telefon menüsü: Destek ve Garanti'de kolon başlığı yok; Keşfet'te Kurumsal, Güncel, Diğer başlıkları var", async ({ page, problems }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const drawer = await openDrawer(page);

  await drawer.getByRole("button", { name: "Destek ve Garanti" }).click();
  for (const [label, href] of LINKS) await expect(drawer.getByRole("link", { name: label, exact: true })).toHaveAttribute("href", href);
  await expect(drawer.getByText("Destek", { exact: true })).toHaveCount(0);
  await expect(drawer.getByText("Garanti", { exact: true })).toHaveCount(0);

  await drawer.getByRole("button", { name: "Keşfet" }).click();
  for (const [heading] of EXPLORE) await expect(drawer.getByText(heading, { exact: true })).toBeVisible();
  expect(problems).toEqual([]);
});

test("/destek: başlık, menüdeki sekiz kart aynı sırada (İletişim ilk); kırmızı iletişim kutusu yok", async ({ page, problems }) => {
  await page.goto("/destek");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Zenweld\s*Destek ve Garanti/);
  await expect(page).toHaveTitle(/Destek ve Garanti/);

  const main = page.locator("main");
  const cards = main.locator("ul li a");
  await expect(cards).toHaveCount(LINKS.length);
  for (const [i, [label, href]] of LINKS.entries()) {
    await expect(cards.nth(i)).toHaveAttribute("href", href);
    await expect(cards.nth(i).getByRole("heading", { level: 3 })).toHaveText(label);
  }
  await expect(cards.first()).toContainText("Bize ulaşın");
  await expect(main).not.toContainText("Destek ekibimize ulaşın");

  await main.getByRole("link", { name: /^Servis Talebi/ }).click();
  await expect(page).toHaveURL(/\/servis-talebi$/);
  expect(problems).toEqual([]);
});

test("/yasal/iade: başlığın hemen altında koyu, sabit yönlendirme yazısı; diğer yasal metinlerde yok", async ({ page, problems }) => {
  await page.goto("/yasal/iade");
  const notice = page.locator("main").getByText(/^İade veya Değişim Talebi işlemleriniz için SİPARİŞLERİM menüsündeki ilgili siparişi/);
  await expect(notice).toHaveText(RETURNS_NOTICE);
  expect(Number(await notice.evaluate((el) => getComputedStyle(el).fontWeight))).toBeGreaterThanOrEqual(700);
  // Yazi "Son guncelleme"nin ve panelden gelen metnin ustundedir.
  const [top, updated] = await Promise.all([notice.boundingBox(), page.locator("main").getByText(/^Son güncelleme/).boundingBox()]);
  expect(top!.y).toBeLessThan(updated!.y);

  await page.goto("/yasal/kvkk");
  await expect(page.locator("main")).not.toContainText("SİPARİŞLERİM");
  expect(problems).toEqual([]);
});
