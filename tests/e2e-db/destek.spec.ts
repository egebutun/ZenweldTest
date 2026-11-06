import { closeDatabase, expect, sql, test } from "./yardimci";

/**
 * DESTEK VE GARANTI SAYFASI (veritabani modu; docs/WEBSITE-KULLANIM.md › 19)
 *
 * "Destek ekibimize ulasin"daki e-posta, adresler ve telefonlar
 * veritabanindaki sirket bilgisinden (settings.company) gelir; menu ve
 * kartlar iki modda aynidir (demo modu: tests/e2e/destek.spec.ts).
 */
test.afterAll(closeDatabase);

type Company = { email: string; offices: { city: string; addressLines: string[]; phones: string[] }[] };

test("/destek: iletişim bilgileri veritabanındaki şirket bilgisinden; menü ve kartlar aynı", async ({ page, problems }) => {
  const [{ value: company }] = await sql<{ value: Company }>("SELECT value FROM settings WHERE key = 'company'");
  await page.goto("/destek");

  const main = page.locator("main");
  await expect(main.getByRole("link", { name: /^İade ve Değişim/ })).toHaveAttribute("href", "/yasal/iade");
  await expect(main.getByRole("link", { name: /^Garanti Sorgulama/ })).toHaveAttribute("href", "/garanti/sorgulama");

  const contact = main.locator("section").filter({ hasText: "Destek ekibimize ulaşın" });
  await expect(contact.getByRole("link", { name: company.email })).toHaveAttribute("href", `mailto:${company.email}`);
  for (const office of company.offices) {
    for (const line of office.addressLines) await expect(contact).toContainText(line);
    for (const phone of office.phones) await expect(contact.getByRole("link", { name: phone })).toBeVisible();
  }

  await page.setViewportSize({ width: 1440, height: 900 });
  const title = page.locator("header nav").getByRole("link", { name: "Destek ve Garanti" });
  await title.hover();
  await expect(page.locator(".zw-mega").getByRole("link", { name: "Tümünü Gör" })).toHaveAttribute("href", "/destek");
  expect(problems).toEqual([]);
});
