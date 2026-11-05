import { afterAll, describe, expect, it } from "vitest";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import type { PoolClient } from "pg";
import { TITLE_REQUIRED, defaultSettings } from "@zenweld/data";
import { tr } from "@zenweld/i18n";
import {
  adminDeleteDocument,
  adminMoveDocument,
  adminSaveDocument,
  adminSaveDocumentPage,
  adminSaveLegalPage,
  adminSavePageSeo,
  adminSaveRichText,
  adminSetDocumentActive,
  readAppearancePanel,
  readPagesPanel,
  UPLOADED_FILE_MISSING,
  type Actor,
} from "../../packages/db/src";
import * as schema from "../../packages/db/src/schema";
import { category, closePool, group, inTransaction, product } from "./ortak";

/*
 * PANEL › YASAL METINLER, BELGELER, SAYFA SEO VE GÖRÜNÜM SUNUCUDA, ADIM 5.3
 * (packages/db/src/admin-pages.ts, admin-settings.ts; Asama 5, 5. alan,
 * KARARLAR K-99, K-104): ekran acildiktan sonra degismis kayit kaydedilmez;
 * belgelerde dosya yerine adres kaydedilir; her degisiklik audit_log'a
 * yazilir. Her test kendi isleminde calisir ve geri alinir.
 */

afterAll(closePool);

type Db = NodePgDatabase<typeof schema>;

const admin: Actor = { id: "u-sayfa", name: "Sayfa Yöneticisi" };
const T0 = new Date("2026-03-10T09:00:00.000Z");
const T1 = new Date("2026-03-11T09:00:00.000Z");
const T2 = new Date("2026-03-11T10:00:00.000Z");
const stale = { ok: false, status: 409, error: tr.panel.staleRecord };
const PDF = "https://dosya.ornek/msds/ER70S-6%20Tel.pdf";

/** Ornek: bir yasal metin, MSDS sayfa metni, bir sayfa SEO'su, iki MSDS belgesi, bir parti sertifikasi, bir urun, Görünüm. Anlar T0. */
async function withPages(run: (db: Db, client: PoolClient) => Promise<void>) {
  await inTransaction(async (client) => {
    await client.query("INSERT INTO legal_pages (id, title, body, updated_at) VALUES ('kvkk', 'KVKK', 'Metin', $1)", [T0]);
    await client.query(
      "INSERT INTO document_pages (section, title, subtitle, updated_at) VALUES ('msds', 'MSDS', 'Formlar', $1)",
      [T0],
    );
    await client.query("INSERT INTO page_seo (path, title, description, updated_at) VALUES ('/msds', 'MSDS Başlık', NULL, $1)", [T0]);
    await group(client);
    await category(client);
    await product(client, "p1", "ZW-1");
    await client.query(
      `INSERT INTO documents (id, section, title, product_id, lot_number, file_name, mime_type, size_bytes, file_key, active, position, created_at, updated_at) VALUES
         ('d1', 'msds', 'Birinci', NULL, NULL, 'a.pdf', 'application/pdf', 0, 'https://dosya.ornek/a.pdf', true, 1, $1, $1),
         ('d2', 'msds', 'İkinci', NULL, NULL, 'b.pdf', 'application/pdf', 0, 'https://dosya.ornek/b.pdf', true, 2, $1, $1),
         ('d3', 'parti-sertifikalari', 'Sertifika', NULL, 'L-1', 'c.pdf', 'application/pdf', 0, 'https://dosya.ornek/c.pdf', true, 3, $1, $1)`,
      [T0],
    );
    await client.query("INSERT INTO settings (key, value, updated_at) VALUES ('rich_text', $1, $2)", [
      JSON.stringify({ ...defaultSettings.richText }),
      T0,
    ]);
    await run(drizzle(client, { schema }), client);
  });
}

const audit = async (client: PoolClient) =>
  (await client.query("SELECT action, entity_type, entity_id, changes FROM audit_log WHERE actor_user_id = $1 ORDER BY id", [admin.id])).rows;

