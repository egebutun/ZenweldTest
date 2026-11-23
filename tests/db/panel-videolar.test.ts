import { afterAll, describe, expect, it } from "vitest";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import type { PoolClient } from "pg";
import { defaultSettings, VIDEO_BAD_LINK, VIDEO_NO_FILE, VIDEO_NO_ORIGINAL, VIDEO_TWICE } from "@zenweld/data";
import { tr } from "@zenweld/i18n";
import {
  adminDeleteVideo,
  adminMoveVideo,
  adminRetryVideo,
  adminSaveHomeVideos,
  adminSaveVideo,
  readContent,
  readContentPanel,
  readSettings,
  readVideosPanel,
  finishVideoJob,
  nextVideoJob,
  type Actor,
} from "../../packages/db/src";
import * as schema from "../../packages/db/src/schema";
import { category, closePool, group, inTransaction, product } from "./ortak";

/*
 * PANEL › VIDEOLAR SUNUCUDA (packages/db/src/admin-content.ts,
 * admin-settings.ts; KARARLAR K-125, K-99): videolar videos tablosunda,
 * position sirasiyla; ayni YouTube videosu iki kez eklenmez; yuklenen kapak
 * (data:) ve katalogda olmayan urun kaydedilmez; ekran acildiktan sonra
 * degismis kayit kaydedilmez; silinen urunun videosu urunsuz kalir.
 * Anasayfa bolumunun basligi settings('home_videos'). Her test kendi
 * isleminde calisir ve geri alinir.
 */

afterAll(closePool);

type Db = NodePgDatabase<typeof schema>;

const admin: Actor = { id: "u-videolar", name: "Video Yöneticisi" };
const T1 = new Date("2026-03-11T09:00:00.000Z");
const T2 = new Date("2026-03-11T10:00:00.000Z");
const stale = { ok: false, status: 409, error: tr.panel.staleRecord };
const form = (patch: Record<string, unknown> = {}) => ({
  source: "youtube",
  youtubeId: "https://youtu.be/abcdefghijk",
  title: "",
  productId: "",
  cover: "",
  showOnHome: true,
  active: true,
  ...patch,
});

/** Bos video tablosu ve bolum basligi olmayan veritabani. */
async function clean(run: (db: Db, client: PoolClient) => Promise<void>) {
  await inTransaction(async (client) => {
    await client.query("DELETE FROM videos");
    await client.query("DELETE FROM settings WHERE key = 'home_videos'");
    await run(drizzle(client, { schema }), client);
  });
}

const audit = async (client: PoolClient) =>
  (await client.query("SELECT action, entity_type, entity_id, entity_label, changes FROM audit_log WHERE actor_user_id = $1 ORDER BY id", [admin.id]))
    .rows;

