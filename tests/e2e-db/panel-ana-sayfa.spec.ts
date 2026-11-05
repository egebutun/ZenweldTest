import type { Page } from "@playwright/test";
import { demoAccount } from "../e2e/yardimci";
import { closeDatabase, expect, sql, test } from "./yardimci";

/**
 * PANEL ANA SAYFASI VERITABANINDA (Asama 5, 6. alan, adim 6.3; KARARLAR K-99)
 *
 * Ana sayfanin sayilari veritabanindaki kayitlardir: siparis, uye (yonetici
 * haric), garanti kaydi, teklif. Sitede verilen yeni teklif sayfa
 * yenilenince sayiya eklenir.
 */
test.afterAll(closeDatabase);

const admin = demoAccount("Yönetici");

async function panelLogin(page: Page) {
  await page.goto("/yonetim/giris");
  await page.fill("#admin-email", admin.email);
  await page.fill("#admin-password", admin.password);
  await page.locator("form button[type=submit]").click();
  await expect(page.getByRole("button", { name: "Çıkış" })).toBeVisible();
}

const count = async (query: string) => Number((await sql<{ n: string }>(query))[0].n);

/** Genel durum kutusunun sayisi (kutu panelin ilgili sayfasina baglanir). */
const card = (page: Page, href: string) => page.locator(`a[href="${href}"]`).filter({ has: page.locator(".font-display") }).first();

test("genel durum kutuları veritabanındaki sayıları gösterir", async ({ page }) => {
  await panelLogin(page);
  await page.goto("/yonetim");
  await expect(page.getByRole("heading", { name: "Genel durum" })).toBeVisible();

  const expected: [string, number][] = [
    ["/yonetim/siparisler", await count("SELECT count(*) AS n FROM orders")],
    ["/yonetim/uyeler", await count("SELECT count(*) AS n FROM users WHERE role <> 'admin'")],
    ["/yonetim/garantiler", await count("SELECT count(*) AS n FROM warranties")],
    ["/yonetim/teklifler", await count("SELECT count(*) AS n FROM quotes")],
  ];
  for (const [href, n] of expected) {
    await expect(card(page, href).locator(".font-display"), href).toHaveText(String(n));
  }

  // Yeni teklif: sayfa yenilenince sayi bir artar.
  const quotes = expected[3][1];
  const stamp = Date.now();
  await sql(
    `INSERT INTO quotes (id, code, status, company_name, contact_name, email, phone, city, payment_preference)
     VALUES ($1, $2, 'new', 'Deneme', 'Ad', 'ana@ornek.com', '0555', 'Konya', 'belirsiz')`,
    [`q-ana-${stamp}`, `TKL-ANA-${stamp}`],
  );
  try {
    await page.reload();
    await expect(card(page, "/yonetim/teklifler").locator(".font-display")).toHaveText(String(quotes + 1));
  } finally {
    await sql("DELETE FROM quotes WHERE id = $1", [`q-ana-${stamp}`]);
  }
});
