import { afterAll, describe, expect, it } from "vitest";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool, type PoolClient } from "pg";
import { tr } from "@zenweld/i18n";
import {
  adminCancelOrder,
  adminDeleteCoupon,
  adminMarkOrderDelivered,
  adminMarkOrderPaid,
  adminSaveCoupon,
  adminSaveOrderNote,
  adminSaveReturnRequest,
  adminSetCouponActive,
  adminShipOrder,
  readCouponsPanel,
  readOrdersPage,
  readOrdersPanel,
  readReturnsPage,
  type Actor,
} from "../../packages/db/src";
import * as schema from "../../packages/db/src/schema";
import { category, closePool, group, inTransaction, product, testDatabaseUrl, user } from "./ortak";

/*
 * PANEL › SATIS SUNUCUDA (packages/db/src/admin-sales.ts; Asama 5, 1. alan,
 * KARARLAR K-99): siparis, iade talebi ve kupon islemleri; ekran
 * acildiktan sonra degismis kaydin kaydedilmemesi; her degisikligin
 * audit_log'a yazilmasi. Her test kendi isleminde calisir ve geri alinir;
 * ayni anda kaydetme testi gercekten yazar ve sonda siler (audit_log
 * silinemez, onun kaydi kalir).
 */

afterAll(closePool);

type Db = NodePgDatabase<typeof schema>;

const admin: Actor = { id: "u-yonetici", name: "Yönetici Bir", ip: "10.0.0.1" };
const T0 = new Date("2026-03-10T09:00:00.000Z");

async function fixtures(client: PoolClient, p = ""): Promise<void> {
  await client.query(
    `INSERT INTO users (id, role, email, password_hash, first_name, last_name, phone)
     VALUES ($1, 'admin', $2, 'ozet', 'Yönetici', 'Bir', '05550000000')`,
    [`${p}u-yonetici`, `${p}yonetici@ornek.com`],
  );
  await user(client, `${p}u-a`, `${p}a@ornek.com`);
  await client.query("INSERT INTO carriers (id, name, position) VALUES ($1, $2, 1)", [`${p}kargo-1`, `${p}Yurtiçi Kargo`]);
}

/** Siparis: verilen durumda, T0'da olusturulmus ve son degismis. */
async function order(client: PoolClient, id: string, status: string, extra: { dueAt?: Date; userId?: string } = {}) {
  await client.query(
    `INSERT INTO orders (id, code, user_id, status, customer_name, email, phone, shipping_address, invoice,
                         subtotal, vat, shipping, total, payment_method, due_at, terms_accepted_at, created_at, updated_at)
     VALUES ($1, 'SIP-' || $1, $2, $3, 'Ad Soyad', 'a@ornek.com', '0555', '{}', '{}', 1000, 167, 0, 1000,
             'transfer', $4, $5, $5, $5)`,
    [id, extra.userId ?? "u-a", status, extra.dueAt ?? null, T0],
  );
  await client.query("INSERT INTO order_status_history (order_id, seq, status, at) VALUES ($1, 0, $2, $3)", [id, status, T0]);
}

async function withPanel(run: (db: Db, client: PoolClient) => Promise<void>) {
  await inTransaction(async (client) => {
    await fixtures(client);
    await run(drizzle(client, { schema }), client);
  });
}

const audit = async (client: PoolClient) =>
  (
    await client.query(
      // Yalnizca bu testin yoneticisi: baska testlerin silinemeyen kayitlari sayilmaz.
      "SELECT actor_user_id, actor_name, action, entity_type, entity_id, entity_label, changes, host(ip) AS ip FROM audit_log WHERE actor_user_id = $1 ORDER BY id",
      [admin.id],
    )
  ).rows;

const ref = (id: string, updatedAt = T0) => ({ id, updatedAt: updatedAt.toISOString() });
/** Basarili yazma: kaydin yeni son degisiklik ani doner. */
const saved = (at: Date, extra: Record<string, unknown> = {}) => ({ ok: true, updatedAt: at.toISOString(), ...extra });