describe("okuma", () => {
  it("yasal metinler, belgeler, belge sayfaları ve sayfa SEO'su son değişiklik anlarıyla; Belgeler'e ürünler; Görünüm", async () => {
    await withPages(async (db) => {
      const data = await readPagesPanel(db);
      // Urunler yalnizca Belgeler ekranina (urun secimi) okunur.
      expect(data.products).toBeUndefined();
      expect((await readPagesPanel(db, { products: true })).products?.map((p) => [p.id, p.sku])).toEqual([["p1", "ZW-1"]]);
      expect(data.legalPages).toEqual([{ id: "kvkk", title: "KVKK", body: "Metin", updatedAt: T0.toISOString() }]);
      expect(data.documentPages).toEqual([{ section: "msds", title: "MSDS", subtitle: "Formlar", updatedAt: T0.toISOString() }]);
      expect(data.pageSeo).toEqual({ "/msds": { title: "MSDS Başlık", description: undefined, updatedAt: T0.toISOString() } });
      expect(data.documents?.map((d) => [d.id, d.updatedAt])).toEqual([
        ["d1", T0.toISOString()],
        ["d2", T0.toISOString()],
        ["d3", T0.toISOString()],
      ]);
      const appearance = await readAppearancePanel(db);
      expect(appearance.settings?.richText).toEqual({ ...defaultSettings.richText, updatedAt: T0.toISOString() });
    });
  });
});

describe("yasal metin", () => {
  it("kaydedilir; başlık ve metin zorunlu; ekran eskiyse kaydedilmez; değişmeyen kayıt yazılmaz; olmayan metin 404", async () => {
    await withPages(async (db, client) => {
      const ref = { id: "kvkk", updatedAt: T0.toISOString() };
      expect(await adminSaveLegalPage(db, admin, { ...ref, title: " ", body: "x" }, T1)).toMatchObject({ ok: false, error: TITLE_REQUIRED });
      expect(await adminSaveLegalPage(db, admin, { ...ref, title: "KVKK", body: " " }, T1)).toMatchObject({ ok: false, error: "Metin zorunludur." });
      expect(await adminSaveLegalPage(db, admin, { ...ref, title: "KVKK", body: "Metin" }, T1)).toEqual({ ok: true, updatedAt: T0.toISOString() });

      expect(await adminSaveLegalPage(db, admin, { ...ref, title: "KVKK Aydınlatma", body: "Yeni metin" }, T1)).toEqual({
        ok: true,
        updatedAt: T1.toISOString(),
      });
      const [row] = (await client.query("SELECT title, body, updated_at FROM legal_pages WHERE id = 'kvkk'")).rows;
      expect(row).toEqual({ title: "KVKK Aydınlatma", body: "Yeni metin", updated_at: T1 });
      // Ilk ekran (T0) artik eski.
      expect(await adminSaveLegalPage(db, admin, { ...ref, title: "Başka", body: "Başka" }, T2)).toEqual(stale);
      expect(await adminSaveLegalPage(db, admin, { id: "yok", updatedAt: T0.toISOString(), title: "A", body: "B" }, T2)).toMatchObject({
        ok: false,
        status: 404,
      });
      expect(await audit(client)).toEqual([
        {
          action: "update",
          entity_type: "legal_pages",
          entity_id: "kvkk",
          changes: { title: ["KVKK", "KVKK Aydınlatma"], body: ["Metin", "Yeni metin"] },
        },
      ]);
    });
  });
});

