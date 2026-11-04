import type { Page } from "@playwright/test";
import { demoAccount } from "../e2e/yardimci";
import { closeDatabase, expect, memberLogin, sql, test } from "./yardimci";

/**
 * PANEL GIRISI VE KORUMASI (Asama 4.3; IS-KURALLARI › 16, KARARLAR K-94)
 *
 * Veritabani modunda panel girisi sunucudadir; gecerli yonetici oturumu
 * olmadan /yonetim sayfalari sunucuda gonderilmez. Panel oturumu 8 saat
 * surer, uzamaz.
 */
test.describe.configure({ mode: "serial" });
test.afterAll(closeDatabase);

const admin = demoAccount("Yönetici");
const adminSessions = async () =>
  (
    await sql<{ n: number }>(
      "SELECT count(*)::int AS n FROM sessions s JOIN users u ON u.id = s.user_id WHERE u.email = $1 AND s.scope = 'admin'",
      [admin.email],
    )
  )[0].n;

async function panelLogin(page: Page, email: string, password: string) {
  await page.fill("#admin-email", email);
  await page.fill("#admin-password", password);
  await page.locator("form button[type=submit]").click();
}

test("oturumsuz panel sunucuda gönderilmez; girişten sonra istenen sayfaya dönülür", async ({ page, context, request, problems }) => {
  const html = await (await request.get("/yonetim/urunler")).text();
  expect(html).toContain("Giriş sayfasına yönlendiriliyor");
  expect(html).not.toContain("Yükleniyor…");

  await page.goto("/yonetim/urunler");
  await expect(page).toHaveURL(/\/yonetim\/giris\?next=%2Fyonetim%2Furunler/);
  await panelLogin(page, admin.email, admin.password);
  await expect(page).toHaveURL(/\/yonetim\/urunler$/);
  await expect(page.getByRole("button", { name: "Çıkış" })).toBeVisible();

  const cookies = await context.cookies();
  expect(cookies.find((c) => c.name === "zw_panel")).toMatchObject({ httpOnly: true, sameSite: "Lax" });
  expect(cookies.find((c) => c.name === "zw_oturum")).toBeUndefined();
  const [session] = await sql<{ hours: number }>(
    `SELECT extract(epoch FROM s.expires_at - s.created_at) / 3600 AS hours
       FROM sessions s JOIN users u ON u.id = s.user_id WHERE u.email = $1 AND s.scope = 'admin'`,
    [admin.email],
  );
  expect(Number(session.hours)).toBe(8);
  // Sayfa yenilense de panel acik.
  await page.reload();
  await expect(page.getByRole("button", { name: "Çıkış" })).toBeVisible();
  expect(problems).toEqual([]);
});

test("üye panele giremez; sitedeki oturum panel için geçmez", async ({ page }) => {
  await memberLogin(page);
  await page.goto("/yonetim");
  await expect(page).toHaveURL(/\/yonetim\/giris/);
  const member = demoAccount("Bireysel");
  await panelLogin(page, member.email, member.password);
  await expect(page.locator("form")).toContainText("E-posta ya da şifre hatalı.");
  await panelLogin(page, admin.email, "yanlis-sifre");
  await expect(page.locator("form")).toContainText("E-posta ya da şifre hatalı.");
});

test("çıkış oturumu kapatır; askıya alınan ya da süresi dolan yöneticinin oturumu geçersiz", async ({ page }) => {
  const enter = async () => {
    await page.goto("/yonetim/giris");
    await panelLogin(page, admin.email, admin.password);
    await expect(page.getByRole("button", { name: "Çıkış" })).toBeVisible();
  };
  try {
    await enter();
    const before = await adminSessions();
    await page.getByRole("button", { name: "Çıkış" }).click();
    await expect(page).toHaveURL(/\/yonetim\/giris/);
    await expect.poll(adminSessions).toBe(before - 1);
    await page.goto("/yonetim");
    await expect(page).toHaveURL(/\/yonetim\/giris/);

    await enter();
    await sql("UPDATE users SET status = 'suspended' WHERE email = $1", [admin.email]);
    await page.goto("/yonetim/siparisler");
    await expect(page).toHaveURL(/\/yonetim\/giris/);
    await sql("UPDATE users SET status = 'active' WHERE email = $1", [admin.email]);

    await enter();
    // 8 saat gecmis gibi.
    await sql(
      `UPDATE sessions SET expires_at = now() - interval '1 second'
        WHERE scope = 'admin' AND user_id = (SELECT id FROM users WHERE email = $1)`,
      [admin.email],
    );
    await page.goto("/yonetim");
    await expect(page).toHaveURL(/\/yonetim\/giris/);
  } finally {
    await sql("UPDATE users SET status = 'active' WHERE email = $1", [admin.email]);
  }
});

test("panelde de 10 yanlış şifreden sonra 15 dakika giriş yapılamaz", async ({ request }) => {
  try {
    for (let i = 0; i < 9; i++) {
      const answer = await request.post("/api/yonetim/oturum/giris", { data: { email: admin.email, password: "yanlis" } });
      expect(answer.status()).toBe(401);
    }
    const tenth = await request.post("/api/yonetim/oturum/giris", { data: { email: admin.email, password: "yanlis" } });
    expect([tenth.status(), (await tenth.json()).error]).toEqual([429, "Çok fazla deneme yapıldı. 15 dakika sonra tekrar deneyin."]);
    const locked = await request.post("/api/yonetim/oturum/giris", { data: admin });
    expect(locked.status()).toBe(429);
  } finally {
    await sql(
      "UPDATE users SET failed_login_count = 0, failed_login_since = NULL, login_locked_until = NULL WHERE email = $1",
      [admin.email],
    );
  }
});
