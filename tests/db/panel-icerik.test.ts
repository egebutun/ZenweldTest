import { afterAll, describe, expect, it } from "vitest";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import type { PoolClient } from "pg";
import { EMPTY_SLUG_ERROR } from "@zenweld/data";
import { tr } from "@zenweld/i18n";
import {
  adminDeleteFaq,
  adminDeleteNews,
  adminMoveFaq,
  adminSaveAbout,
  adminSaveBlogPost,
  adminSaveEvent,
  adminSaveFaq,
  adminSaveNews,
  adminSetNewsActive,
  readContent,
  readContentPanel,
  type Actor,
} from "../../packages/db/src";
import * as schema from "../../packages/db/src/schema";
import { closePool, inTransaction } from "./ortak";

/*
 * PANEL › ICERIK SUNUCUDA, ADIM 5.2 (packages/db/src/admin-content.ts;
 * Asama 5, 5. alan, KARARLAR K-99, K-101): haber, etkinlik, blog, SSS ve
 * Hakkımızda sunucuda kaydedilir; link degisince eski adres yonlenir,
 * kayit silinince yonlendirmesi de silinir; ekran acildiktan sonra degismis
 * kayit kaydedilmez; yuklenmis gorsel kaydedilmez; her degisiklik
 * audit_log'a yazilir. Her test kendi isleminde calisir ve geri alinir.
 */

afterAll(closePool);

type Db = NodePgDatabase<typeof schema>;

const admin: Actor = { id: "u-icerik", name: "İçerik Yöneticisi" };
const T0 = new Date("2026-03-10T09:00:00.000Z");
const T1 = new Date("2026-03-11T09:00:00.000Z");
const T2 = new Date("2026-03-11T10:00:00.000Z");
const stale = { ok: false, status: 409, error: tr.panel.staleRecord };

/** Ornek: iki haber, bir etkinlik, bir blog yazisi, iki soru, Hakkımızda. Anlar T0. */
async function withContent(run: (db: Db, client: PoolClient) => Promise<void>) {
  await inTransaction(async (client) => {
    await client.query(
      `INSERT INTO news (id, slug, title, summary, body, cover_url, images, published_at, active, updated_at) VALUES
         ('n1', 'fuar-haberi', 'Fuar Haberi', 'Özet', 'Metin', '/images/news/1.webp', '[]', $1, true, $1),
         ('n2', 'diger-haber', 'Diğer Haber', 'Özet', 'Metin', '', '[]', $1, true, $1)`,
      [T0],
    );
    await client.query(
      `INSERT INTO events (id, slug, title, summary, description, start_date, end_date, venue, city, country, logo_url, images, active, updated_at)
       VALUES ('e1', 'kaynak-fuari', 'Kaynak Fuarı', 'Özet', 'Açıklama', '2026-06-16', '2026-06-19', 'Fuar Merkezi', 'İstanbul', 'Türkiye', '/images/events/logo.png', '[]', true, $1)`,
      [T0],
    );
    await client.query(
      `INSERT INTO blog_posts (id, slug, title, excerpt, body, cover_url, category, author, published_at, active, updated_at)
       VALUES ('b1', 'mig-kaynagi', 'MIG Kaynağı', 'Özet', 'Metin', '', 'Rehber', 'Zenweld', $1, true, $1)`,
      [T0],
    );
    await client.query(
      `INSERT INTO faqs (id, question, answer, topic, position, updated_at) VALUES
         ('f1', 'Garanti kaç yıl?', '2 yıl.', 'garanti', 1, $1), ('f2', 'Kargo ücreti?', 'Sepette yazar.', 'siparis', 2, $1)`,
      [T0],
    );
    await client.query(
      `INSERT INTO about_page (id, hero_title, hero_subtitle, stats, sections, updated_at)
       VALUES (1, 'Hakkımızda', 'Alt başlık', '[{"id":"s1","value":"20+","label":"Yıl"}]', '[{"id":"a1","title":"Biz","body":"Metin"}]', $1)`,
      [T0],
    );
    await run(drizzle(client, { schema }), client);
  });
}

const audit = async (client: PoolClient) =>
  (await client.query("SELECT action, entity_type, entity_id, changes FROM audit_log WHERE actor_user_id = $1 ORDER BY id", [admin.id])).rows;

const redirects = async (client: PoolClient) =>
  (await client.query("SELECT old_path, target_type, target_id FROM redirects ORDER BY old_path")).rows;