describe("sayfa SEO", () => {
  const allowed = (path: string) => path === "/msds" || path === "/sss";

  it("yeni sayfaya eklenir, değiştirilir; iki alan boşsa silinir (varsayılana döner); listede olmayan sayfa kaydedilmez", async () => {
    await withPages(async (db, client) => {
      expect(await adminSavePageSeo(db, admin, { path: "/giris", title: "X", description: "", updatedAt: "" }, T1, allowed)).toMatchObject({
        ok: false,
        status: 400,
      });
      // Satiri olmayan sayfa: ekranin gordugu an bos.
      expect(await adminSavePageSeo(db, admin, { path: "/sss", title: " SSS ", description: "", updatedAt: "" }, T1, allowed)).toEqual({
        ok: true,
        updatedAt: T1.toISOString(),
      });
      expect(await adminSavePageSeo(db, admin, { path: "/msds", title: "MSDS Başlık", description: "Açıklama", updatedAt: T0.toISOString() }, T1, allowed)).toEqual({
        ok: true,
        updatedAt: T1.toISOString(),
      });
      expect((await client.query("SELECT path, title, description FROM page_seo ORDER BY path")).rows).toEqual([
        { path: "/msds", title: "MSDS Başlık", description: "Açıklama" },
        { path: "/sss", title: "SSS", description: null },
      ]);

      // Varsayilana don: satir silinir; cevapta an yok.
      expect(await adminSavePageSeo(db, admin, { path: "/sss", title: "", description: " ", updatedAt: T1.toISOString() }, T2, allowed)).toEqual({ ok: true });
      expect((await client.query("SELECT path FROM page_seo")).rows).toEqual([{ path: "/msds" }]);
      // Silinmis satiri eski ekran yeniden kaydedemez; satir yokken bos anla kaydedilir.
      expect(await adminSavePageSeo(db, admin, { path: "/sss", title: "Yeni", description: "", updatedAt: T1.toISOString() }, T2, allowed)).toEqual(stale);
      // Degismeyen kayit yazilmaz; satir yokken bos kayit da yazilmaz.
      expect(await adminSavePageSeo(db, admin, { path: "/msds", title: "MSDS Başlık", description: "Açıklama", updatedAt: T1.toISOString() }, T2, allowed)).toEqual({
        ok: true,
        updatedAt: T1.toISOString(),
      });
      expect(await adminSavePageSeo(db, admin, { path: "/sss", title: "", description: "", updatedAt: "" }, T2, allowed)).toEqual({ ok: true });

      expect((await audit(client)).map((a) => [a.action, a.entity_id, a.changes])).toEqual([
        ["create", "/sss", { title: [null, "SSS"] }],
        ["update", "/msds", { description: [null, "Açıklama"] }],
        ["delete", "/sss", { title: ["SSS", null] }],
      ]);
    });
  });
});

describe("belge sayfası", () => {
  it("başlık ve açıklama kaydedilir (satırı olmayan bölüme eklenir); başlık zorunlu; ekran eskiyse kaydedilmez", async () => {
    await withPages(async (db, client) => {
      const msds = { section: "msds", updatedAt: T0.toISOString() };
      expect(await adminSaveDocumentPage(db, admin, { ...msds, title: " ", subtitle: "" }, T1)).toMatchObject({ ok: false, error: TITLE_REQUIRED });
      expect(await adminSaveDocumentPage(db, admin, { ...msds, section: "yok", title: "A", subtitle: "" }, T1)).toMatchObject({ ok: false, status: 400 });
      expect(await adminSaveDocumentPage(db, admin, { ...msds, title: "MSDS Formları", subtitle: "Formlar" }, T1)).toEqual({
        ok: true,
        updatedAt: T1.toISOString(),
      });
      expect(await adminSaveDocumentPage(db, admin, { ...msds, title: "Başka", subtitle: "" }, T2)).toEqual(stale);
      expect(await adminSaveDocumentPage(db, admin, { section: "kaynak-rehberi", title: "Rehber", subtitle: "Açıklama", updatedAt: "" }, T2)).toEqual({
        ok: true,
        updatedAt: T2.toISOString(),
      });
      expect((await client.query("SELECT section, title, subtitle FROM document_pages ORDER BY section")).rows).toEqual([
        { section: "kaynak-rehberi", title: "Rehber", subtitle: "Açıklama" },
        { section: "msds", title: "MSDS Formları", subtitle: "Formlar" },
      ]);
      expect((await audit(client)).map((a) => [a.action, a.entity_id])).toEqual([
        ["update", "msds"],
        ["create", "kaynak-rehberi"],
      ]);
    });
  });
});

