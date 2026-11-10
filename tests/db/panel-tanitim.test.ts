import { afterAll, describe, expect, it } from "vitest";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import type { PoolClient } from "pg";
import { defaultSettings, type HomeHeroSettings } from "@zenweld/data";
import { tr } from "@zenweld/i18n";
import { adminSaveHomeHero, readHeroPanel, readSettings, type Actor } from "../../packages/db/src";
import * as schema from "../../packages/db/src/schema";
import { closePool, inTransaction } from "./ortak";

/*
 * PANEL › ANASAYFA TANITIM SUNUCUDA (packages/db/src/admin-settings.ts;
 * KARARLAR K-45, K-99): tek kayit settings('home_hero'); kayit yoksa
 * varsayilan okunur; ekran acildiktan sonra degismis kayit kaydedilmez;
 * yuklenen dosya (data:) kaydedilmez; degisiklik audit_log'a yazilir. Her
 * test kendi isleminde calisir ve geri alinir.
 */

afterAll(closePool);

type Db = NodePgDatabase<typeof schema>;

const admin: Actor = { id: "u-tanitim", name: "Tanıtım Yöneticisi" };
const T1 = new Date("2026-03-11T09:00:00.000Z");
const T2 = new Date("2026-03-11T10:00:00.000Z");
const stale = { ok: false, status: 409, error: tr.panel.staleRecord };
const hero = (): HomeHeroSettings => structuredClone(defaultSettings.homeHero);

/** Tanitim alani kaydi olmayan veritabani. */
async function withoutHero(run: (db: Db, client: PoolClient) => Promise<void>) {
  await inTransaction(async (client) => {
    await client.query("DELETE FROM settings WHERE key = 'home_hero'");
    await run(drizzle(client, { schema }), client);
  });
}

const audit = async (client: PoolClient) =>
  (
    await client.query("SELECT action, entity_type, entity_id, entity_label, changes FROM audit_log WHERE actor_user_id = $1 ORDER BY id", [
      admin.id,
    ])
  ).rows;

describe("Anasayfa tanıtım alanı", () => {
  it("kayıt yoksa varsayılan okunur; ilk kayıt eklenir ve işlem kaydına yazılır; aynısı yazılmaz; eski ekrandan kayıt reddedilir", async () => {
    await withoutHero(async (db, client) => {
      expect((await readSettings(db)).homeHero).toEqual(defaultSettings.homeHero);
      expect((await readHeroPanel(db)).settings?.homeHero.updatedAt).toBeUndefined();

      // Jasic one, Force cikarildi, etiket eklendi, sure 9 sn.
      const next = hero();
      next.slides = [next.slides[2], next.slides[0]];
      next.slides[0].chips = [...next.slides[0].chips, "Lazer Kesim"];
      next.intervalSeconds = 9;
      expect(await adminSaveHomeHero(db, admin, { hero: next }, T1)).toEqual({ ok: true, updatedAt: T1.toISOString() });

      const [row] = (await client.query("SELECT value FROM settings WHERE key = 'home_hero'")).rows;
      expect(row.value).toEqual(next);
      expect((await readSettings(db)).homeHero).toEqual(next);
      expect((await readHeroPanel(db)).settings?.homeHero).toMatchObject({ intervalSeconds: 9, updatedAt: T1.toISOString() });

      // Ayni deger: yazilmaz (jsonb alan sirasi farkli olsa da).
      expect(await adminSaveHomeHero(db, admin, { hero: next, updatedAt: T1.toISOString() }, T2)).toEqual({
        ok: true,
        updatedAt: T1.toISOString(),
      });
      // Ekran kayit yokken acilmisti: bu arada kaydedildigi icin reddedilir.
      expect(await adminSaveHomeHero(db, admin, { hero: hero() }, T2)).toEqual(stale);

      const log = await audit(client);
      expect(log).toHaveLength(1);
      expect(log[0]).toMatchObject({ action: "create", entity_type: "settings", entity_id: "home_hero", entity_label: "Anasayfa Tanıtım" });
      expect(log[0].changes.intervalSeconds).toEqual([7, 9]);
      expect(log[0].changes.slides[1].map((s: { id: string }) => s.id)).toEqual(["jasic-lazer", "zenweld"]);
    });
  });

  it("kurala uymayan, yüklenen dosya (data:) içeren ve bozuk kayıt reddedilir", async () => {
    await withoutHero(async (db, client) => {
      const untitled = hero();
      untitled.slides[1].title = "";
      expect(await adminSaveHomeHero(db, admin, { hero: untitled }, T1)).toEqual({
        ok: false,
        status: 400,
        error: "2. sayfa (Force Serisi): başlık yazılmalı.",
      });
      const uploaded = hero();
      uploaded.slides[0].image = "data:image/webp;base64,AAAA";
      expect(await adminSaveHomeHero(db, admin, { hero: uploaded }, T1)).toEqual({ ok: false, status: 400, error: tr.panel.uploadDisabled });
      expect(await adminSaveHomeHero(db, admin, { hero: { ...hero(), intervalSeconds: 30 } }, T1)).toMatchObject({ ok: false, status: 400 });
      expect(await adminSaveHomeHero(db, admin, { hero: "tanıtım" }, T1)).toMatchObject({ ok: false, status: 400 });
      expect((await client.query("SELECT 1 FROM settings WHERE key = 'home_hero'")).rowCount).toBe(0);
      expect(await audit(client)).toEqual([]);
    });
  });
});