/** Haber formunun gonderdigi alanlar. */
const news = (over: Record<string, unknown> = {}) => ({
  slug: "",
  title: "Yeni Haber",
  summary: "Özet",
  body: "Metin",
  coverUrl: "",
  images: [],
  publishedAt: T0.toISOString(),
  active: true,
  ...over,
});

describe("okuma", () => {
  it("blog, haber, etkinlik ve SSS son değişiklik anlarıyla; Hakkımızda", async () => {
    await withContent(async (db) => {
      const data = await readContentPanel(db);
      expect(data.news?.map((n) => [n.id, n.updatedAt])).toEqual([
        ["n1", T0.toISOString()],
        ["n2", T0.toISOString()],
      ]);
      expect(data.events?.[0]).toMatchObject({ id: "e1", updatedAt: T0.toISOString() });
      expect(data.blogPosts?.[0]).toMatchObject({ id: "b1", updatedAt: T0.toISOString() });
      expect(data.faqs?.map((f) => f.id)).toEqual(["f1", "f2"]);
      expect(data.about).toMatchObject({ heroTitle: "Hakkımızda", updatedAt: T0.toISOString() });
    });
  });
});

describe("haber", () => {
  it("eklenir (link başlıktan); link başka haberde kullanılıyorsa eklenmez; Latin harfsiz başlıkta link boş kalırsa eklenmez", async () => {
    await withContent(async (db, client) => {
      const created = await adminSaveNews(db, admin, news(), T1);
      expect(created).toMatchObject({ ok: true, updatedAt: T1.toISOString() });
      const id = (created as { id: string }).id;
      expect((await client.query("SELECT slug, title FROM news WHERE id = $1", [id])).rows).toEqual([{ slug: "yeni-haber", title: "Yeni Haber" }]);
      expect(await adminSaveNews(db, admin, news({ slug: "fuar-haberi" }), T1)).toEqual({
        ok: false,
        status: 400,
        error: '"fuar-haberi" adresi "Fuar Haberi" haberinde kullanılıyor.',
      });
      expect(await adminSaveNews(db, admin, news({ title: "Новости" }), T1)).toEqual({ ok: false, status: 400, error: EMPTY_SLUG_ERROR });
      expect(await adminSaveNews(db, admin, news({ title: " " }), T1)).toEqual({ ok: false, status: 400, error: "Haber başlığı zorunludur." });
      expect((await audit(client)).map((r) => [r.action, r.entity_id])).toEqual([["create", id]]);
    });
  });

  it("linki değişince eski adres yeni adrese yönlenir; ekran eskiyse kaydedilmez; değişmeyen kayıt yazılmaz", async () => {
    await withContent(async (db, client) => {
      const edit = news({ id: "n1", slug: "fuar-haberi-2026", title: "Fuar Haberi", updatedAt: T0.toISOString() });
      expect(await adminSaveNews(db, admin, { ...edit, updatedAt: T1.toISOString() }, T1)).toEqual(stale);
      expect(await adminSaveNews(db, admin, edit, T1)).toEqual({ ok: true, updatedAt: T1.toISOString(), id: "n1" });
      expect(await redirects(client)).toEqual([{ old_path: "/haberler/fuar-haberi", target_type: "news", target_id: "n1" }]);
      expect((await readContent(db)).news.find((n) => n.id === "n1")?.previousSlugs).toEqual(["fuar-haberi"]);
      // Ayni icerik: yazilmaz.
      expect(await adminSaveNews(db, admin, { ...edit, updatedAt: T1.toISOString() }, T2)).toEqual({ ok: true, updatedAt: T1.toISOString(), id: "n1" });
      // Eski adres baska habere verilince yonlendirme kalkar.
      expect(await adminSaveNews(db, admin, news({ id: "n2", slug: "fuar-haberi", title: "Diğer Haber", updatedAt: T0.toISOString() }), T2)).toMatchObject({ ok: true });
      expect(await redirects(client)).toEqual([{ old_path: "/haberler/diger-haber", target_type: "news", target_id: "n2" }]);
      const changes = (await audit(client)).map((r) => r.changes);
      expect(changes[0]).toEqual({ slug: ["fuar-haberi", "fuar-haberi-2026"], coverUrl: ["/images/news/1.webp", ""] });
    });
  });

  it("yüklenmiş görsel kaydedilmez (dosya deposu gelene kadar); yayından kaldırılır; silinince yönlendirmesi de silinir", async () => {
    await withContent(async (db, client) => {
      const upload = "data:image/webp;base64,AAAA";
      expect(await adminSaveNews(db, admin, news({ coverUrl: upload }), T1)).toEqual({ ok: false, status: 400, error: tr.panel.uploadDisabled });
      expect(await adminSaveNews(db, admin, news({ images: ["/images/a.jpg", upload] }), T1)).toEqual({ ok: false, status: 400, error: tr.panel.uploadDisabled });

      expect(await adminSetNewsActive(db, admin, { id: "n1", active: false, updatedAt: T1.toISOString() }, T1)).toEqual(stale);
      expect(await adminSetNewsActive(db, admin, { id: "n1", active: false, updatedAt: T0.toISOString() }, T1)).toEqual({ ok: true, updatedAt: T1.toISOString() });
      expect((await client.query("SELECT active FROM news WHERE id = 'n1'")).rows).toEqual([{ active: false }]);

      await adminSaveNews(db, admin, news({ id: "n1", slug: "yeni-link", title: "Fuar Haberi", active: false, coverUrl: "/images/news/1.webp", updatedAt: T1.toISOString() }), T2);
      expect(await adminDeleteNews(db, admin, { id: "n1", updatedAt: T1.toISOString() }, T2)).toEqual(stale);
      expect(await adminDeleteNews(db, admin, { id: "n1", updatedAt: T2.toISOString() }, T2)).toEqual({ ok: true });
      expect((await client.query("SELECT id FROM news WHERE id = 'n1'")).rows).toEqual([]);
      expect(await redirects(client)).toEqual([]);
      expect((await audit(client)).map((r) => r.action)).toEqual(["update", "update", "delete"]);
    });
  });
});