describe("siparişler", () => {
  it("ödeme → kargo → takip no düzeltme → teslim; her adım geçmişe yöneticiyle ve audit_log'a yazılır", async () => {
    await withPanel(async (db, client) => {
      await order(client, "o1", "awaiting_payment", { dueAt: new Date("2026-03-13T09:00:00.000Z") });
      const t1 = new Date("2026-03-11T10:00:00.000Z");
      expect(await adminMarkOrderPaid(db, admin, ref("o1"), t1)).toEqual(saved(t1, { expired: false }));

      // Ekranin gordugu an eskidi: kaydedilmez.
      expect(await adminShipOrder(db, admin, { ...ref("o1"), carrier: "Yurtiçi Kargo", trackingNumber: "123" }, t1)).toEqual({
        ok: false,
        status: 409,
        error: tr.panel.staleRecord,
      });
      expect(await adminShipOrder(db, admin, { ...ref("o1", t1), carrier: "Uçan Kargo", trackingNumber: "123" }, t1)).toMatchObject({
        status: 400,
        error: tr.panel.unknownCarrier,
      });
      expect(await adminShipOrder(db, admin, { ...ref("o1", t1), carrier: " ", trackingNumber: "123" }, t1)).toMatchObject({
        status: 400,
        error: tr.panel.shipmentRequired,
      });
      const t2 = new Date("2026-03-11T11:00:00.000Z");
      expect(await adminShipOrder(db, admin, { ...ref("o1", t1), carrier: "Yurtiçi Kargo", trackingNumber: "123" }, t2)).toEqual(saved(t2));
      const t3 = new Date("2026-03-11T12:00:00.000Z");
      expect(await adminShipOrder(db, admin, { ...ref("o1", t2), carrier: "Yurtiçi Kargo", trackingNumber: "456" }, t3)).toEqual(saved(t3));
      const t4 = new Date("2026-03-12T12:00:00.000Z");
      expect(await adminMarkOrderDelivered(db, admin, ref("o1", t3), t4)).toEqual(saved(t4));
      // Teslim edilen siparis iptal edilemez.
      expect(await adminCancelOrder(db, admin, ref("o1", t4), t4)).toMatchObject({ status: 409, error: tr.panel.wrongState });

      const { orders } = await readOrdersPanel(db, t4, "o1");
      expect(orders).toHaveLength(1);
      expect(orders[0]).toMatchObject({
        status: "delivered",
        updatedAt: t4.toISOString(),
        payment: { paidAt: t1.toISOString() },
        // Takip no duzeltilince gonderi tarihi degismez.
        shipment: { carrier: "Yurtiçi Kargo", trackingNumber: "456", shippedAt: t2.toISOString(), deliveredAt: t4.toISOString() },
        history: [{ status: "awaiting_payment" }, { status: "preparing" }, { status: "shipped" }, { status: "delivered" }],
        // Havale alininca SAP'a aktarim sirasina girdi (K-108).
        sapExport: { status: "pending", attempts: 0, nextAttemptAt: t1.toISOString() },
      });
      const changedBy = (await client.query("SELECT changed_by FROM order_status_history WHERE order_id = 'o1' ORDER BY seq")).rows;
      expect(changedBy.map((r) => r.changed_by)).toEqual([null, "u-yonetici", "u-yonetici", "u-yonetici"]);
      const [shipment] = (await client.query("SELECT carrier_id FROM shipments WHERE order_id = 'o1'")).rows;
      expect(shipment.carrier_id).toBe("kargo-1");

      expect(await audit(client)).toEqual([
        {
          actor_user_id: "u-yonetici",
          actor_name: "Yönetici Bir",
          action: "update",
          entity_type: "orders",
          entity_id: "o1",
          entity_label: "SIP-o1",
          changes: { status: ["awaiting_payment", "preparing"], paidAt: [null, t1.toISOString()] },
          ip: "10.0.0.1",
        },
        expect.objectContaining({
          changes: { status: ["preparing", "shipped"], carrier: [null, "Yurtiçi Kargo"], trackingNumber: [null, "123"] },
        }),
        expect.objectContaining({ changes: { trackingNumber: ["123", "456"] } }),
        expect.objectContaining({ changes: { status: ["shipped", "delivered"] } }),
      ]);
    });
  });

  it("süresi dolan havale onaylanmaz, iptal edilir; iptalde kupon hakkı geri verilir; iç not yazılır", async () => {
    await withPanel(async (db, client) => {
      await order(client, "o1", "awaiting_payment", { dueAt: new Date("2026-03-11T09:00:00.000Z") });
      await order(client, "o2", "preparing");
      await client.query("INSERT INTO coupons (id, code, discount_type, discount_value) VALUES ('k1', 'K1', 'amount', 100)");
      await client.query(
        "INSERT INTO coupon_redemptions (coupon_id, coupon_code, user_id, order_id, discount_amount) VALUES ('k1', 'K1', 'u-a', 'o2', 100)",
      );
      // Son gun 11 Mart 23:59 (Turkiye); 12 Mart'ta onaylanmak istenir.
      const late = new Date("2026-03-12T09:00:00.000Z");
      expect(await adminMarkOrderPaid(db, admin, ref("o1"), late)).toEqual(saved(late, { expired: true }));

      expect(await adminCancelOrder(db, admin, { ...ref("o2"), note: "Stok yok" }, late)).toEqual(saved(late));
      expect(await adminSaveOrderNote(db, admin, { ...ref("o2", late), adminNote: " Müşteri aradı " }, late)).toEqual(saved(late));
      // Degisiklik yoksa yazilmaz; son degisiklik ani ayni kalir.
      expect(await adminSaveOrderNote(db, admin, { ...ref("o2", late), adminNote: "Müşteri aradı" }, new Date())).toEqual(saved(late));

      const { rows: orders } = await readOrdersPage(db, late, { page: 1 });
      const byId = Object.fromEntries(orders.map((o) => [o.id, o]));
      expect(byId.o1).toMatchObject({ status: "cancelled", history: [{}, { status: "cancelled", note: "Ödeme süresi doldu" }] });
      expect(byId.o1.payment.paidAt).toBeUndefined();
      expect(byId.o2).toMatchObject({ status: "cancelled", adminNote: "Müşteri aradı", history: [{}, { status: "cancelled", note: "Stok yok" }] });
      const [redemption] = (await client.query("SELECT released_at FROM coupon_redemptions")).rows;
      expect(redemption.released_at.toISOString()).toBe(late.toISOString());
      expect((await audit(client)).map((r) => r.changes)).toEqual([
        { status: ["awaiting_payment", "cancelled"] },
        { status: ["preparing", "cancelled"], note: [null, "Stok yok"] },
        { adminNote: [null, "Müşteri aradı"] },
      ]);
    });
  });

  it("panel okunurken süresi dolan havaleler iptal edilir; magaza ayarları (kargo firmaları) gelir", async () => {
    await withPanel(async (db, client) => {
      await order(client, "o1", "awaiting_payment", { dueAt: new Date("2026-03-11T09:00:00.000Z") });
      const { orders, settings } = await readOrdersPanel(db, new Date("2026-03-12T09:00:00.000Z"), "o1");
      expect(orders[0].status).toBe("cancelled");
      expect(settings.shop.carriers).toEqual([{ name: "Yurtiçi Kargo" }]);
      // Sistemin yaptigi iptal yoneticinin degisikligi degildir.
      expect(await audit(client)).toEqual([]);
    });
  });
});

