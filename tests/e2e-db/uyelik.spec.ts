import { createHash } from "node:crypto";
import type { APIRequestContext, Page } from "@playwright/test";
import { demoHash } from "../../packages/auth/src/hash";
import { demoAccount, field } from "../e2e/yardimci";
import { closeDatabase, expect, memberLogin, newVisitor, sql, test } from "./yardimci";

/**
 * SITE UYELIGI SUNUCUDA (Asama 4.2; IS-KURALLARI › 16, KARARLAR K-94)
 *
 * Veritabani modunda kayit, giris, cikis, sifre degistirme, hesap silme ve
 * sifre sifirlama (Asama 4.4, K-95) sunucudan yapilir; oturum yalnizca
 * sunucunun okuyabildigi cerezdedir.
 * Her test kendi uyesini olusturur.
 */
test.describe.configure({ mode: "serial" });
test.afterAll(closeDatabase);

const INVALID = "E-posta ya da şifre hatalı.";
const LOCKED = "Çok fazla deneme yapıldı. 15 dakika sonra tekrar deneyin.";
const newEmail = (name: string) => `${name}-${Date.now()}@ornek.com`;

async function registerViaForm(page: Page, email: string, password: string) {
  await page.goto("/kayit");
  const main = page.locator("main");
  await field(main, "Ad").fill("Deneme");
  await field(main, "Soyad").fill("Üye");
  await field(main, "E-posta").fill(email);
  await field(main, "Telefon").fill("05551112233");
  await field(main, "Şifre").fill(password);
  await field(main, "Şifre (Tekrar)").fill(password);
  await page.locator('label:has-text("okudum ve kabul ediyorum") input[type=checkbox]').check();
  await page.getByRole("button", { name: "Hesap Oluştur" }).click();
}

async function loginViaForm(page: Page, email: string, password: string) {
  await page.goto("/giris");
  const form = page.locator("main form").filter({ has: page.locator("input[type=password]") });
  await form.locator("input[type=email]").fill(email);
  await form.locator("input[type=password]").fill(password);
  await form.locator("button[type=submit]").click();
}

const registerViaApi = (request: APIRequestContext, email: string, password: string) =>
  request.post("/api/uyelik/kayit", {
    data: { role: "individual", email, password, firstName: "Deneme", lastName: "Üye", phone: "05551112233" },
  });

const sessionsOf = async (email: string) =>
  (
    await sql<{ n: number }>(
      "SELECT count(*)::int AS n FROM sessions s JOIN users u ON u.id = s.user_id WHERE u.email = $1",
      [email],
    )
  )[0].n;

test("kayıt, çıkış ve giriş sunucuda; oturum çerezi sayfanın koduna kapalı", async ({ page, context, problems }) => {
  const email = newEmail("kayit");
  // Kisa sifre: tarayici formu gondermez; sunucu da kabul etmez.
  await page.goto("/kayit");
  expect(await page.locator("main input[type=password]").first().getAttribute("minlength")).toBe("8");
  expect((await (await registerViaApi(page.request, email, "kisa")).json()).error).toBe("Şifre en az 8 karakter olmalıdır.");
  await registerViaForm(page, email, "uzun-sifre-1");
  await expect(page).toHaveURL(/\/hesabim/);
  await expect(page.locator("main")).toContainText("Deneme");

  const [user] = await sql<{ password_hash: string; role: string }>("SELECT password_hash, role FROM users WHERE email = $1", [email]);
  expect(user).toMatchObject({ role: "individual", password_hash: expect.stringMatching(/^\$argon2id\$/) });
  const cookie = (await context.cookies()).find((c) => c.name === "zw_oturum");
  expect(cookie).toMatchObject({ httpOnly: true, sameSite: "Lax", path: "/" });
  expect(await page.evaluate(() => document.cookie)).not.toContain("zw_oturum");
  expect(await page.evaluate(() => localStorage.getItem("zenweld.session.v1"))).toBeNull();
  expect(await sessionsOf(email)).toBe(1);

  // Ayni e-postayla ikinci kayit olmaz.
  expect((await (await registerViaApi(page.request, email.toUpperCase(), "uzun-sifre-1")).json()).error).toBe(
    "Bu e-posta adresi zaten kayıtlı.",
  );

  await page.goto("/cikis");
  await expect(page.locator("main")).toContainText("Çıkış yaptınız.");
  await expect.poll(() => sessionsOf(email)).toBe(0);
  await page.goto("/hesabim");
  await expect(page.getByRole("link", { name: "Giriş Yap" }).last()).toBeVisible();

  await loginViaForm(page, email, "uzun-sifre-1");
  await expect(page).toHaveURL(/\/hesabim/);
  // Sayfa yenilenince de oturum acik (sunucudan okunur).
  await page.reload();
  await expect(page.locator("main")).toContainText("Deneme");
  expect(problems).toEqual([]);
});

