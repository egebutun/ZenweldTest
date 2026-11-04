import { afterAll, describe, expect, it } from "vitest";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import type { PoolClient } from "pg";
import { demoHash } from "../../packages/auth/src/hash";
import {
  AUTH_ERRORS,
  changePassword,
  checkPassword,
  createSession,
  deleteAccount,
  deleteSession,
  deleteUserSessions,
  hashPassword,
  login,
  readSession,
  register,
  requestPasswordReset,
  resetPassword,
  updateProfile,
} from "../../packages/auth/src/server";
import * as schema from "../../packages/db/src/schema";
import { closePool, inTransaction, user } from "./ortak";

/*
 * Sifre ozeti, oturumlar ve uyelik islemleri (packages/auth/src/server;
 * KARARLAR K-94, docs/VERITABANI.md › 14 › Sifre ve oturum). Her test kendi isleminde
 * calisir ve sonunda geri alinir.
 */

afterAll(closePool);

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const start = new Date("2026-11-04T09:00:00Z");
const later = (ms: number) => new Date(start.getTime() + ms);

async function withUsers(run: (db: NodePgDatabase<typeof schema>, client: PoolClient) => Promise<void>) {
  await inTransaction(async (client) => {
    await user(client, "u-uye", "uye@ornek.com");
    await user(client, "u-yonetici", "yonetici@ornek.com");
    await client.query("UPDATE users SET role = 'admin' WHERE id = 'u-yonetici'");
    await run(drizzle(client, { schema }), client);
  });
}

describe("şifre özeti", () => {
  it("argon2id ile özetlenir; doğru şifre geçer, yanlış geçmez", async () => {
    const stored = await hashPassword("uzun-sifre-1");
    expect(stored).toMatch(/^\$argon2id\$v=19\$m=19456,t=2,p=1\$/);
    expect(await hashPassword("uzun-sifre-1")).not.toBe(stored);
    expect(await checkPassword("uzun-sifre-1", stored)).toEqual({ ok: true });
    expect(await checkPassword("uzun-sifre-2", stored)).toEqual({ ok: false });
    expect(await checkPassword("uzun-sifre-1", "bozuk-ozet")).toEqual({ ok: false });
  });

  it("eski demo özeti doğrulanır ve güçlü özete çevrilir", async () => {
    const result = await checkPassword("admin123", demoHash("admin123"));
    expect(result.ok).toBe(true);
    expect(result.upgraded).toMatch(/^\$argon2id\$/);
    expect(await checkPassword("admin123", result.upgraded!)).toEqual({ ok: true });
    expect(await checkPassword("yanlis", demoHash("admin123"))).toEqual({ ok: false });
  });
});