describe("belgeler", () => {
  it("adresle eklenir (bölümün sonuna; dosya adı ve türü adresten, boyut 0); adres ve başlık zorunlu; parti no yalnızca parti sertifikalarında", async () => {
    await withPages(async (db, client) => {
      const base = { section: "msds", title: "ER70S-6", productId: "p1", lotNumber: "L-9", active: true };
      expect(await adminSaveDocument(db, admin, { ...base, address: "" }, T1)).toMatchObject({ ok: false, error: "Dosyanın adresini girin." });
      expect(await adminSaveDocument(db, admin, { ...base, address: "dosya.pdf" }, T1)).toMatchObject({ ok: false, status: 400 });
      expect(await adminSaveDocument(db, admin, { ...base, address: "data:application/pdf;base64,AAAA" }, T1)).toMatchObject({ ok: false, status: 400 });
      expect(await adminSaveDocument(db, admin, { ...base, title: " ", address: PDF }, T1)).toMatchObject({ ok: false, error: TITLE_REQUIRED });
      expect(await adminSaveDocument(db, admin, { ...base, productId: "yok", address: PDF }, T1)).toMatchObject({ ok: false, status: 400 });

      const added = await adminSaveDocument(db, admin, { ...base, address: PDF }, T1);
      expect(added).toMatchObject({ ok: true, updatedAt: T1.toISOString() });
      const id = (added as { id: string }).id;
      const [row] = (await client.query("SELECT * FROM documents WHERE id = $1", [id])).rows;
      expect(row).toMatchObject({
        section: "msds",
        title: "ER70S-6",
        product_id: "p1",
        lot_number: null,
        file_name: "ER70S-6 Tel.pdf",
        mime_type: "application/pdf",
        size_bytes: "0", // bigint ham sorguda metin doner
        file_key: PDF,
        active: true,
        position: 4,
      });

      const lot = await adminSaveDocument(db, admin, { ...base, section: "parti-sertifikalari", productId: "", address: "https://dosya.ornek/indir?id=5" }, T1);
      const [cert] = (await client.query("SELECT lot_number, product_id, file_name, mime_type FROM documents WHERE id = $1", [(lot as { id: string }).id])).rows;
      expect(cert).toEqual({ lot_number: "L-9", product_id: null, file_name: "indir", mime_type: "application/octet-stream" });

      const site = await readPagesPanel(db);
      expect(site.documents?.find((d) => d.id === id)).toMatchObject({ fileKey: PDF, size: 0, productId: "p1" });
      expect((await audit(client)).map((a) => [a.action, a.entity_type])).toEqual([
        ["create", "documents"],
        ["create", "documents"],
      ]);
    });
  });

  it("depoya yüklenen dosyanın adresiyle eklenir: boyut depodan okunur; dosya depoda yoksa ya da depo ayarlı değilse kaydedilmez (K-108)", async () => {
    await withPages(async (db, client) => {
      const base = { section: "msds", title: "ER70S-6", productId: "", lotNumber: "", active: true };
      const key = "belge/2026/11/0123456789abcdef/ER70S-6.pdf";
      const address = `/dosya/${key}`;
      const asked: string[] = [];
      const stored = async (k: string) => (asked.push(k), k === key ? 2048 : null);

      expect(await adminSaveDocument(db, admin, { ...base, address }, T1)).toEqual({ ok: false, status: 400, error: tr.panel.documentUploadDisabled });
      expect(await adminSaveDocument(db, admin, { ...base, address: "/dosya/belge/2026/11/fedcba9876543210/yok.pdf" }, T1, stored)).toEqual({
        ok: false,
        status: 400,
        error: UPLOADED_FILE_MISSING,
      });
      const added = await adminSaveDocument(db, admin, { ...base, address }, T1, stored);
      expect(added).toMatchObject({ ok: true });
      expect(asked).toEqual(["belge/2026/11/fedcba9876543210/yok.pdf", key]);
      const [row] = (await client.query("SELECT file_key, file_name, mime_type, size_bytes FROM documents WHERE id = $1", [(added as { id: string }).id])).rows;
      expect(row).toEqual({ file_key: address, file_name: "ER70S-6.pdf", mime_type: "application/pdf", size_bytes: "2048" });

      // Elle girilen adreste depoya bakilmaz; boyut 0.
      const manual = await adminSaveDocument(db, admin, { ...base, address: PDF }, T1, stored);
      const [other] = (await client.query("SELECT size_bytes FROM documents WHERE id = $1", [(manual as { id: string }).id])).rows;
      expect([other.size_bytes, asked.length]).toEqual(["0", 2]);
    });
  });

  it("düzenlenir (adres boşsa eski dosya kalır, bölüm değişmez); ekran eskiyse kaydedilmez; değişmeyen kayıt yazılmaz", async () => {
    await withPages(async (db, client) => {
      const ref = { id: "d1", updatedAt: T0.toISOString() };
      const same = { section: "msds", title: "Birinci", productId: "", lotNumber: "", active: true, address: "" };
      expect(await adminSaveDocument(db, admin, { ...ref, ...same }, T1)).toEqual({ ok: true, updatedAt: T0.toISOString(), id: "d1" });
      expect(await adminSaveDocument(db, admin, { ...ref, ...same, address: "yanlis" }, T1)).toMatchObject({ ok: false, status: 400 });

      expect(await adminSaveDocument(db, admin, { ...ref, ...same, section: "kaynak-rehberi", title: "Birinci Form", productId: "p1" }, T1)).toEqual({
        ok: true,
        updatedAt: T1.toISOString(),
        id: "d1",
      });
      expect((await client.query("SELECT section, title, product_id, file_key FROM documents WHERE id = 'd1'")).rows[0]).toEqual({
        section: "msds",
        title: "Birinci Form",
        product_id: "p1",
        file_key: "https://dosya.ornek/a.pdf",
      });
      expect(await adminSaveDocument(db, admin, { ...ref, ...same, title: "Başka" }, T2)).toEqual(stale);

      expect(await adminSaveDocument(db, admin, { id: "d1", updatedAt: T1.toISOString(), ...same, title: "Birinci Form", productId: "p1", address: "https://dosya.ornek/yeni.docx" }, T2)).toMatchObject({ ok: true });
      expect((await client.query("SELECT file_key, file_name, mime_type FROM documents WHERE id = 'd1'")).rows[0]).toEqual({
        file_key: "https://dosya.ornek/yeni.docx",
        file_name: "yeni.docx",
        mime_type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });
      expect((await audit(client)).map((a) => a.changes)).toEqual([
        { title: ["Birinci", "Birinci Form"], productId: [null, "p1"] },
        {
          fileKey: ["https://dosya.ornek/a.pdf", "https://dosya.ornek/yeni.docx"],
          fileName: ["a.pdf", "yeni.docx"],
          mimeType: ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
        },
      ]);
    });
  });

  it("yayından kaldırılır; silinir; ekran eskiyse ikisi de yapılmaz", async () => {
    await withPages(async (db, client) => {
      expect(await adminSetDocumentActive(db, admin, { id: "d2", active: false, updatedAt: T0.toISOString() }, T1)).toEqual({
        ok: true,
        updatedAt: T1.toISOString(),
      });
      expect(await adminSetDocumentActive(db, admin, { id: "d2", active: true, updatedAt: T0.toISOString() }, T2)).toEqual(stale);
      expect(await adminDeleteDocument(db, admin, { id: "d2", updatedAt: T0.toISOString() }, T2)).toEqual(stale);
      expect(await adminDeleteDocument(db, admin, { id: "d2", updatedAt: T1.toISOString() }, T2)).toEqual({ ok: true });
      expect((await client.query("SELECT id FROM documents ORDER BY id")).rows.map((r) => r.id)).toEqual(["d1", "d3"]);
      expect((await audit(client)).map((a) => [a.action, a.entity_id])).toEqual([
        ["update", "d2"],
        ["delete", "d2"],
      ]);
    });
  });

  it("sıra yalnızca kendi bölümünde değişir; sıra değişikliği kaydı eskitmez", async () => {
    await withPages(async (db, client) => {
      expect(await adminMoveDocument(db, admin, { id: "d2", direction: -1 }, T1)).toEqual({ ok: true });
      const order = async () =>
        (await client.query("SELECT id, section, position, updated_at FROM documents ORDER BY section, position")).rows.map((r) => [r.id, r.position]);
      expect(await order()).toEqual([
        ["d2", 1],
        ["d1", 2],
        ["d3", 3],
      ]);
      // Bolumun basindaki belge yukari, tek belgeli bolumdeki belge yukari da asagi da gitmez.
      expect(await adminMoveDocument(db, admin, { id: "d2", direction: -1 }, T1)).toEqual({ ok: true });
      expect(await adminMoveDocument(db, admin, { id: "d3", direction: -1 }, T1)).toEqual({ ok: true });
      expect(await adminMoveDocument(db, admin, { id: "d3", direction: 1 }, T1)).toEqual({ ok: true });
      expect(await adminMoveDocument(db, admin, { id: "d1", direction: 2 }, T1)).toMatchObject({ ok: false, status: 400 });
      expect(await order()).toEqual([
        ["d2", 1],
        ["d1", 2],
        ["d3", 3],
      ]);
      expect(await adminSetDocumentActive(db, admin, { id: "d1", active: false, updatedAt: T0.toISOString() }, T2)).toMatchObject({ ok: true });
      expect((await audit(client)).map((a) => [a.entity_id, a.changes])).toEqual([
        ["d2", { position: [2, 1] }],
        ["d1", { position: [1, 2] }],
        ["d1", { active: [true, false] }],
      ]);
    });
  });
});

