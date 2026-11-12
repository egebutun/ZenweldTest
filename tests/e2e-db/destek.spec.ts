import { closeDatabase, expect, sql, test } from "./yardimci";

/**
 * DESTEK VE GARANTI SAYFASI VE ILETISIM (veritabani modu;
 * docs/WEBSITE-KULLANIM.md › 19 Destek ve Garanti, Iletisim)
 *
 * /destek'teki kartlar ve menuler iki modda aynidir (demo modu:
 * tests/e2e/destek.spec.ts); Iletisim sayfasindaki e-posta, adresler ve
 * telefonlar veritabanindaki sirket bilgisinden (settings.company) gelir.
 * Iade ve Degisim sayfasinin basliktan sonraki sabit yazisi da iki modda
 * aynidir; panelden gelen metin onun altindadir.
 */
test.afterAll(closeDatabase);

type Company = { email: string; offices: { city: string; addressLines: string[]; phones: string[] }[] };

test("/destek: İletişim kartı ilk sırada; İletişim sayfasındaki bilgiler veritabanındaki şirket bilgisinden; menü aynı", async ({ page, problems }) => {
  const [{ value: company }] = await sql<{ value: Company }>("SELECT value FROM settings WHERE key = 'company'");
  await page.goto("/destek");

  const main = page.locator("main");
  const cards = main.locator("ul li a");
  await expect(cards).toHaveCount(8);
  await expect(cards.first()).toHaveAttribute("href", "/iletisim");
  await expect(main.getByRole("link", { name: /^İade ve Değişim/ })).toHaveAttribute("href", "/yasal/iade");
  await expect(main).not.toContainText("Destek ekibimize ulaşın");

  await cards.first().click();
  await expect(page).toHaveURL(/\/iletisim$/);
  const contact = page.locator("main");
  await expect(contact.getByRole("link", { name: company.email }).first()).toHaveAttribute("href", `mailto:${company.email}`);
  for (const office of company.offices) {
    for (const line of office.addressLines) await expect(contact).toContainText(line);
    for (const phone of office.phones) await expect(contact.getByRole("link", { name: phone }).first()).toBeVisible();
  }

  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(page.locator("header nav > *")).toHaveText(["Ekipmanlar", "Güvenlik", "Aksesuarlar", "Dolgu Metalleri", "Destek ve Garanti", "Keşfet"]);
  const title = page.locator("header nav").getByRole("link", { name: "Destek ve Garanti" });
  await title.hover();
  await expect(page.locator(".zw-mega").getByRole("link", { name: "Tümünü Gör" })).toHaveAttribute("href", "/destek");
  await expect(page.locator(".zw-mega").getByRole("link", { name: /^İletişim/ })).toHaveAttribute("href", "/iletisim");
  expect(problems).toEqual([]);
});

test("/yasal/iade: başlık veritabanından; altında koyu, sabit yönlendirme yazısı (panelde yok)", async ({ page, problems }) => {
  const [{ title }] = await sql<{ title: string }>("SELECT title FROM legal_pages WHERE id = 'iade'");
  await page.goto("/yasal/iade");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);

  const notice = page.locator("main").getByText(/^İade veya Değişim Talebi işlemleriniz için SİPARİŞLERİM menüsündeki/);
  await expect(notice).toHaveText(
    "İade veya Değişim Talebi işlemleriniz için SİPARİŞLERİM menüsündeki ilgili siparişi (son 14 gün içerisinde teslim edilmiş) seçerek ilerleyebilirsiniz.",
  );
  expect(Number(await notice.evaluate((el) => getComputedStyle(el).fontWeight))).toBeGreaterThanOrEqual(700);
  const [top, updated] = await Promise.all([notice.boundingBox(), page.locator("main").getByText(/^Son güncelleme/).boundingBox()]);
  expect(top!.y).toBeLessThan(updated!.y);
  expect(problems).toEqual([]);
});