describe("oturumlar", () => {
  it("anahtarın kendisi saklanmaz; oturum yalnızca kendi türünde ve rolünde geçerli", async () => {
    await withUsers(async (db, client) => {
      const site = await createSession(db, "u-uye", "site", { ip: "203.0.113.5", userAgent: "Deneme" }, start);
      expect(site.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
      const stored = (await client.query("SELECT id, ip::text AS ip FROM sessions")).rows;
      expect(stored).toHaveLength(1);
      expect(stored[0].id).not.toBe(site.token);
      expect(stored[0].ip).toBe("203.0.113.5/32");

      expect((await readSession(db, site.token, "site", later(HOUR / 2)))?.user.id).toBe("u-uye");
      expect(await readSession(db, site.token, "admin", later(HOUR / 2))).toBeNull();
      expect(await readSession(db, "baska-anahtar", "site", later(HOUR / 2))).toBeNull();
      expect(await readSession(db, undefined, "site", later(HOUR / 2))).toBeNull();

      // Uye panele, yonetici siteye giremez.
      const memberAdmin = await createSession(db, "u-uye", "admin", {}, start);
      expect(await readSession(db, memberAdmin.token, "admin", start)).toBeNull();
      const adminSite = await createSession(db, "u-yonetici", "site", {}, start);
      expect(await readSession(db, adminSite.token, "site", start)).toBeNull();
    });
  });

  it("site oturumu 30 gün ve kullanıldıkça uzar; panel oturumu 8 saatte biter, uzamaz", async () => {
    await withUsers(async (db) => {
      const site = await createSession(db, "u-uye", "site", {}, start);
      expect(site.expiresAt).toEqual(later(30 * DAY));
      // Bir saatten kisa surede tekrar kullanilinca yazilmaz.
      expect((await readSession(db, site.token, "site", later(HOUR / 2)))?.expiresAt).toEqual(later(30 * DAY));
      // 20. gunde kullanilinca 30 gun daha.
      expect((await readSession(db, site.token, "site", later(20 * DAY)))?.expiresAt).toEqual(later(50 * DAY));
      expect(await readSession(db, site.token, "site", later(49 * DAY))).not.toBeNull();
      expect(await readSession(db, site.token, "site", later(81 * DAY))).toBeNull();

      const admin = await createSession(db, "u-yonetici", "admin", {}, start);
      expect(admin.expiresAt).toEqual(later(8 * HOUR));
      expect((await readSession(db, admin.token, "admin", later(7 * HOUR)))?.expiresAt).toEqual(later(8 * HOUR));
      expect(await readSession(db, admin.token, "admin", later(8 * HOUR + 1))).toBeNull();
    });
  });

  it("askıya alınan ya da rolü değişen üyenin oturumu geçersiz", async () => {
    await withUsers(async (db, client) => {
      const site = await createSession(db, "u-uye", "site", {}, start);
      await client.query("UPDATE users SET status = 'suspended' WHERE id = 'u-uye'");
      expect(await readSession(db, site.token, "site", start)).toBeNull();
      await client.query("UPDATE users SET status = 'active', role = 'admin' WHERE id = 'u-uye'");
      expect(await readSession(db, site.token, "site", start)).toBeNull();
    });
  });

  it("çıkış oturumu kapatır; şifre değişince diğer oturumlar kapanır; yeni girişte süresi dolmuşlar silinir", async () => {
    await withUsers(async (db, client) => {
      const phone = await createSession(db, "u-uye", "site", {}, start);
      const laptop = await createSession(db, "u-uye", "site", {}, start);
      await deleteSession(db, phone.token);
      expect(await readSession(db, phone.token, "site", start)).toBeNull();

      const tablet = await createSession(db, "u-uye", "site", {}, start);
      const current = await readSession(db, laptop.token, "site", start);
      expect(await deleteUserSessions(db, "u-uye", current!.sessionId)).toBe(1);
      expect(await readSession(db, tablet.token, "site", start)).toBeNull();
      expect(await readSession(db, laptop.token, "site", start)).not.toBeNull();

      // 31 gun sonra yeni giris: suresi dolan oturum silinir.
      await createSession(db, "u-uye", "site", {}, later(31 * DAY));
      expect((await client.query("SELECT count(*)::int AS n FROM sessions WHERE user_id = 'u-uye'")).rows[0].n).toBe(1);
    });
  });
});

describe("üyelik işlemleri (site)", () => {
  const member = { role: "individual", email: "Yeni@Ornek.com", password: "uzun-sifre-1", firstName: "Ad", lastName: "Soyad", phone: "05550000000" };

  it("kayıt: güçlü özetle, hemen aktif, oturum açık; aynı e-posta ve eksik alan reddedilir", async () => {
    await withUsers(async (db, client) => {
      const result = await register(db, member, {}, start);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.user).toMatchObject({ email: "yeni@ornek.com", role: "individual", status: "active", passwordHash: "" });
      expect((await readSession(db, result.session.token, "site", start))?.user.id).toBe(result.user.id);
      const [row] = (await client.query("SELECT password_hash FROM users WHERE id = $1", [result.user.id])).rows;
      expect(row.password_hash).toMatch(/^\$argon2id\$/);

      expect(await register(db, { ...member, email: "YENI@ornek.com" }, {}, start)).toMatchObject({ ok: false, status: 409, error: AUTH_ERRORS.emailTaken });
      expect(await register(db, { ...member, email: "x@y.com", password: "kisa" }, {}, start)).toMatchObject({ ok: false, error: "Şifre en az 8 karakter olmalıdır." });
      expect(await register(db, { ...member, email: "x@y.com", phone: " " }, {}, start)).toMatchObject({ ok: false, error: AUTH_ERRORS.missingFields });
      expect(await register(db, { ...member, email: "x@y.com", role: "business" }, {}, start)).toMatchObject({ ok: false, error: AUTH_ERRORS.missingFields });
      expect(await register(db, { ...member, email: "x@y.com", role: "admin" }, {}, start)).toMatchObject({ ok: false, status: 400 });
      expect(await register(db, { ...member, email: "gecersiz" }, {}, start)).toMatchObject({ ok: false, error: AUTH_ERRORS.invalidEmail });
    });
  });

  it("giriş: hesap yoksa, yöneticiyse ya da şifre yanlışsa aynı mesaj; doğruysa oturum açılır", async () => {
    await withUsers(async (db, client) => {
      await client.query("UPDATE users SET password_hash = $1", [await hashPassword("dogru-sifre")]);
      const login1 = (email: string, password: string) => login(db, { email, password }, "site", {}, start);
      for (const attempt of [login1("yok@ornek.com", "dogru-sifre"), login1("yonetici@ornek.com", "dogru-sifre"), login1("uye@ornek.com", "yanlis")]) {
        expect(await attempt).toEqual({ ok: false, status: 401, error: AUTH_ERRORS.invalidLogin });
      }
      const ok = await login1(" UYE@ornek.com ", "dogru-sifre");
      expect(ok.ok && ok.user.id).toBe("u-uye");
      const [row] = (await client.query("SELECT failed_login_count, last_login_at FROM users WHERE id = 'u-uye'")).rows;
      expect(row.failed_login_count).toBe(0);
      expect(row.last_login_at).toEqual(start);

      // Panelde yonetici girer, uye giremez.
      expect((await login(db, { email: "yonetici@ornek.com", password: "dogru-sifre" }, "admin", {}, start)).ok).toBe(true);
      expect((await login(db, { email: "uye@ornek.com", password: "dogru-sifre" }, "admin", {}, start)).ok).toBe(false);

      await client.query("UPDATE users SET status = 'suspended' WHERE id = 'u-uye'");
      expect(await login1("uye@ornek.com", "dogru-sifre")).toEqual({ ok: false, status: 403, error: AUTH_ERRORS.suspended });
    });
  });

  it("10 yanlış denemede 15 dakika giriş yapılamaz (doğru şifreyle de); süre dolunca girilir", async () => {
    await withUsers(async (db, client) => {
      await client.query("UPDATE users SET password_hash = $1 WHERE id = 'u-uye'", [await hashPassword("dogru-sifre")]);
      const attempt = (password: string, minute: number) =>
        login(db, { email: "uye@ornek.com", password }, "site", {}, new Date(start.getTime() + minute * 60_000));
      for (let i = 0; i < 9; i++) expect((await attempt("yanlis", i)).ok).toBe(false);
      expect(await attempt("yanlis", 9)).toMatchObject({ status: 429, error: AUTH_ERRORS.tooManyAttempts });
      expect(await attempt("dogru-sifre", 10)).toMatchObject({ status: 429, error: AUTH_ERRORS.tooManyAttempts });
      expect((await attempt("dogru-sifre", 25)).ok).toBe(true);
    });
  });

  it("eski demo özetiyle girişte şifre güçlü özete çevrilir", async () => {
    await withUsers(async (db, client) => {
      await client.query("UPDATE users SET password_hash = $1 WHERE id = 'u-uye'", [demoHash("eski-sifre")]);
      expect((await login(db, { email: "uye@ornek.com", password: "eski-sifre" }, "site", {}, start)).ok).toBe(true);
      const [row] = (await client.query("SELECT password_hash FROM users WHERE id = 'u-uye'")).rows;
      expect(row.password_hash).toMatch(/^\$argon2id\$/);
      expect((await login(db, { email: "uye@ornek.com", password: "eski-sifre" }, "site", {}, start)).ok).toBe(true);
    });
  });

  it("profil, şifre değiştirme (diğer oturumlar kapanır) ve hesap silme", async () => {
    await withUsers(async (db, client) => {
      await client.query("UPDATE users SET password_hash = $1 WHERE id = 'u-uye'", [await hashPassword("dogru-sifre")]);
      const updated = await updateProfile(db, "u-uye", { firstName: " Yeni ", lastName: "Ad", phone: "0555", city: "", email: "baska@ornek.com" });
      expect(updated.ok && updated.user).toMatchObject({ firstName: "Yeni", email: "uye@ornek.com" });
      expect(updated.ok && updated.user.city).toBeUndefined();
      expect(await updateProfile(db, "u-uye", { firstName: "", lastName: "Ad", phone: "0555" })).toMatchObject({ error: AUTH_ERRORS.missingFields });

      const here = await createSession(db, "u-uye", "site", {}, start);
      const other = await createSession(db, "u-uye", "site", {}, start);
      const current = (await readSession(db, here.token, "site", start))!;
      expect(await changePassword(db, "u-uye", current.sessionId, { current: "yanlis", next: "yeni-sifre-1" })).toMatchObject({ error: AUTH_ERRORS.wrongCurrentPassword });
      expect(await changePassword(db, "u-uye", current.sessionId, { current: "dogru-sifre", next: "kisa" })).toMatchObject({ error: "Şifre en az 8 karakter olmalıdır." });
      expect(await changePassword(db, "u-uye", current.sessionId, { current: "dogru-sifre", next: "yeni-sifre-1" })).toEqual({ ok: true });
      expect(await readSession(db, other.token, "site", start)).toBeNull();
      expect(await readSession(db, here.token, "site", start)).not.toBeNull();

      expect(await deleteAccount(db, "u-uye", { password: "dogru-sifre" })).toMatchObject({ error: AUTH_ERRORS.wrongPassword });
      expect(await deleteAccount(db, "u-uye", { password: "yeni-sifre-1" })).toEqual({ ok: true });
      expect((await client.query("SELECT count(*)::int AS n FROM users WHERE id = 'u-uye'")).rows[0].n).toBe(0);
      expect(await readSession(db, here.token, "site", start)).toBeNull();
    });
  });
});

