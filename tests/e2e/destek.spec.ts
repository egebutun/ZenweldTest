import { expect, test } from "./yardimci";

/**
 * DESTEK VE GARANTI: UST MENU, /destek VE /yasal/iade (demo modu;
 * docs/WEBSITE-KULLANIM.md › 2 Ust menu, 19 Destek ve Garanti, 21 Yasal metinler)
 *
 * Veritabani modundaki hali: tests/e2e-db/destek.spec.ts.
 */

const LINKS: [string, string][] = [
  ["Sık Sorulan Sorular", "/sss"],
  ["Yetkili Bayi ve Servis Bul", "/yetkili-bayi-ve-servis-agi"],
  ["Servis Talebi", "/servis-talebi"],
  ["İade ve Değişim", "/yasal/iade"],
  ["Garanti Kaydı", "/garanti/kayit"],
  ["Garanti Sorgulama", "/garanti/sorgulama"],
  ["Garanti Koşulları", "/garanti/kosullar"],
];

/** Iade ve Degisim sayfasinin basindaki sabit yazi (KARARLAR K-65). */
const RETURNS_NOTICE =
  "İade veya Değişim Talebi işlemleriniz için SİPARİŞLERİM menüsündeki ilgili siparişi (son 14 gün içerisinde teslim edilmiş) seçerek ilerleyebilirsiniz.";

test.use({ viewport: { width: 1440, height: 900 } });

test("Destek ve Garanti menüsü: yedi sembollü bağlantı; Tümünü Gör /destek'i açar; Esc ve dışarı tıklama kapatır", async ({ page, problems }) => {
  await page.goto("/");
  const title = page.locator("header nav").getByRole("link", { name: "Destek ve Garanti" });
  await expect(title).toHaveAttribute("href", "/destek");

  await title.hover();
  const panel = page.locator(".zw-mega");
  await expect(panel.getByRole("link", { name: "Tümünü Gör" })).toBeVisible();
  for (const [label, href] of LINKS) {
    const link = panel.getByRole("link", { name: new RegExp(`^${label}`) });
    await expect(link).toHaveAttribute("href", href);
    await expect(link.locator("svg").first()).toBeVisible();
  }

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

test("/destek: başlık, menüdeki yedi kart ve İletişim bilgileri", async ({ page, problems }) => {
  await page.goto("/destek");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Zenweld\s*Destek ve Garanti/);
  await expect(page).toHaveTitle(/Destek ve Garanti/);

  const main = page.locator("main");
  for (const [label, href] of LINKS) {
    await expect(main.getByRole("link", { name: new RegExp(`^${label}`) })).toHaveAttribute("href", href);
  }

  const contact = main.locator("section").filter({ hasText: "Destek ekibimize ulaşın" });
  await expect(contact.getByRole("link", { name: "info@zenweld.com" })).toHaveAttribute("href", "mailto:info@zenweld.com");
  for (const phone of ["+90 212 549 61 86", "+90 212 549 61 89", "+90 232 203 37 08"]) {
    await expect(contact.getByRole("link", { name: phone })).toHaveAttribute("href", `tel:${phone.replace(/\s/g, "")}`);
  }
  await expect(contact.getByRole("link", { name: "Yol tarifi al" })).toHaveCount(2);

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
