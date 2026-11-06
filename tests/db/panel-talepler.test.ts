import { afterAll, describe, expect, it } from "vitest";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import type { PoolClient } from "pg";
import { featuredReviewLimitText } from "@zenweld/data";
import { tr } from "@zenweld/i18n";
import {
  adminDeleteQuote,
  adminDeleteReview,
  adminDeleteWarranty,
  adminSaveDealerApplication,
  adminSaveQuote,
  adminSaveServiceRequest,
  adminSaveSupportMessage,
  adminSaveWarranty,
  adminSetReviewApproved,
  adminSetReviewFeatured,
  adminSetWeldersClubActive,
  readDealerApplications,
  readQuotesForExport,
  readQuotesPage,
  readReviewsPage,
  readServicePage,
  readSupportMessages,
  readWarrantiesForExport,
  readWarrantiesPage,
  readWeldersClub,
  type Actor,
} from "../../packages/db/src";
import * as schema from "../../packages/db/src/schema";
import { category, closePool, group, inTransaction, product, user } from "./ortak";

/*
 * PANEL › TALEPLER SUNUCUDA (packages/db/src/admin-requests.ts; Asama 5,
 * 2. alan, KARARLAR K-99, K-100): teklif, servis talebi, garanti, yorum,
 * bayilik basvurusu, mesaj ve Welders Club islemleri; ekran acildiktan
 * sonra degismis kaydin kaydedilmemesi; audit_log. Her test kendi isleminde
 * calisir ve geri alinir.
 */

afterAll(closePool);

type Db = NodePgDatabase<typeof schema>;

const admin: Actor = { id: "u-yonetici", name: "Yönetici Bir" };
const T0 = new Date("2026-03-10T09:00:00.000Z");
const T1 = new Date("2026-03-11T09:00:00.000Z");
const T2 = new Date("2026-03-11T10:00:00.000Z");
const ref = (id: string, at = T0) => ({ id, updatedAt: at.toISOString() });
const saved = (at: Date) => ({ ok: true, updatedAt: at.toISOString() });
const stale = { ok: false, status: 409, error: tr.panel.staleRecord };

async function withPanel(run: (db: Db, client: PoolClient) => Promise<void>) {
  await inTransaction(async (client) => {
    await user(client, "u-a", "a@ornek.com");
    await run(drizzle(client, { schema }), client);
  });
}

const audit = async (client: PoolClient) =>
  // Yalnizca bu testin yoneticisi: baska testlerin silinemeyen kayitlari sayilmaz.
  (
    await client.query(
      "SELECT action, entity_type, entity_id, entity_label, changes FROM audit_log WHERE actor_user_id = $1 ORDER BY id",
      [admin.id],
    )
  ).rows;

describe("teklifler", () => {
  it("durum, temsilci ve iç not ayrı ayrı kaydedilir; kendi kaydının ardından yeni anla yeniden kaydedilir; silinir", async () => {
    await withPanel(async (db, client) => {
      await client.query(
        `INSERT INTO quotes (id, code, company_name, contact_name, email, phone, city, payment_preference, created_at, updated_at)
         VALUES ('q1', 'TKL-1', 'Firma', 'Yetkili', 'a@ornek.com', '0555', 'Konya', 'havale', $1, $1)`,
        [T0],
      );
      await client.query("INSERT INTO quote_items (quote_id, line, product_name, quantity) VALUES ('q1', 0, 'Makine', 2)");
      expect(await adminSaveQuote(db, admin, { ...ref("q1"), status: "uydurma" }, T1)).toMatchObject({ status: 400 });
      expect(await adminSaveQuote(db, admin, { ...ref("q1"), status: "sent" }, T1)).toEqual(saved(T1));
      // Ekran sayfa yenilenmeden donen yeni anla ikinci alani kaydeder.
      expect(await adminSaveQuote(db, admin, { ...ref("q1", T1), assignedTo: " Mehmet B. " }, T2)).toEqual(saved(T2));
      // Eski anla gelen kayit reddedilir.
      expect(await adminSaveQuote(db, admin, { ...ref("q1", T1), adminNote: "Aranacak" }, T2)).toEqual(stale);

      const [quote] = (await readQuotesPage(db, { page: 1 })).rows;
      expect(quote).toMatchObject({ status: "sent", assignedTo: "Mehmet B.", updatedAt: T2.toISOString() });
      expect(quote.adminNote).toBeUndefined();

      expect(await adminDeleteQuote(db, admin, ref("q1", T2), T2)).toEqual({ ok: true });
      expect((await readQuotesPage(db, { page: 1 })).rows).toEqual([]);
      expect((await client.query("SELECT count(*)::int AS n FROM quote_items")).rows[0].n).toBe(0);
      const rows = await audit(client);
      expect(rows.map((r) => [r.action, r.entity_type, r.entity_label])).toEqual([
        ["update", "quotes", "TKL-1"],
        ["update", "quotes", "TKL-1"],
        ["delete", "quotes", "TKL-1"],
      ]);
      expect(rows[0].changes).toEqual({ status: ["new", "sent"] });
      expect(rows[1].changes).toEqual({ assignedTo: [null, "Mehmet B."] });
      expect(rows[2].changes).toMatchObject({ code: "TKL-1", items: [{ productName: "Makine", quantity: 2 }] });
    });
  });
});