describe("Video kütüphanesi", () => {
  it("eklenir, sırayla okunur, güncellenir, taşınır ve silinir; işlem kaydına yazılır", async () => {
    await clean(async (db, client) => {
      await group(client);
      await category(client);
      await product(client, "p-video", "ZW-VIDEO-1");

      const first = await adminSaveVideo(db, admin, form({ title: " Sahada ", productId: "p-video" }), T1);
      expect(first).toMatchObject({ ok: true, updatedAt: T1.toISOString() });
      const second = await adminSaveVideo(db, admin, form({ youtubeId: "QtZ7JdNzFVo", showOnHome: false }), T1);
      const [a, b] = [(first as { id: string }).id, (second as { id: string }).id];

      const content = await readContent(db);
      expect(content.videos).toEqual([
        { id: a, source: "youtube", youtubeId: "abcdefghijk", title: "Sahada", productId: "p-video", showOnHome: true, active: true, createdAt: T1.toISOString() },
        { id: b, source: "youtube", youtubeId: "QtZ7JdNzFVo", showOnHome: false, active: true, createdAt: T1.toISOString() },
      ]);

      // Guncelleme: son degisiklik ani tutmali; ayni deger yazilmaz.
      const stamped = (await readContentPanel(db)).videos!;
      expect(stamped[0].updatedAt).toBe(T1.toISOString());
      expect(await adminSaveVideo(db, admin, { ...form({ title: "Sahada", productId: "p-video" }), id: a, updatedAt: T1.toISOString() }, T2)).toMatchObject({
        ok: true,
        updatedAt: T1.toISOString(),
      });
      expect(await adminSaveVideo(db, admin, { ...form({ active: false }), id: a, updatedAt: "2026-01-01T00:00:00.000Z" }, T2)).toEqual(stale);
      expect(await adminSaveVideo(db, admin, { ...form({ active: false, productId: "p-video" }), id: a, updatedAt: T1.toISOString() }, T2)).toMatchObject({
        ok: true,
        updatedAt: T2.toISOString(),
      });

      expect(await adminMoveVideo(db, admin, { id: b, direction: -1 }, T2)).toEqual({ ok: true });
      expect((await readContent(db)).videos.map((v) => v.id)).toEqual([b, a]);

      // Urun silinince video urunsuz kalir.
      await client.query("DELETE FROM products WHERE id = 'p-video'");
      expect((await readContent(db)).videos.find((v) => v.id === a)?.productId).toBeUndefined();

      expect(await adminDeleteVideo(db, admin, { id: b, updatedAt: T1.toISOString() }, T2)).toEqual({ ok: true });
      expect((await readContent(db)).videos.map((v) => v.id)).toEqual([a]);

      const log = await audit(client);
      expect(log.map((l) => [l.action, l.entity_type, l.entity_label])).toEqual([
        ["create", "videos", "Sahada"],
        ["create", "videos", "QtZ7JdNzFVo"],
        ["update", "videos", "abcdefghijk"],
        // Sira: yalnizca yeri degisen video yazilir.
        ["update", "videos", "abcdefghijk"],
        ["delete", "videos", "QtZ7JdNzFVo"],
      ]);
    });
  });

  it("bozuk link, aynı video, yüklenen kapak (data:), olmayan ürün ve bozuk istek reddedilir", async () => {
    await clean(async (db, client) => {
      expect(await adminSaveVideo(db, admin, form({ youtubeId: "https://vimeo.com/1" }), T1)).toEqual({ ok: false, status: 400, error: VIDEO_BAD_LINK });
      expect(await adminSaveVideo(db, admin, form(), T1)).toMatchObject({ ok: true });
      expect(await adminSaveVideo(db, admin, form({ youtubeId: "abcdefghijk" }), T1)).toEqual({ ok: false, status: 400, error: VIDEO_TWICE });
      expect(await adminSaveVideo(db, admin, form({ youtubeId: "QtZ7JdNzFVo", cover: "data:image/webp;base64,AAAA" }), T1)).toEqual({
        ok: false,
        status: 400,
        error: tr.panel.uploadDisabled,
      });
      expect(await adminSaveVideo(db, admin, form({ youtubeId: "QtZ7JdNzFVo", productId: "olmayan-urun" }), T1)).toEqual({
        ok: false,
        status: 400,
        error: tr.panel.invalidRequest,
      });
      expect(await adminSaveVideo(db, admin, form({ youtubeId: "QtZ7JdNzFVo", source: "file" }), T1)).toMatchObject({ ok: false, status: 400 });
      expect((await client.query("SELECT count(*)::int AS n FROM videos")).rows[0].n).toBe(1);
    });
  });
});