describe("sayfalı listeler", () => {
  it("siparişler: 50'şer sayfa, durum süzgeci, Türkçe arama; durum sayıları aramadan bağımsız", async () => {
    await withPanel(async (db, client) => {
      // 55 siparis ayni anda: sira koda gore (o55 … o01).
      for (let i = 1; i <= 55; i++) await order(client, `o${String(i).padStart(2, "0")}`, i <= 52 ? "preparing" : "delivered");
      await client.query(`UPDATE orders SET customer_name = 'IŞIK Kaynak', invoice = '{"companyName":"Isparta Ltd"}' WHERE id = 'o07'`);

      const first = await readOrdersPage(db, T0, { page: 1 });
      expect(first).toMatchObject({ total: 55, page: 1, all: 55 });
      expect(first.counts).toEqual({ awaiting_payment: 0, preparing: 52, shipped: 0, delivered: 3, cancelled: 0 });
      expect(first.rows).toHaveLength(50);
      expect(first.rows[0]).toMatchObject({ id: "o55", history: [{ status: "delivered" }] });

      // Son sayfadan buyuk sayfa son sayfayi gosterir.
      const last = await readOrdersPage(db, T0, { page: 9 });
      expect(last.page).toBe(2);
      expect(last.rows.map((o) => o.id)).toEqual(["o05", "o04", "o03", "o02", "o01"]);

      expect((await readOrdersPage(db, T0, { page: 1, status: "delivered" })).total).toBe(3);
      // I / İ / ı / i ayni harf; fatura firmasinda da aranir; % harfiyen aranir.
      for (const q of ["ışık", "IŞIK", "işık", "ısparta", "ISPARTA", "isparta"]) {
        const found = await readOrdersPage(db, T0, { page: 1, q });
        expect(found.rows.map((o) => o.id), q).toEqual(["o07"]);
        expect(found.counts.preparing, q).toBe(52);
      }
      expect((await readOrdersPage(db, T0, { page: 1, q: "%" })).total).toBe(0);
    });
  });

  it("iade talepleri: sayfa ve yeni talep sayısı", async () => {
    await withPanel(async (db, client) => {
      await order(client, "o1", "delivered");
      for (const [id, status, at] of [
        ["r1", "new", "2026-03-11T09:00:00Z"],
        ["r2", "approved", "2026-03-12T09:00:00Z"],
      ]) {
        await client.query(
          `INSERT INTO return_requests (id, code, order_id, order_code, user_id, customer_name, email, phone, reason, status, created_at, updated_at)
           VALUES ($1, 'IAD-' || $1, 'o1', 'SIP-o1', 'u-a', 'Ad Soyad', 'a@ornek.com', '0555', 'defective', $2, $3, $3)`,
          [id, status, at],
        );
      }
      const page = await readReturnsPage(db, 1);
      expect(page).toMatchObject({ total: 2, page: 1, newCount: 1 });
      expect(page.rows.map((r) => r.id)).toEqual(["r2", "r1"]);
    });
  });
});