describe("servis talepleri", () => {
  it("durum ve iç not kaydedilir; ekran eskiyse kaydedilmez", async () => {
    await withPanel(async (db, client) => {
      await client.query(
        `INSERT INTO service_requests (id, code, product_name, reasons, complaint, company_name, address, city, district,
                                       email, phone, contact_name, contact_gsm, created_at, updated_at)
         VALUES ('s1', 'SRV-1', 'Makine', '{onarim}', 'Çalışmıyor', 'Firma', 'Adres', 'Konya', 'Selçuklu',
                 'a@ornek.com', '0555', 'Yetkili', '0555', $1, $1)`,
        [T0],
      );
      expect(await adminSaveServiceRequest(db, admin, { ...ref("s1"), status: "in_progress", adminNote: "Teknisyen yolda" }, T1)).toEqual(
        saved(T1),
      );
      expect(await adminSaveServiceRequest(db, admin, { ...ref("s1"), status: "done" }, T2)).toEqual(stale);
      expect(await adminSaveServiceRequest(db, admin, { ...ref("yok"), status: "done" }, T2)).toMatchObject({
        status: 404,
        error: tr.panel.recordNotFound,
      });
      const [row] = (await client.query("SELECT status, admin_note FROM service_requests")).rows;
      expect(row).toEqual({ status: "in_progress", admin_note: "Teknisyen yolda" });
      expect((await audit(client))[0]).toMatchObject({
        entity_type: "service_requests",
        entity_label: "SRV-1",
        changes: { status: ["new", "in_progress"], adminNote: [null, "Teknisyen yolda"] },
      });
    });
  });
});

describe("garantiler", () => {
  it("bitiş tarihi elle değişir; uzatılmış garanti kayıttaki tarihe 12 ay ekler ya da çıkarır; silinir", async () => {
    await withPanel(async (db, client) => {
      await client.query(
        `INSERT INTO warranties (id, serial_number, owner_name, email, phone, city, postal_code, address, seller_tax_number,
                                 registered_at, expires_at, updated_at)
         VALUES ('w1', 'ZW-001', 'Sahip', 'a@ornek.com', '0555', 'Konya', '42000', 'Adres', '1234567890', $1, '2028-03-10', $1)`,
        [T0],
      );
      expect(await adminSaveWarranty(db, admin, { ...ref("w1"), expiresAt: "2028-02-30" }, T1)).toMatchObject({
        status: 400,
        error: tr.panel.invalidDate,
      });
      expect(await adminSaveWarranty(db, admin, { ...ref("w1"), expiresAt: "2028-06-01" }, T1)).toEqual(saved(T1));
      expect(await adminSaveWarranty(db, admin, { ...ref("w1", T1), extended: true }, T2)).toEqual(saved(T2));
      const first = await readWarrantiesPage(db, { page: 1, today: "2026-03-11" });
      expect(first.rows[0]).toMatchObject({ expiresAt: "2029-06-01", extended: true, updatedAt: T2.toISOString() });
      // "Uye" rozeti: yalnizca sayfadaki kayitlarin uye olan e-postalari gider.
      expect(first).toMatchObject({ members: ["a@ornek.com"], all: 1, valid: 1, total: 1 });

      const T3 = new Date("2026-03-12T09:00:00.000Z");
      expect(await adminSaveWarranty(db, admin, { ...ref("w1", T2), extended: false }, T3)).toEqual(saved(T3));
      const { rows: warranties } = await readWarrantiesPage(db, { page: 1, today: "2026-03-11" });
      expect(warranties[0]).toMatchObject({ expiresAt: "2028-06-01", extended: false });

      expect(await adminDeleteWarranty(db, admin, ref("w1", T2), T3)).toEqual(stale);
      expect(await adminDeleteWarranty(db, admin, ref("w1", T3), T3)).toEqual({ ok: true });
      expect((await readWarrantiesPage(db, { page: 1, today: "2026-03-11" })).rows).toEqual([]);
      expect((await audit(client)).map((r) => r.changes?.expiresAt ?? r.action)).toEqual([
        ["2028-03-10", "2028-06-01"],
        ["2028-06-01", "2029-06-01"],
        ["2029-06-01", "2028-06-01"],
        "2028-06-01",
      ]);
    });
  });
});