describe("şifre sıfırlama (K-95)", () => {
  const minutes = (m: number) => new Date(start.getTime() + m * 60_000);
  const tokens = async (client: PoolClient) =>
    (await client.query("SELECT token_hash, used_at FROM password_reset_tokens WHERE user_id = 'u-uye'")).rows;

  it("bağlantı yalnızca aktif üyeye; 15 dakikada bir; yeni bağlantı eskisini geçersiz kılar", async () => {
    await withUsers(async (db, client) => {
      expect(await requestPasswordReset(db, "yok@ornek.com", start)).toBeNull();
      expect(await requestPasswordReset(db, "yonetici@ornek.com", start)).toBeNull();

      const first = await requestPasswordReset(db, " UYE@ornek.com ", start);
      expect(first).toMatchObject({ email: "uye@ornek.com", expiresAt: minutes(60) });
      const stored = await tokens(client);
      expect(stored).toHaveLength(1);
      expect(stored[0].token_hash).not.toBe(first!.token);

      expect(await requestPasswordReset(db, "uye@ornek.com", minutes(14))).toBeNull();
      const second = await requestPasswordReset(db, "uye@ornek.com", minutes(15));
      expect(second).not.toBeNull();
      expect(await tokens(client)).toHaveLength(1);
      expect(await resetPassword(db, { token: first!.token, password: "yeni-sifre-1" }, minutes(16))).toMatchObject({
        ok: false,
        error: AUTH_ERRORS.resetLinkInvalid,
      });

      await client.query("UPDATE users SET status = 'suspended' WHERE id = 'u-uye'");
      expect(await requestPasswordReset(db, "uye@ornek.com", minutes(40))).toBeNull();
    });
  });

  it("yeni şifre: tek kullanım, 1 saat; bütün oturumlar kapanır, kilit açılır", async () => {
    await withUsers(async (db, client) => {
      const session = await createSession(db, "u-uye", "site", {}, start);
      await client.query("UPDATE users SET failed_login_count = 4, login_locked_until = $1 WHERE id = 'u-uye'", [minutes(30)]);
      const link = (await requestPasswordReset(db, "uye@ornek.com", start))!;

      expect(await resetPassword(db, { token: link.token, password: "kisa" }, minutes(5))).toMatchObject({
        error: "Şifre en az 8 karakter olmalıdır.",
      });
      expect(await resetPassword(db, { token: "baska", password: "yeni-sifre-1" }, minutes(5))).toMatchObject({
        error: AUTH_ERRORS.resetLinkInvalid,
      });
      expect(await resetPassword(db, { token: link.token, password: "yeni-sifre-1" }, minutes(61))).toMatchObject({
        error: AUTH_ERRORS.resetLinkInvalid,
      });
      expect(await resetPassword(db, { token: link.token, password: "yeni-sifre-1" }, minutes(5))).toEqual({ ok: true });
      expect(await resetPassword(db, { token: link.token, password: "yeni-sifre-2" }, minutes(6))).toMatchObject({
        error: AUTH_ERRORS.resetLinkInvalid,
      });

      expect(await readSession(db, session.token, "site", minutes(5))).toBeNull();
      const [user] = (await client.query("SELECT failed_login_count, login_locked_until FROM users WHERE id = 'u-uye'")).rows;
      expect(user).toEqual({ failed_login_count: 0, login_locked_until: null });
      const ok = await login(db, { email: "uye@ornek.com", password: "yeni-sifre-1" }, "site", {}, minutes(7));
      expect(ok.ok).toBe(true);
    });
  });
});
