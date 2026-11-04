import { afterAll, describe, expect, it } from "vitest";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import type { PoolClient } from "pg";
import { demoHash } from "../../packages/auth/src/hash";
import {
  checkPassword,
  createSession,
  deleteSession,
  deleteUserSessions,
  hashPassword,
  readSession,
} from "../../packages/auth/src/server";
import * as schema from "../../packages/db/src/schema";
import { closePool, inTransaction, user } from "./ortak";

/*
 * Sifre ozeti ve oturumlar (packages/auth/src/server; KARARLAR K-94,
 * docs/VERITABANI.md › 14 › Sifre ve oturum). Her test kendi isleminde
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