describe("yorumlar", () => {
  async function reviews(client: PoolClient, count: number, extra = "") {
    await group(client);
    await category(client);
    await product(client, "p1", "ZW-P1");
    for (let i = 0; i < count; i++) {
      await client.query(
        `INSERT INTO reviews (id, product_id, author_name, rating, body, media, approved, featured, created_at, updated_at)
         VALUES ($1, 'p1', $2, 5, 'Güzel', $3, ${extra || "false, false"}, $4, $4)`,
        [`r${i}`, `Kişi ${i}`, JSON.stringify(i === 0 ? [{ kind: "image", url: "data:image/png;base64,AAAA" }] : []), T0],
      );
    }
  }

  it("onay, anasayfa ve silme; onaysız yorum anasayfaya alınmaz; kaldırılan yorum anasayfadan da çıkar", async () => {
    await withPanel(async (db, client) => {
      await reviews(client, 1);
      expect(await adminSetReviewFeatured(db, admin, { ...ref("r0"), featured: true }, T1)).toMatchObject({
        status: 409,
        error: tr.panel.reviewNotApproved,
      });
      expect(await adminSetReviewApproved(db, admin, { ...ref("r0"), approved: true }, T1)).toEqual(saved(T1));
      expect(await adminSetReviewFeatured(db, admin, { ...ref("r0", T1), featured: true }, T2)).toEqual(saved(T2));
      const T3 = new Date("2026-03-12T09:00:00.000Z");
      expect(await adminSetReviewApproved(db, admin, { ...ref("r0", T2), approved: false }, T3)).toEqual(saved(T3));
      const [review] = (await readReviewsPage(db, { page: 1 })).rows;
      expect(review).toMatchObject({ approved: false, featured: false, updatedAt: T3.toISOString() });

      expect(await adminDeleteReview(db, admin, ref("r0", T3), T3)).toEqual({ ok: true });
      expect((await readReviewsPage(db, { page: 1 })).rows).toEqual([]);
      const rows = await audit(client);
      expect(rows.map((r) => r.changes)).toEqual([
        { approved: [false, true] },
        { featured: [false, true] },
        { approved: [true, false], featured: [true, false] },
        expect.objectContaining({ authorName: "Kişi 0", media: "1 dosya" }),
      ]);
    });
  });

  it("anasayfada en fazla 10 yorum; yayından kalkan ürünün yorumu sayılmaz", async () => {
    await withPanel(async (db, client) => {
      await reviews(client, 10, "true, true");
      await client.query("INSERT INTO reviews (id, product_id, author_name, rating, body, approved, created_at, updated_at) VALUES ('yeni', 'p1', 'Yeni', 4, 'İyi', true, $1, $1)", [T0]);
      expect(await adminSetReviewFeatured(db, admin, { ...ref("yeni"), featured: true }, T1)).toMatchObject({
        status: 409,
        error: featuredReviewLimitText(),
      });
      await client.query("UPDATE products SET active = false WHERE id = 'p1'");
      expect(await adminSetReviewFeatured(db, admin, { ...ref("yeni"), featured: true }, T1)).toEqual(saved(T1));
    });
  });
});