describe("Kendi videolarımız: hazırlanma sırası", () => {
  const original = "video/2026/03/0123456789abcdef/orijinal.mov";
  const second = "video/2026/03/fedcba9876543210/orijinal.mp4";
  const done = {
    ok: true as const,
    hd: "/dosya/video/2026/03/0123456789abcdef/1080.mp4",
    sd: "/dosya/video/2026/03/0123456789abcdef/720.mp4",
    poster: "/dosya/video/2026/03/0123456789abcdef/kapak.webp",
    durationSeconds: 42,
    width: 1080,
    height: 1920,
  };

  it("yeni video dosyasıyla siraya girer; hazırlanınca hazır ve orijinal kalkar; sitede dosyaları okunur", async () => {
    await clean(async (db) => {
      expect(await adminSaveVideo(db, admin, form({ source: "file", youtubeId: undefined }), T1)).toEqual({ ok: false, status: 400, error: VIDEO_NO_FILE });
      const saved = (await adminSaveVideo(db, admin, form({ source: "file", upload: original, title: "Sahada" }), T1)) as { id: string };
      expect((await readContent(db)).videos[0]).toMatchObject({ source: "file", title: "Sahada", file: { status: "processing" } });
      const job = await nextVideoJob(db);
      expect(job).toEqual({ id: saved.id, original });

      expect(await finishVideoJob(db, job!, done, T2)).toBe(true);
      expect(await nextVideoJob(db)).toBeNull();
      expect((await readContent(db)).videos[0].file).toEqual({
        status: "ready",
        hd: done.hd,
        sd: done.sd,
        poster: done.poster,
        durationSeconds: 42,
        width: 1080,
        height: 1920,
      });
      // Hazir videoda orijinal yok: yeniden hazirlanamaz.
      expect(await adminRetryVideo(db, admin, { id: saved.id, updatedAt: T2.toISOString() }, T2)).toMatchObject({ ok: false, status: 400 });
    });
  });

  it("hazırlanamayan video yeniden sıraya girer; bu arada yeni dosya yüklendiyse eski sonuç yazılmaz", async () => {
    await clean(async (db) => {
      const saved = (await adminSaveVideo(db, admin, form({ source: "file", upload: original }), T1)) as { id: string };
      const job = (await nextVideoJob(db))!;
      expect(await finishVideoJob(db, job, { ok: false }, T1)).toBe(true);
      expect((await readContent(db)).videos[0].file?.status).toBe("failed");
      expect(await adminRetryVideo(db, admin, { id: saved.id, updatedAt: T1.toISOString() }, T2)).toEqual({ ok: true, updatedAt: T2.toISOString() });
      expect(await nextVideoJob(db)).toEqual(job);

      // Hazirlanirken yeni dosya yuklendi: eski isin sonucu yazilmaz, yenisi siradadir.
      expect(await adminSaveVideo(db, admin, { ...form({ source: "file", upload: second }), id: saved.id, updatedAt: T2.toISOString() }, T2)).toMatchObject({ ok: true });
      expect(await finishVideoJob(db, job, done, T2)).toBe(false);
      expect(await nextVideoJob(db)).toEqual({ id: saved.id, original: second });
    });
  });

  it("orijinali olmayan video yeniden hazırlanamaz; YouTube videosu kendi videomuza çevrilemez", async () => {
    await clean(async (db, client) => {
      const saved = (await adminSaveVideo(db, admin, form({ source: "file", upload: original }), T1)) as { id: string };
      await client.query("UPDATE videos SET file_status = 'failed', file_original = NULL WHERE id = $1", [saved.id]);
      expect(await adminRetryVideo(db, admin, { id: saved.id, updatedAt: T1.toISOString() }, T2)).toEqual({ ok: false, status: 400, error: VIDEO_NO_ORIGINAL });
      const yt = (await adminSaveVideo(db, admin, form(), T1)) as { id: string };
      expect(await adminSaveVideo(db, admin, { ...form({ source: "file", upload: second }), id: yt.id, updatedAt: T1.toISOString() }, T2)).toMatchObject({
        ok: false,
        status: 400,
      });
    });
  });
});

describe("Anasayfa video bölümünün başlığı", () => {
  it("kayıt yoksa varsayılan okunur; kaydedilir ve işlem kaydına yazılır; eski ekrandan kayıt reddedilir", async () => {
    await clean(async (db, client) => {
      expect((await readSettings(db)).homeVideos).toEqual(defaultSettings.homeVideos);
      expect((await readVideosPanel(db)).settings?.homeVideos.updatedAt).toBeUndefined();
      expect(await adminSaveHomeVideos(db, admin, { settings: { title: " Sahada Zenweld " } }, T1)).toEqual({ ok: true, updatedAt: T1.toISOString() });
      expect((await readSettings(db)).homeVideos).toEqual({ title: "Sahada Zenweld" });
      expect(await adminSaveHomeVideos(db, admin, { settings: { title: "Başka" } }, T2)).toEqual(stale);
      expect(await adminSaveHomeVideos(db, admin, { settings: { title: " " }, updatedAt: T1.toISOString() }, T2)).toMatchObject({ ok: false, status: 400 });
      const log = await audit(client);
      expect(log).toHaveLength(1);
      expect(log[0]).toMatchObject({ action: "create", entity_id: "home_videos", entity_label: "Anasayfa video bölümü" });
    });
  });
});