describe("iade talepleri", () => {
  it("durum ve iç not kaydedilir; ekran açıldıktan sonra değiştiyse kaydedilmez", async () => {
    await withPanel(async (db, client) => {
      await order(client, "o1", "delivered");
      await client.query(
        `INSERT INTO return_requests (id, code, order_id, order_code, user_id, customer_name, email, phone, reason, created_at, updated_at)
         VALUES ('r1', 'IAD-1', 'o1', 'SIP-o1', 'u-a', 'Ad Soyad', 'a@ornek.com', '0555', 'defective', $1, $1)`,
        [T0],
      );
      const at = new Date("2026-03-11T09:00:00.000Z");
      expect(await adminSaveReturnRequest(db, admin, { ...ref("r1"), status: "uydurma" }, at)).toMatchObject({ status: 400 });
      expect(await adminSaveReturnRequest(db, admin, { ...ref("r1"), status: "approved", adminNote: "Kargo kodu verildi" }, at)).toEqual(saved(at));
      expect(await adminSaveReturnRequest(db, admin, { ...ref("r1"), status: "rejected" }, at)).toMatchObject({
        status: 409,
        error: tr.panel.staleRecord,
      });
      expect(await adminSaveReturnRequest(db, admin, { ...ref("yok"), status: "rejected" }, at)).toMatchObject({ status: 404 });
      const [row] = (await client.query("SELECT status, admin_note FROM return_requests")).rows;
      expect(row).toEqual({ status: "approved", admin_note: "Kargo kodu verildi" });
      expect(await audit(client)).toEqual([
        expect.objectContaining({
          entity_type: "return_requests",
          entity_id: "r1",
          entity_label: "IAD-1",
          changes: { status: ["new", "approved"], adminNote: [null, "Kargo kodu verildi"] },
        }),
      ]);
    });
  });
});