describe("etkinlik ve blog", () => {
  it("etkinlik: bitiş başlangıçtan önce olamaz, tarih biçimi denetlenir; site adresi boşsa yazılmaz", async () => {
    await withContent(async (db, client) => {
      const event = {
        slug: "",
        title: "Yeni Fuar",
        summary: "",
        description: "",
        startDate: "2026-09-10",
        endDate: "2026-09-12",
        venue: "",
        city: "İzmir",
        country: "Türkiye",
        logoUrl: "",
        images: [],
        websiteUrl: " ",
        active: true,
      };
      expect(await adminSaveEvent(db, admin, { ...event, endDate: "2026-09-01" }, T1)).toEqual({
        ok: false,
        status: 400,
        error: "Bitiş tarihi başlangıç tarihinden önce olamaz.",
      });
      expect(await adminSaveEvent(db, admin, { ...event, startDate: "2026-02-30" }, T1)).toMatchObject({ status: 400, error: tr.panel.invalidRequest });
      const created = await adminSaveEvent(db, admin, event, T1);
      expect(created).toMatchObject({ ok: true });
      expect((await client.query("SELECT slug, website_url FROM events WHERE id = $1", [(created as { id: string }).id])).rows).toEqual([
        { slug: "yeni-fuar", website_url: null },
      ]);
    });
  });

  it("blog: yazar boşsa \"Zenweld\"; link değişince eski adres yönlenir", async () => {
    await withContent(async (db, client) => {
      const post = {
        id: "b1",
        slug: "mig-kaynagi-rehberi",
        title: "MIG Kaynağı",
        excerpt: "Özet",
        body: "Metin",
        coverUrl: "",
        category: "Rehber",
        author: " ",
        publishedAt: T0.toISOString(),
        active: true,
        updatedAt: T0.toISOString(),
      };
      expect(await adminSaveBlogPost(db, admin, post, T1)).toMatchObject({ ok: true });
      expect((await client.query("SELECT slug, author FROM blog_posts WHERE id = 'b1'")).rows).toEqual([{ slug: "mig-kaynagi-rehberi", author: "Zenweld" }]);
      expect(await redirects(client)).toEqual([{ old_path: "/blog/mig-kaynagi", target_type: "blog", target_id: "b1" }]);
    });
  });
});