describe("bayilik başvuruları, mesajlar, Welders Club", () => {
  it("başvuru ve mesajın durumu ve iç notu kaydedilir; hatalı durum ve eski ekran reddedilir", async () => {
    await withPanel(async (db, client) => {
      await client.query(
        `INSERT INTO dealer_applications (id, company_name, email, has_showroom, created_at, updated_at)
         VALUES ('b1', 'Kaynak Ltd', 'b@ornek.com', true, $1, $1)`,
        [T0],
      );
      await client.query(
        `INSERT INTO support_messages (id, type, name, email, message, product_name, product_sku, created_at, updated_at)
         VALUES ('m1', 'urun-destek', 'Ali', 'ali@ornek.com', 'Kablo boyu?', 'Makine', 'ZW-1', $1, $1)`,
        [T0],
      );
      expect(await adminSaveDealerApplication(db, admin, { ...ref("b1"), status: "won" }, T1)).toMatchObject({ status: 400 });
      expect(await adminSaveDealerApplication(db, admin, { ...ref("b1"), status: "reviewing", adminNote: "Ziyaret" }, T1)).toEqual(
        saved(T1),
      );
      expect(await adminSaveDealerApplication(db, admin, { ...ref("b1"), status: "approved" }, T2)).toEqual(stale);
      expect(await adminSaveSupportMessage(db, admin, { ...ref("m1"), status: "answered" }, T1)).toEqual(saved(T1));

      const [application] = await readDealerApplications(db);
      expect(application).toMatchObject({ status: "reviewing", adminNote: "Ziyaret", hasShowroom: true, updatedAt: T1.toISOString() });
      const [message] = await readSupportMessages(db);
      expect(message).toMatchObject({ type: "urun-destek", status: "answered", productSku: "ZW-1" });
      expect((await audit(client)).map((r) => [r.entity_type, r.entity_label])).toEqual([
        ["dealer_applications", "Kaynak Ltd"],
        ["support_messages", "Ali"],
      ]);
      // Form kayitlari panelden silinmez: silme islemi yok (K-100).
    });
  });

  it("Welders Club: pasife alınır ve yeniden aktif yapılır; kayıt silinmez", async () => {
    await withPanel(async (db, client) => {
      await client.query(
        "INSERT INTO welders_club_signups (id, name, email, created_at, updated_at) VALUES ('wc1', 'Usta', 'usta@ornek.com', $1, $1)",
        [T0],
      );
      expect(await adminSetWeldersClubActive(db, admin, { ...ref("wc1"), active: false }, T1)).toEqual(saved(T1));
      expect((await readWeldersClub(db))[0]).toMatchObject({ leftAt: T1.toISOString(), updatedAt: T1.toISOString() });
      // Zaten pasif: hicbir sey yazilmaz.
      expect(await adminSetWeldersClubActive(db, admin, { ...ref("wc1", T1), active: false }, T2)).toEqual(saved(T1));
      expect(await adminSetWeldersClubActive(db, admin, { ...ref("wc1", T1), active: true }, T2)).toEqual(saved(T2));
      expect((await readWeldersClub(db))[0].leftAt).toBeUndefined();
      expect((await audit(client)).map((r) => r.changes)).toEqual([
        { leftAt: [null, T1.toISOString()] },
        { leftAt: [T1.toISOString(), null] },
      ]);
    });
  });
});