describe("kuponlar", () => {
  const draft = (extra: Record<string, unknown> = {}) => ({
    code: " yaz-25 ",
    name: " Yaz ",
    discountType: "percent",
    discountValue: 25,
    minCartTotal: "",
    startsAt: "2026-06-01T00:00:00+03:00",
    endsAt: undefined,
    totalUsageLimit: 100,
    perUserLimit: 1,
    scope: "targets",
    productIds: ["p1", "p1"],
    categoryIds: ["c1"],
    audience: "customers",
    customerEmails: [" A@Ornek.com ", "a@ornek.com"],
    active: true,
    ...extra,
  });

  it("yeni kupon: biçim düzeltilir, kapsam ve kişiler yazılır; kod tekrarı, olmayan ürün ve hatalı alan reddedilir", async () => {
    await withPanel(async (db, client) => {
      await group(client);
      await category(client);
      await product(client, "p1", "ZW-P1");
      const at = new Date("2026-03-11T09:00:00.000Z");
      const created = await adminSaveCoupon(db, admin, draft(), at);
      expect(created.ok).toBe(true);
      if (!created.ok) return;
      const { coupons } = await readCouponsPanel(db, created.id);
      expect(coupons[0]).toMatchObject({
        code: "YAZ-25",
        name: "Yaz",
        discountValue: 25,
        startsAt: "2026-05-31T21:00:00.000Z",
        productIds: ["p1"],
        categoryIds: ["c1"],
        customerEmails: ["a@ornek.com"],
        createdAt: at.toISOString(),
      });
      expect(coupons[0].minCartTotal).toBeUndefined();

      expect(await adminSaveCoupon(db, admin, draft({ code: "Yaz-25" }), at)).toEqual({
        ok: false,
        status: 409,
        error: '"YAZ-25" kodu başka bir kuponda kullanılıyor.',
      });
      expect(await adminSaveCoupon(db, admin, draft({ code: "YENI", productIds: ["yok"] }), at)).toMatchObject({
        status: 400,
        error: tr.panel.couponTargetsMissing,
      });
      expect(await adminSaveCoupon(db, admin, draft({ code: "YENI", discountValue: "25" }), at)).toMatchObject({
        status: 400,
        error: "İndirim oranı %1 ile %100 arasında tam sayı olmalıdır.",
      });
      expect(await adminSaveCoupon(db, admin, draft({ code: "YENI", scope: "hepsi" }), at)).toMatchObject({
        status: 400,
        error: tr.panel.invalidRequest,
      });
      expect(await adminSaveCoupon(db, admin, draft({ code: "YENI", endsAt: "dun" }), at)).toMatchObject({ status: 400 });

      const rows = await audit(client);
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({ action: "create", entity_type: "coupons", entity_id: created.id, entity_label: "YAZ-25" });
      // Olusturmada kaydin ilk hali yazilir.
      expect(rows[0].changes).toMatchObject({ code: "YAZ-25", productIds: ["p1"], customerEmails: ["a@ornek.com"], minCartTotal: null });
    });
  });

  it("düzenleme, aktif/pasif ve silme; kullanılmış kupon silinmez; ekran eskiyse kaydedilmez", async () => {
    await withPanel(async (db, client) => {
      await group(client);
      await category(client);
      await product(client, "p1", "ZW-P1");
      const at = new Date("2026-03-11T09:00:00.000Z");
      const created = await adminSaveCoupon(db, admin, draft(), at);
      if (!created.ok) throw new Error(created.error);
      const id = created.id;
      const later = new Date("2026-03-11T10:00:00.000Z");

      const edit = draft({ scope: "all", audience: "all", discountValue: 30 });
      expect(await adminSaveCoupon(db, admin, { ...edit, ...ref(id, T0) }, later)).toMatchObject({ status: 409, error: tr.panel.staleRecord });
      expect(await adminSaveCoupon(db, admin, { ...edit, ...ref(id, at) }, later)).toEqual(saved(later, { id }));
      let [coupon] = (await readCouponsPanel(db, id)).coupons;
      expect(coupon).toMatchObject({ discountValue: 30, scope: "all", productIds: [], categoryIds: [], customerEmails: [], updatedAt: later.toISOString() });

      const off = new Date("2026-03-11T11:00:00.000Z");
      expect(await adminSetCouponActive(db, admin, { ...ref(id, later), active: false }, off)).toEqual(saved(off));
      [coupon] = (await readCouponsPanel(db, id)).coupons;
      expect(coupon.active).toBe(false);

      // Kullanilmis kupon silinmez.
      await order(client, "o1", "preparing");
      await client.query(
        "INSERT INTO coupon_redemptions (coupon_id, coupon_code, user_id, order_id, discount_amount) VALUES ($1, 'YAZ-25', 'u-a', 'o1', 100)",
        [id],
      );
      expect(await adminDeleteCoupon(db, admin, ref(id, off), off)).toMatchObject({ status: 409, error: tr.panel.couponUsed });
      const panel = await readCouponsPanel(db, id);
      expect(panel.orders?.map((o) => o.code)).toEqual(["SIP-o1"]);
      // Uyeler (kisiye ozel kupon listesi): yonetici ve sifre ozeti gelmez.
      expect(panel.users?.map((u) => [u.email, u.passwordHash])).toEqual([["a@ornek.com", ""]]);

      await client.query("DELETE FROM coupon_redemptions");
      expect(await adminDeleteCoupon(db, admin, ref(id, off), off)).toEqual({ ok: true });
      expect((await readCouponsPanel(db)).coupons).toEqual([]);

      const rows = await audit(client);
      expect(rows.map((r) => r.action)).toEqual(["create", "update", "update", "delete"]);
      expect(rows[1].changes).toEqual({
        discountValue: [25, 30],
        scope: ["targets", "all"],
        productIds: [["p1"], []],
        categoryIds: [["c1"], []],
        audience: ["customers", "all"],
        customerEmails: [["a@ornek.com"], []],
      });
      expect(rows[2].changes).toEqual({ active: [true, false] });
      expect(rows[3].changes).toMatchObject({ code: "YAZ-25", active: false });
    });
  });
});