test("yanlış şifre, olmayan hesap ve yönetici hesabı aynı mesajı alır; 10 yanlışta 15 dakika bekleme", async ({
  page,
}) => {
  const email = newEmail("deneme-siniri");
  await registerViaApi(page.request, email, "uzun-sifre-1");
  await page.request.post("/api/uyelik/cikis", { data: {} });

  for (const [who, password] of [
    [email, "yanlis-sifre"],
    ["olmayan@ornek.com", "uzun-sifre-1"],
    [demoAccount("Yönetici").email, demoAccount("Yönetici").password],
  ]) {
    await loginViaForm(page, who, password);
    await expect(page.locator("main")).toContainText(INVALID);
  }

  // Bu hesaba simdiye kadar 1 yanlis; 9 yanlis daha kilitler.
  for (let i = 0; i < 8; i++) {
    const answer = await page.request.post("/api/uyelik/giris", { data: { email, password: "yanlis" } });
    expect(answer.status()).toBe(401);
  }
  const tenth = await page.request.post("/api/uyelik/giris", { data: { email, password: "yanlis" } });
  expect([tenth.status(), (await tenth.json()).error]).toEqual([429, LOCKED]);
  await loginViaForm(page, email, "uzun-sifre-1");
  await expect(page.locator("main")).toContainText(LOCKED);

  // 15 dakika gecmis gibi: dogru sifreyle girilir.
  await sql("UPDATE users SET login_locked_until = now() - interval '1 second' WHERE email = $1", [email]);
  await loginViaForm(page, email, "uzun-sifre-1");
  await expect(page).toHaveURL(/\/hesabim/);
});

test("şifre değişince diğer cihazdaki oturum kapanır, bu cihazdaki açık kalır", async ({ browser }) => {
  const email = newEmail("sifre");
  const here = await newVisitor(browser);
  const there = await newVisitor(browser);
  try {
    const page = await here.newPage();
    const other = await there.newPage();
    await registerViaApi(page.request, email, "uzun-sifre-1");
    await loginViaForm(other, email, "uzun-sifre-1");
    await expect(other).toHaveURL(/\/hesabim/);

    await page.goto("/hesabim/profil");
    await page.fill("#current-password", "uzun-sifre-1");
    await page.fill("#new-password", "yeni-sifre-22");
    await page.fill("#new-password-again", "yeni-sifre-22");
    await page.getByRole("button", { name: "Şifre Değiştir" }).click();
    await expect(page.locator("main")).toContainText("Şifreniz değiştirildi.");

    await other.goto("/hesabim");
    await expect(other.getByRole("link", { name: "Giriş Yap" }).last()).toBeVisible();
    await page.goto("/hesabim");
    await expect(page.locator("main")).toContainText("Deneme");
    expect(await sessionsOf(email)).toBe(1);
  } finally {
    await here.close();
    await there.close();
  }
});

test("profil kaydedilir; hesap silinince üye veritabanından gider", async ({ page }) => {
  page.on("dialog", (dialog) => dialog.accept());
  const email = newEmail("sil");
  await registerViaApi(page.request, email, "uzun-sifre-1");

  await page.goto("/hesabim/profil");
  const city = field(page.locator("main form").first(), "Şehir");
  await city.fill("Konya");
  await page.getByRole("button", { name: "Kaydet" }).first().click();
  await expect(page.locator("main")).toContainText("Profiliniz güncellendi.");
  expect((await sql<{ city: string }>("SELECT city FROM users WHERE email = $1", [email]))[0].city).toBe("Konya");

  await page.fill("#delete-password", "yanlis-sifre");
  await page.getByRole("button", { name: "Hesabımı Sil" }).click();
  await expect(page.locator("main")).toContainText("Şifre hatalı.");
  await page.fill("#delete-password", "uzun-sifre-1");
  await page.getByRole("button", { name: "Hesabımı Sil" }).click();
  await expect(page).toHaveURL(/\/giris\?hesap=silindi/);
  expect(await sql("SELECT 1 FROM users WHERE email = $1", [email])).toHaveLength(0);
  await loginViaForm(page, email, "uzun-sifre-1");
  await expect(page.locator("main")).toContainText(INVALID);
});