describe("sayfalı listeler", () => {
  it("teklifler: 50'şer, durum süzgeci; CSV süzgece uyanların tamamı", async () => {
    await withPanel(async (db, client) => {
      for (let i = 1; i <= 53; i++) {
        await client.query(
          `INSERT INTO quotes (id, code, status, company_name, contact_name, email, phone, city, payment_preference, created_at, updated_at)
           VALUES ($1, $2, $3, 'Firma', 'Yetkili', 'a@ornek.com', '0555', 'Konya', 'havale', $4, $4)`,
          [`q${i}`, `TKL-${String(i).padStart(2, "0")}`, i <= 51 ? "new" : "won", T0],
        );
      }
      const first = await readQuotesPage(db, { page: 1 });
      expect(first).toMatchObject({ total: 53, page: 1 });
      expect(first.rows).toHaveLength(50);
      expect(first.rows[0].code).toBe("TKL-53");
      expect((await readQuotesPage(db, { page: 2 })).rows.map((q) => q.code)).toEqual(["TKL-03", "TKL-02", "TKL-01"]);
      expect((await readQuotesPage(db, { page: 1, status: "won" })).total).toBe(2);
      expect((await readQuotesForExport(db, { status: "new" })).length).toBe(51);
    });
  });

  it("servis talepleri: sayfa ve yeni talep sayısı", async () => {
    await withPanel(async (db, client) => {
      for (const [id, status] of [["s1", "new"], ["s2", "done"], ["s3", "new"]]) {
        await client.query(
          `INSERT INTO service_requests (id, code, status, product_name, reasons, complaint, company_name, address, city, district,
                                         email, phone, contact_name, contact_gsm, created_at, updated_at)
           VALUES ($1, 'SRV-' || $1, $2, 'Makine', '{onarim}', 'x', 'Firma', 'Adres', 'Konya', 'Selçuklu', 'a@ornek.com', '0555', 'Y', '0555', $3, $3)`,
          [id, status, T0],
        );
      }
      const page = await readServicePage(db, 1);
      expect(page).toMatchObject({ total: 3, newCount: 2, page: 1 });
      expect(page.rows.map((r) => r.code)).toEqual(["SRV-s3", "SRV-s2", "SRV-s1"]);
    });
  });

  it("garantiler: Türkçe arama, geçerli / süresi dolan / uzatılmış, sayfadaki üyeler; CSV", async () => {
    await withPanel(async (db, client) => {
      await client.query(
        `INSERT INTO users (id, role, email, password_hash, first_name, last_name, phone)
         VALUES ('u-y', 'admin', 'yonetici@ornek.com', 'ozet', 'Y', 'Y', '0555')`,
      );
      const rows: [string, string, string, string, boolean][] = [
        ["w1", "IŞIK Kaynak", "a@ornek.com", "2026-03-10", false],
        ["w2", "Deneme", "yonetici@ornek.com", "2026-03-11", true],
        ["w3", "Başka", "b@ornek.com", "2028-01-01", false],
      ];
      for (const [id, owner, email, expires, extended] of rows) {
        await client.query(
          `INSERT INTO warranties (id, serial_number, owner_name, email, phone, city, postal_code, address, seller_tax_number,
                                   registered_at, expires_at, extended, updated_at)
           VALUES ($1, 'ZW-' || $1, $2, $3, '0555', 'Konya', '42000', 'Adres', '1234567890', $4, $5, $6, $4)`,
          [id, owner, email, T0, expires, extended],
        );
      }
      const today = "2026-03-11";
      const all = await readWarrantiesPage(db, { page: 1, today });
      // Yonetici "uye" sayilmaz; yalnizca sayfadaki kayitlarin e-postalari.
      expect(all).toMatchObject({ total: 3, all: 3, valid: 2, members: ["a@ornek.com"] });
      expect((await readWarrantiesPage(db, { page: 1, today, state: "expired" })).rows.map((w) => w.id)).toEqual(["w1"]);
      expect((await readWarrantiesPage(db, { page: 1, today, state: "valid" })).total).toBe(2);
      expect((await readWarrantiesPage(db, { page: 1, today, state: "extended" })).rows.map((w) => w.id)).toEqual(["w2"]);
      for (const q of ["ışık", "IŞIK", "işık"]) {
        expect((await readWarrantiesPage(db, { page: 1, today, q })).rows.map((w) => w.id), q).toEqual(["w1"]);
      }
      expect((await readWarrantiesPage(db, { page: 1, today, q: "zw-w3" })).rows.map((w) => w.id)).toEqual(["w3"]);
      expect((await readWarrantiesForExport(db, { today, state: "valid" })).map((w) => w.id).sort()).toEqual(["w2", "w3"]);
    });
  });

  it("yorumlar: onay bekleyenler, arama; anasayfa sayısı yalnızca yayındaki ürünlerin onaylı yorumları", async () => {
    await withPanel(async (db, client) => {
      await group(client);
      await category(client);
      await product(client, "p1", "ZW-P1");
      await product(client, "p2", "ZW-P2");
      await client.query("UPDATE products SET active = false WHERE id = 'p2'");
      const rows: [string, string, string, boolean, boolean][] = [
        ["r1", "p1", "Çok IŞIKLI ekran", true, true],
        ["r2", "p2", "Güzel", true, true],
        ["r3", "p1", "Bekliyor", false, false],
      ];
      for (const [id, productId, body, approved, featured] of rows) {
        await client.query(
          `INSERT INTO reviews (id, product_id, author_name, rating, body, media, approved, featured, created_at, updated_at)
           VALUES ($1, $2, 'Kişi', 5, $3, '[]', $4, $5, $6, $6)`,
          [id, productId, body, approved, featured, T0],
        );
      }
      const all = await readReviewsPage(db, { page: 1 });
      expect(all).toMatchObject({ total: 3, pendingCount: 1, featuredCount: 1 });
      expect(all.rows.map((r) => r.id)).toEqual(["r3", "r2", "r1"]);
      expect((await readReviewsPage(db, { page: 1, pending: true })).rows.map((r) => r.id)).toEqual(["r3"]);
      expect((await readReviewsPage(db, { page: 1, q: "ışıklı" })).rows.map((r) => r.id)).toEqual(["r1"]);
    });
  });
});