describe("aynı anda iki yönetici", () => {
  it("aynı siparişi ikisi de kaydederse ikincisi beklenir ve reddedilir: \"sayfayı yenileyin\"", async () => {
    const pool = new Pool({ connectionString: testDatabaseUrl(), max: 2 });
    const [a, b] = [await pool.connect(), await pool.connect()];
    const p = `es${Date.now()}-`;
    const actor = { ...admin, id: `${p}u-yonetici` };
    try {
      await fixtures(a, p);
      await order(a, `${p}o1`, "preparing", { userId: `${p}u-a` });
      const input = (adminNote: string) => ({ id: `${p}o1`, updatedAt: T0.toISOString(), adminNote });

      await a.query("BEGIN");
      const first = await adminSaveOrderNote(drizzle(a, { schema }), actor, input("Birinci"), new Date());
      await b.query("BEGIN");
      let done = false;
      const second = adminSaveOrderNote(drizzle(b, { schema }), actor, input("İkinci"), new Date()).then((r) => ((done = true), r));
      await new Promise((resolve) => setTimeout(resolve, 300));
      expect(done).toBe(false);
      await a.query("COMMIT");
      const result = await second;
      await b.query("COMMIT");
      expect(first).toMatchObject({ ok: true });
      expect(result).toEqual({ ok: false, status: 409, error: tr.panel.staleRecord });
      const [row] = (await a.query("SELECT admin_note FROM orders WHERE id = $1", [`${p}o1`])).rows;
      expect(row.admin_note).toBe("Birinci");
    } finally {
      await a.query("ROLLBACK").catch(() => {});
      await b.query("ROLLBACK").catch(() => {});
      await a.query("DELETE FROM orders WHERE id = $1", [`${p}o1`]);
      await a.query("DELETE FROM carriers WHERE id LIKE $1", [`${p}%`]);
      await a.query("DELETE FROM users WHERE id LIKE $1", [`${p}%`]);
      a.release();
      b.release();
      await pool.end();
    }
  });
});