describe("sık sorulan sorular", () => {
  it("eklenir (listenin sonuna); düzeltilir; ekran eskiyse kaydedilmez; konu denetlenir; silinir", async () => {
    await withContent(async (db, client) => {
      const created = await adminSaveFaq(db, admin, { question: " Teslim süresi? ", answer: "3 gün.", topic: "siparis" }, T1);
      expect(created).toMatchObject({ ok: true });
      const id = (created as { id: string }).id;
      expect((await client.query("SELECT question, position FROM faqs WHERE id = $1", [id])).rows).toEqual([{ question: "Teslim süresi?", position: 3 }]);
      expect(await adminSaveFaq(db, admin, { question: "", answer: "x", topic: "genel" }, T1)).toEqual({ ok: false, status: 400, error: "Soru ve cevap zorunludur." });
      expect(await adminSaveFaq(db, admin, { question: "S", answer: "C", topic: "diger" }, T1)).toMatchObject({ status: 400 });

      expect(await adminSaveFaq(db, admin, { id: "f1", question: "Garanti kaç yıl?", answer: "3 yıl.", topic: "garanti", updatedAt: T1.toISOString() }, T2)).toEqual(stale);
      expect(await adminSaveFaq(db, admin, { id: "f1", question: "Garanti kaç yıl?", answer: "3 yıl.", topic: "garanti", updatedAt: T0.toISOString() }, T2)).toEqual({
        ok: true,
        updatedAt: T2.toISOString(),
        id: "f1",
      });
      expect(await adminDeleteFaq(db, admin, { id: "f2", updatedAt: T0.toISOString() }, T2)).toEqual({ ok: true });
      expect((await audit(client)).map((r) => [r.action, r.changes])).toEqual([
        ["create", { question: [null, "Teslim süresi?"], answer: [null, "3 gün."], topic: [null, "siparis"] }],
        ["update", { answer: ["2 yıl.", "3 yıl."] }],
        ["delete", { question: ["Kargo ücreti?", null], topic: ["siparis", null] }],
      ]);
    });
  });

  it("sıra değişir; sıra değişikliği kaydı eskitmez", async () => {
    await withContent(async (db, client) => {
      expect(await adminMoveFaq(db, admin, { id: "f2", direction: -1 }, T1)).toEqual({ ok: true });
      expect((await client.query("SELECT id, position, updated_at FROM faqs ORDER BY position")).rows).toEqual([
        { id: "f2", position: 1, updated_at: T0 },
        { id: "f1", position: 2, updated_at: T0 },
      ]);
      // En usttekini yukari tasimak bir sey degistirmez.
      expect(await adminMoveFaq(db, admin, { id: "f2", direction: -1 }, T1)).toEqual({ ok: true });
      expect(await adminMoveFaq(db, admin, { id: "f2", direction: 2 }, T1)).toMatchObject({ status: 400 });
    });
  });
});

describe("Hakkımızda", () => {
  const about = {
    heroTitle: "Hakkımızda",
    heroSubtitle: "Yeni alt başlık",
    stats: [
      { id: "s1", value: "25+", label: "Yıl" },
      { id: "s2", value: " ", label: "Boş kutu" },
    ],
    sections: [{ id: "a1", title: "Biz", body: "Metin" }],
  };

  it("kaydedilir (değeri boş kutu yazılmaz); ekran eskiyse kaydedilmez; değişmeyen kayıt yazılmaz; yüklenmiş görsel kaydedilmez", async () => {
    await withContent(async (db, client) => {
      expect(await adminSaveAbout(db, admin, { about, updatedAt: T1.toISOString() }, T1)).toEqual(stale);
      expect(await adminSaveAbout(db, admin, { about: { ...about, heroTitle: "" }, updatedAt: T0.toISOString() }, T1)).toEqual({
        ok: false,
        status: 400,
        error: "Sayfa başlığı zorunludur.",
      });
      expect(await adminSaveAbout(db, admin, { about: { ...about, heroImage: "data:image/png;base64,AA" }, updatedAt: T0.toISOString() }, T1)).toEqual({
        ok: false,
        status: 400,
        error: tr.panel.uploadDisabled,
      });
      expect(await adminSaveAbout(db, admin, { about, updatedAt: T0.toISOString() }, T1)).toEqual({ ok: true, updatedAt: T1.toISOString() });
      expect((await client.query("SELECT hero_subtitle, stats FROM about_page")).rows).toEqual([
        { hero_subtitle: "Yeni alt başlık", stats: [{ id: "s1", value: "25+", label: "Yıl" }] },
      ]);
      expect(await adminSaveAbout(db, admin, { about, updatedAt: T1.toISOString() }, T2)).toEqual({ ok: true, updatedAt: T1.toISOString() });
      expect((await audit(client)).map((r) => Object.keys(r.changes).sort())).toEqual([["heroSubtitle", "stats"]]);
    });
  });
});
