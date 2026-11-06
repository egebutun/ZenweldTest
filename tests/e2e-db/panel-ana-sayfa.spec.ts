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

test("özet sunucuda hesaplanır: sayfaya kayıtların kendisi gelmez, dönem değişince yeniden hesaplanır", async ({ page }) => {
  await panelLogin(page);
  const response = await page.goto("/yonetim");
  await expect(page.getByRole("heading", { name: "Genel durum" })).toBeVisible();

  // Sayfanin HTML'i (sunucunun gonderdigi veri dahil) uyelerin ve
  // musterilerin e-posta ve telefonlarini tasimaz; yalnizca sonuc gelir.
  const html = await response!.text();
  const members = await sql<{ email: string; phone: string }>("SELECT email, phone FROM users WHERE role <> 'admin' LIMIT 5");
  const orders = await sql<{ email: string }>("SELECT email FROM orders LIMIT 5");
  expect(members.length).toBeGreaterThan(0);
  for (const { email, phone } of members) {
    expect(html).not.toContain(email);
    expect(html).not.toContain(phone);
  }
  for (const { email } of orders) expect(html).not.toContain(email);

  // Donem degisince sunucu yeniden hesaplar: "Bugun" saatlik kirilimdir.
  const today = page.getByRole("radio", { name: "Bugün" });
  await today.click();
  await expect(today).toHaveAttribute("aria-checked", "true");
  await expect(page.getByText("Saatlik ciro", { exact: false })).toBeVisible();
  expect((await page.context().cookies()).find((c) => c.name === "zw_panel_aralik")?.value).toBe("today");

  // Bugunun siparis sayisi (iptal haric, Turkiye gunu) veritabanindakiyle ayni.
  const n = await count(
    `SELECT count(*) AS n FROM orders WHERE status <> 'cancelled'
       AND created_at >= (date_trunc('day', now() AT TIME ZONE 'Europe/Istanbul') AT TIME ZONE 'Europe/Istanbul')`,
  );
  // Ozet kutusu: etiketin hemen altinda deger (grafikler genel durumdan once gelir).
  const value = page.getByText("Sipariş", { exact: true }).first().locator("xpath=following-sibling::div[1]");
  await expect(value).toHaveText(String(n));

  // Secim hatirlanir: sayfa yeniden acilinca sunucu ayni donemle hesaplar.
  await page.reload();
  await expect(page.getByRole("radio", { name: "Bugün" })).toHaveAttribute("aria-checked", "true");
  await expect(page.getByText("Saatlik ciro", { exact: false })).toBeVisible();
});
