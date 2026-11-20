import { afterAll, describe, expect, it } from "vitest";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import type { PoolClient } from "pg";
import { defaultSettings, VIDEO_BAD_LINK, type HomeVideoSettings } from "@zenweld/data";
import { tr } from "@zenweld/i18n";
import { adminSaveHomeVideos, readSettings, readVideosPanel, type Actor } from "../../packages/db/src";
import * as schema from "../../packages/db/src/schema";
import { category, closePool, group, inTransaction, product } from "./ortak";

/*
 * PANEL › ANASAYFA VIDEOLARI SUNUCUDA (packages/db/src/admin-settings.ts;
 * KARARLAR K-125, K-99): tek kayit settings('home_videos'); kayit yoksa
 * varsayilan okunur; ekran acildiktan sonra degismis kayit kaydedilmez;
 * yuklenen kapak (data:) ve katalogda olmayan urun kaydedilmez; degisiklik
 * audit_log'a yazilir. Her test kendi isleminde calisir ve geri alinir.
 */

afterAll(closePool);

type Db = NodePgDatabase<typeof schema>;

const admin: Actor = { id: "u-videolar", name: "Video Yöneticisi" };
const T1 = new Date("2026-03-11T09:00:00.000Z");
const T2 = new Date("2026-03-11T10:00:00.000Z");
const stale = { ok: false, status: 409, error: tr.panel.staleRecord };
const videos = (): HomeVideoSettings => structuredClone(defaultSettings.homeVideos);

/** Video kaydi olmayan veritabani. */
async function withoutVideos(run: (db: Db, client: PoolClient) => Promise<void>) {
  await inTransaction(async (client) => {
    await client.query("DELETE FROM settings WHERE key = 'home_videos'");
    await run(drizzle(client, { schema }), client);
  });
}

const audit = async (client: PoolClient) =>
  (
    await client.query("SELECT action, entity_type, entity_id, entity_label, changes FROM audit_log WHERE actor_user_id = $1 ORDER BY id", [
      admin.id,
    ])
  ).rows;

describe("Anasayfa videoları", () => {
  it("kayıt yoksa varsayılan okunur; ilk kayıt eklenir ve işlem kaydına yazılır; aynısı yazılmaz; eski ekrandan kayıt reddedilir", async () => {
    await withoutVideos(async (db, client) => {
      expect((await readSettings(db)).homeVideos).toEqual(defaultSettings.homeVideos);
      expect((await readVideosPanel(db)).settings?.homeVideos.updatedAt).toBeUndefined();

      await group(client);
      await category(client);
      await product(client, "p-video", "ZW-VIDEO-1");
      const next = videos();
      next.title = "Sahada Zenweld";
      next.videos = [{ ...next.videos[1], productId: "p-video" }, next.videos[0]];
      expect(await adminSaveHomeVideos(db, admin, { videos: next }, T1)).toEqual({ ok: true, updatedAt: T1.toISOString() });

      const [row] = (await client.query("SELECT value FROM settings WHERE key = 'home_videos'")).rows;
      expect(row.value).toEqual(next);
      expect((await readSettings(db)).homeVideos).toEqual(next);
      expect((await readVideosPanel(db)).settings?.homeVideos).toMatchObject({ title: "Sahada Zenweld", updatedAt: T1.toISOString() });

      // Ayni deger: yazilmaz (jsonb alan sirasi farkli olsa da).
      expect(await adminSaveHomeVideos(db, admin, { videos: next, updatedAt: T1.toISOString() }, T2)).toEqual({
        ok: true,
        updatedAt: T1.toISOString(),
      });
      // Ekran kayit yokken acilmisti: bu arada kaydedildigi icin reddedilir.
      expect(await adminSaveHomeVideos(db, admin, { videos: videos() }, T2)).toEqual(stale);

      const log = await audit(client);
      expect(log).toHaveLength(1);
      expect(log[0]).toMatchObject({ action: "create", entity_type: "settings", entity_id: "home_videos", entity_label: "Anasayfa Videoları" });
      expect(log[0].changes.title).toEqual(["Gerçek İşler, Gerçek Kaynak", "Sahada Zenweld"]);
    });
  });

  it("bozuk link, yüklenen kapak (data:), olmayan ürün ve bozuk istek reddedilir", async () => {
    await withoutVideos(async (db, client) => {
      const badLink = videos();
      badLink.videos[1].youtubeId = "https://vimeo.com/1";
      expect(await adminSaveHomeVideos(db, admin, { videos: badLink }, T1)).toEqual({ ok: false, status: 400, error: `2. video: ${VIDEO_BAD_LINK}` });
      const uploaded = videos();
      uploaded.videos[0].cover = "data:image/webp;base64,AAAA";
      expect(await adminSaveHomeVideos(db, admin, { videos: uploaded }, T1)).toEqual({ ok: false, status: 400, error: tr.panel.uploadDisabled });
      const missing = videos();
      missing.videos[0].productId = "olmayan-urun";
      expect(await adminSaveHomeVideos(db, admin, { videos: missing }, T1)).toEqual({ ok: false, status: 400, error: tr.panel.invalidRequest });
      expect(await adminSaveHomeVideos(db, admin, { videos: "videolar" }, T1)).toMatchObject({ ok: false, status: 400 });
      expect((await client.query("SELECT 1 FROM settings WHERE key = 'home_videos'")).rowCount).toBe(0);
      expect(await audit(client)).toEqual([]);
    });
  });
});