test("demo üyenin eski şifresi ilk girişte güçlü özete çevrilir", async ({ page }) => {
  const { email, password } = demoAccount("Bireysel");
  await sql("UPDATE users SET password_hash = $2 WHERE email = $1", [email, demoHash(password)]);
  await memberLogin(page);
  const [row] = await sql<{ password_hash: string }>("SELECT password_hash FROM users WHERE email = $1", [email]);
  expect(row.password_hash).toMatch(/^\$argon2id\$/);
});

test("başka bir siteden gelen istek ve oturumsuz işlem reddedilir", async ({ request }) => {
  const foreign = await request.post("/api/uyelik/giris", {
    headers: { origin: "https://baska-site.example" },
    data: { email: "x@ornek.com", password: "uzun-sifre-1" },
  });
  expect(foreign.status()).toBe(403);
  const anonymous = await request.post("/api/uyelik/sifre", { data: { current: "a", next: "uzun-sifre-1" } });
  expect([anonymous.status(), (await anonymous.json()).error]).toEqual([401, "Oturumunuz kapanmış. Lütfen yeniden giriş yapın."]);
  expect((await (await request.get("/api/uyelik/ben")).json()).user).toBeNull();
});

test("şifre sıfırlama: aynı mesaj; bağlantıyla yeni şifre, tek kullanım, diğer oturumlar kapanır", async ({ page, browser }) => {
  const email = newEmail("sifirla");
  const other = await newVisitor(browser);
  try {
    // Baska bir cihazda acik oturum.
    await registerViaApi((await other.newPage()).request, email, "uzun-sifre-1");

    const linksOf = async () =>
      (await sql<{ n: number }>("SELECT count(*)::int AS n FROM password_reset_tokens t JOIN users u ON u.id = t.user_id WHERE u.email = $1", [email]))[0].n;
    for (const who of ["olmayan-hesap@ornek.com", email]) {
      await page.goto("/sifremi-unuttum");
      await page.fill("#email", who);
      await page.getByRole("button", { name: "Sıfırlama Bağlantısı Gönder" }).click();
      await expect(page.locator("main")).toContainText("Bu e-postayla kayıtlı bir hesap varsa şifre sıfırlama bağlantısı gönderildi.");
    }
    expect(await linksOf()).toBe(1);

    // E-posta bu ortamda gitmez: bilinen bir anahtar dogrudan yazilir.
    const token = `e2e-${Date.now()}`;
    await sql("DELETE FROM password_reset_tokens WHERE user_id = (SELECT id FROM users WHERE email = $1)", [email]);
    await sql(
      `INSERT INTO password_reset_tokens (token_hash, user_id, expires_at)
       SELECT $2, id, now() + interval '1 hour' FROM users WHERE email = $1`,
      [email, createHash("sha256").update(token).digest("hex")],
    );

    await page.goto("/sifre-sifirla");
    await expect(page.locator("main")).toContainText("Bağlantı geçersiz ya da süresi dolmuş.");

    await page.goto(`/sifre-sifirla?anahtar=${token}`);
    await page.fill("#reset-password", "yeni-sifre-33");
    await page.fill("#reset-password-again", "yeni-sifre-33");
    await page.getByRole("button", { name: "Şifreyi Değiştir" }).click();
    await expect(page).toHaveURL(/\/giris\?sifre=degisti/);
    await expect(page.locator("main")).toContainText("Şifreniz değiştirildi. Yeni şifrenizle giriş yapabilirsiniz.");
    expect(await sessionsOf(email)).toBe(0);

    await loginViaForm(page, email, "yeni-sifre-33");
    await expect(page).toHaveURL(/\/hesabim/);

    // Ayni baglanti ikinci kez calismaz.
    await page.goto(`/sifre-sifirla?anahtar=${token}`);
    await page.fill("#reset-password", "baska-sifre-44");
    await page.fill("#reset-password-again", "baska-sifre-44");
    await page.getByRole("button", { name: "Şifreyi Değiştir" }).click();
    await expect(page.locator("main")).toContainText("Bağlantı geçersiz ya da süresi dolmuş.");
    await expect(page.getByRole("link", { name: "Yeni bağlantı iste" })).toBeVisible();
  } finally {
    await other.close();
  }
});