describe("Görünüm", () => {
  it("kaydedilir; renk ve punto denetlenir; ekran eskiyse kaydedilmez; değişmeyen kayıt yazılmaz", async () => {
    await withPages(async (db, client) => {
      const style = { ...defaultSettings.richText };
      const ref = { updatedAt: T0.toISOString() };
      expect(await adminSaveRichText(db, admin, { ...ref, style: { ...style, headingColor: "red" } }, T1)).toMatchObject({
        ok: false,
        error: "Ara başlık rengi #RRGGBB biçiminde olmalı (örnek: #141619).",
      });
      expect(await adminSaveRichText(db, admin, { ...ref, style: { ...style, bodySize: 40 } }, T1)).toMatchObject({ ok: false, status: 400 });
      expect(await adminSaveRichText(db, admin, { ...ref, style: { ...style, headingUppercase: "evet" } }, T1)).toMatchObject({ ok: false, status: 400 });
      expect(await adminSaveRichText(db, admin, { ...ref, style }, T1)).toEqual({ ok: true, updatedAt: T0.toISOString() });

      // Tarayicidan gelen fazla alan yazilmaz.
      expect(await adminSaveRichText(db, admin, { ...ref, style: { ...style, headingSize: 22, extra: "x" } }, T1)).toEqual({
        ok: true,
        updatedAt: T1.toISOString(),
      });
      const [row] = (await client.query("SELECT value FROM settings WHERE key = 'rich_text'")).rows;
      expect(row.value).toEqual({ ...style, headingSize: 22 });
      expect(await adminSaveRichText(db, admin, { ...ref, style }, T2)).toEqual(stale);
      expect(await audit(client)).toEqual([
        { action: "update", entity_type: "settings", entity_id: "rich_text", changes: { headingSize: [style.headingSize, 22] } },
      ]);
    });
  });
});
