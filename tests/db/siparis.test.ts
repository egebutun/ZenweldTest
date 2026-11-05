import { afterAll, describe, expect, it } from "vitest";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool, type PoolClient } from "pg";
import { defaultSettings, orderCodePrefix, returnCodePrefix, type PaymentPos, type ShopSettings } from "@zenweld/data";
import {
  cancelExpiredTransfers,
  checkCartCoupon,
  createReturnRequest,
  memberOrders,
  placeOrder,
  readCatalog,
  TEMSILI_ODEME,
  type CardPaymentRequest,
  type Member,
  type PaymentProvider,
  type PricingData,
} from "../../packages/db/src";
import * as schema from "../../packages/db/src/schema";
import { tr } from "@zenweld/i18n";
import { formatPrice } from "@zenweld/utils";
import { category, closePool, group, inTransaction, product, testDatabaseUrl, user } from "./ortak";

/*
 * SIPARISLER SUNUCUDA (packages/db/src/orders.ts; Asama 5.2, KARARLAR K-97).
 * Her test kendi isleminde calisir ve sonunda geri alinir; aynı anda gelen
 * siparis testi gercekten yazar ve sonda siler.
 */

afterAll(closePool);

type Db = NodePgDatabase<typeof schema>;

const POS: PaymentPos = {
  id: "pos-1",
  bankShortName: "Banka",
  name: "Banka Bonus",
  program: "Bonus",
  merchantNo: "0",
  posName: "Sanal POS",
  active: true,
  isDefault: true,
  installments: [{ count: 3, ratePercent: 5, enabled: true }],
  commissions: [{ count: 3, ratePercent: 2.5 }],
};
const SHOP: ShopSettings = { ...defaultSettings.shop, freeShippingThreshold: 5000, shippingFee: 250, transferDueDays: 3, pos: [POS] };
// Kart programi ilk 6 haneden (DEMO): 440000 -> Bonus.
const BIN = "440000";

const memberA: Member = { id: "u-a", role: "individual", email: "a@ornek.com", firstName: "Ad", lastName: "Soyad", phone: "05550000000" };
const memberB: Member = { ...memberA, id: "u-b", email: "b@ornek.com" };

async function fixtures(client: PoolClient, prefix = ""): Promise<void> {
  await user(client, `${prefix}u-a`, `${prefix}a@ornek.com`);
  await user(client, `${prefix}u-b`, `${prefix}b@ornek.com`);
  await group(client, `${prefix}g1`, `${prefix}kaynak-makineleri`);
  await category(client, `${prefix}c1`, `${prefix}g1`);
  await product(client, `${prefix}p1`, `${prefix}ZW-P1`, `${prefix}c1`);
  await product(client, `${prefix}p2`, `${prefix}ZW-P2`, `${prefix}c1`);
  await client.query(
    `INSERT INTO payment_pos (id, bank_short_name, name, program, merchant_no, pos_name, is_default, position, installments, commissions)
     VALUES ($1, 'Banka', 'Banka Bonus', 'Bonus', '0', 'Sanal POS', false, 1, '[]', '[]')`,
    [`${prefix}pos-1`],
  );
}

async function pricing(db: Db, prefix = ""): Promise<PricingData> {
  const catalog = await readCatalog(db);
  // p1 depoda 5 adet; p2 stoksuz.
  const syncedAt = new Date().toISOString();
  return {
    catalog: { ...catalog, warehouseStock: [{ sapItemCode: `${prefix}ZW-P1`.toUpperCase(), quantity: 5, syncedAt }] },
    shop: { ...SHOP, pos: [{ ...POS, id: `${prefix}pos-1` }] },
  };
}

async function withShop(run: (db: Db, client: PoolClient, data: PricingData) => Promise<void>) {
  await inTransaction(async (client) => {
    await fixtures(client);
    const db = drizzle(client, { schema });
    await run(db, client, await pricing(db));
  });
}

const address = { fullName: "Ad Soyad", phone: "05550000000", city: "Konya", district: "Selçuklu", line: "Örnek Cad. No:1" };
const individual = { type: "individual", fullName: "Ad Soyad", tcKimlikNo: "10000000146", address };

/** p1'den 2 adet: 2 × 1.200 = 2.400 + kargo 250 = 2.650 TL. */
const order = (overrides: Record<string, unknown> = {}) => ({
  lines: [{ productId: "p1", quantity: 2 }],
  shippingAddress: address,
  invoice: individual,
  termsAccepted: true,
  payment: { method: "transfer" },
  expectedTotal: 2650,
  ...overrides,
});

const coupon = (client: PoolClient, code: string, extra = "") =>
  client.query(
    `INSERT INTO coupons (id, code, discount_type, discount_value${extra ? ", total_usage_limit" : ""})
     VALUES ($1, $1, 'amount', 100${extra ? `, ${extra}` : ""})`,
    [code],
  );

describe("sipariş verme", () => {
  it("kartla: tutar sunucuda hesaplanır, ödenmiş sayılır; numara var olan en büyük numaradan devam eder", async () => {
    await withShop(async (db, client, data) => {
      const at = new Date();
      const prefix = orderCodePrefix(at);
      await client.query(
        `INSERT INTO orders (id, code, user_id, status, customer_name, email, phone, shipping_address, invoice,
                             subtotal, vat, shipping, total, payment_method, terms_accepted_at)
         VALUES ('o-eski', $1, 'u-b', 'delivered', 'Eski', 'b@ornek.com', '0555', '{}', '{}', 0, 0, 0, 0, 'transfer', now())`,
        [`${prefix}00041`],
      );
      // 3 taksit, vade farki %5: 2.650 + 133 = 2.783 TL.
      const result = await placeOrder(
        db,
        memberA,
        order({ payment: { method: "card", cardBin: BIN, cardLast4: "1234", installments: 3 }, expectedTotal: 2783 }),
        at,
        data,
      );
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.order).toMatchObject({
        code: `${prefix}00042`,
        userId: "u-a",
        status: "preparing",
        customerName: "Ad Soyad",
        subtotal: 2400,
        shipping: 250,
        installmentFee: 133,
        total: 2783,
        payment: { method: "card", installments: 3, cardBrand: "Visa", cardProgram: "Bonus", cardLast4: "1234", posId: "pos-1", commissionPercent: 2.5 },
        items: [{ productId: "p1", sku: "ZW-P1", quantity: 2, unitPriceExVat: 1000, vatRate: 20, unitPrice: 1200 }],
        history: [{ status: "preparing" }],
      });
      expect(result.order.payment.paidAt).toBe(at.toISOString());
      const [counter] = (await client.query("SELECT last_number FROM record_counters WHERE prefix = $1", [prefix])).rows;
      expect(counter.last_number).toBe(42);

      const second = await placeOrder(db, memberA, order(), at, data);
      expect(second.ok && second.order.code).toBe(`${prefix}00043`);

      // Kartla tahsilat odeme saglayicisinin kaydiyla yazilir (temsili saglayici, K-108).
      expect((await client.query("SELECT order_id, pos_id, kind, amount, installments, status, provider_ref, raw FROM payment_transactions")).rows).toEqual([
        {
          order_id: result.order.id,
          pos_id: "pos-1",
          kind: "sale",
          amount: "2783.00",
          installments: 3,
          status: "success",
          provider_ref: `TEMSILI-${result.order.id}`,
          raw: { saglayici: "temsili" },
        },
      ]);
    });
  });

  it("ödeme sağlayıcısı: kart programını o verir; tahsilatı reddederse sipariş alınmaz, numara harcanmaz", async () => {
    await withShop(async (db, client, data) => {
      const at = new Date();
      const card = { method: "card", cardBin: BIN, cardLast4: "1234", installments: 3 };
      const requests: CardPaymentRequest[] = [];
      const declining: PaymentProvider = {
        id: "deneme",
        cardProgram: async () => "Bonus",
        pay: async (request) => {
          requests.push(request);
          return { ok: false, error: "Kart limiti yetersiz." };
        },
      };
      expect(await placeOrder(db, memberA, order({ payment: card, expectedTotal: 2783 }), at, data, declining)).toEqual({
        ok: false,
        status: 402,
        error: "Kart limiti yetersiz.",
      });
      expect(requests).toMatchObject([{ amount: 2783, installments: 3, pos: { id: "pos-1" }, card: { bin: BIN, last4: "1234" } }]);
      expect((await client.query("SELECT count(*)::int AS n FROM orders")).rows[0].n).toBe(0);
      expect((await client.query("SELECT count(*)::int AS n FROM payment_transactions")).rows[0].n).toBe(0);
      expect((await client.query("SELECT count(*)::int AS n FROM record_counters")).rows[0].n).toBe(0);

      // Saglayici kartin programini bilmiyorsa yalnizca varsayilan POS'tan tek cekim: 3 taksit alinmaz.
      const unknown: PaymentProvider = { ...TEMSILI_ODEME, cardProgram: async () => undefined };
      expect(await placeOrder(db, memberA, order({ payment: card, expectedTotal: 2783 }), at, data, unknown)).toMatchObject({
        ok: false,
        error: tr.checkout.invalidInstallment,
      });
    });
  });

  it("fiyat değiştiyse, stok bittiyse, ürün satıştan kalktıysa ya da bilgi eksikse sipariş alınmaz", async () => {
    await withShop(async (db, client, data) => {
      const at = new Date();
      const refused = async (input: Record<string, unknown>, pricingData = data) => {
        const result = await placeOrder(db, memberA, order(input), at, pricingData);
        return result.ok ? "alındı" : result.error;
      };
      expect(await refused({ expectedTotal: 2500 })).toBe(
        `Fiyatlar güncellendi; ödenecek tutar artık ${formatPrice(2650)}. Sepetinizi kontrol edip yeniden deneyin.`,
      );
      expect(await refused({ lines: [{ productId: "p2", quantity: 1 }], expectedTotal: 1450 })).toMatch(/stokta olmayan/);
      expect(await refused({ lines: [{ productId: "yok", quantity: 1 }] })).toMatch(/Sepetinizdeki bazı ürünler/);
      expect(await refused({ lines: [] })).toMatch(/Sepetinizdeki bazı ürünler/);
      expect(await refused({ invoice: { ...individual, tcKimlikNo: "12345678901" } })).toBe("Geçerli bir T.C. kimlik numarası girin.");
      expect(await refused({ invoice: { type: "corporate", companyName: "Firma", taxOffice: "Konya", taxNumber: "123", address } })).toBe(
        "Vergi numarası 10 haneli olmalıdır.",
      );
      expect(await refused({ shippingAddress: { ...address, district: " " } })).toBe("Lütfen zorunlu alanları doldurun.");
      expect(await refused({ termsAccepted: false })).toMatch(/Ön Bilgilendirme Formu/);
      expect(await refused({ payment: { method: "card", cardBin: BIN, cardLast4: "1234", installments: 6 } })).toMatch(
        /taksit artık sunulmuyor/,
      );
      expect(await refused({ payment: { method: "card", cardBin: "4400", cardLast4: "1234", installments: 1 } })).toBe("Kart numarası geçersiz.");
      expect(await refused({ payment: { method: "card", cardBin: BIN, cardLast4: "1234", installments: 1 } }, { ...data, shop: { ...data.shop, pos: [] } })).toMatch(
        /Bu kartla şu an ödeme alınamıyor/,
      );
      // Urun yayindan kalkti.
      await client.query("UPDATE products SET active = false WHERE id = 'p1'");
      const fresh = { ...data, catalog: { ...(await readCatalog(db)), warehouseStock: data.catalog.warehouseStock } };
      expect(await refused({}, fresh)).toMatch(/Sepetinizdeki bazı ürünler/);
      expect((await client.query("SELECT count(*)::int AS n FROM orders")).rows[0].n).toBe(0);
    });
  });

  it("havale: ödeme bekleniyor; süre dolunca sipariş okunurken iptal edilir ve kupon hakkı geri verilir", async () => {
    await withShop(async (db, client, data) => {
      await coupon(client, "INDIRIM100");
      const at = new Date("2026-03-16T12:00:00+03:00");
      const result = await placeOrder(db, memberA, order({ couponCode: " indirim100 ", expectedTotal: 2550 }), at, data);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.order).toMatchObject({
        status: "awaiting_payment",
        coupon: { code: "INDIRIM100", discount: 100 },
        total: 2550,
        payment: { method: "transfer", dueAt: "2026-03-19T09:00:00.000Z" },
        items: [{ couponDiscount: 100 }],
      });

      // Son gun Persembe 23:59 (Turkiye); Cuma 00:01'de okunurken iptal.
      expect(await cancelExpiredTransfers(db, new Date("2026-03-19T23:59:00+03:00"))).toEqual([]);
      const later = await memberOrders(db, "u-a", new Date("2026-03-20T00:01:00+03:00"));
      expect(later.orders[0]).toMatchObject({
        status: "cancelled",
        history: [{ status: "awaiting_payment" }, { status: "cancelled", note: "Ödeme süresi doldu" }],
      });
      const [redemption] = (await client.query("SELECT released_at FROM coupon_redemptions")).rows;
      expect(redemption.released_at).not.toBeNull();
      // Baska uyenin siparisleri gorunmez.
      expect((await memberOrders(db, "u-b", new Date())).orders).toEqual([]);
    });
  });

  it("sepet kuponu: üye bilinince kişiye özel kupon denetlenir; indirim payları gelen satır sırasıyla", async () => {
    await withShop(async (db, client, data) => {
      await coupon(client, "OZEL");
      await client.query("UPDATE coupons SET audience = 'customers' WHERE id = 'OZEL'");
      await client.query("INSERT INTO coupon_customers (coupon_id, email) VALUES ('OZEL', 'b@ornek.com')");
      const lines = [{ productId: "yok", quantity: 1 }, { productId: "p1", quantity: 1 }];
      const at = new Date();
      expect(await checkCartCoupon(db, data.catalog, { code: "ozel", lines }, null, at)).toEqual({
        ok: true,
        couponId: "OZEL",
        code: "OZEL",
        discount: 100,
        lineDiscounts: [0, 100],
        personal: true,
      });
      expect(await checkCartCoupon(db, data.catalog, { code: "OZEL", lines }, memberA, at)).toEqual({ ok: false, problem: "notForYou" });
      expect(await checkCartCoupon(db, data.catalog, { code: "YOK", lines }, memberA, at)).toEqual({ ok: false, problem: "invalid" });
      // Siparis aninda da: kupon uygulanamazsa siparis alinmaz, nedeni doner.
      const refused = await placeOrder(db, memberA, order({ couponCode: "OZEL", expectedTotal: 2550 }), at, data);
      expect(refused).toMatchObject({ ok: false, status: 409, coupon: { ok: false, problem: "notForYou" } });
    });
  });
});

describe("iade talebi", () => {
  it("teslim edilen siparişte bireysel üye açar; açık talep varken, kurumsal üyede ya da başkasının siparişinde açılmaz", async () => {
    await withShop(async (db, client, data) => {
      const at = new Date();
      const placed = await placeOrder(db, memberA, order(), at, data);
      if (!placed.ok) throw new Error(placed.error);
      const code = placed.order.code;
      const items = [{ line: 0, quantity: 1 }];
      const request = (member: Member, input: Record<string, unknown> = {}) =>
        createReturnRequest(db, member, { orderCode: code, items, reason: "changed_mind", ...input }, at);

      expect(await request(memberA)).toMatchObject({ ok: false, status: 409 });
      await client.query("UPDATE orders SET status = 'delivered' WHERE code = $1", [code]);
      await client.query(
        "INSERT INTO order_status_history (order_id, seq, status, at) SELECT id, 1, 'delivered', $2 FROM orders WHERE code = $1",
        [code, at],
      );
      expect(await request(memberB)).toMatchObject({ ok: false, status: 404, error: "Sipariş bulunamadı." });
      expect(await request({ ...memberA, role: "business" })).toMatchObject({ ok: false, status: 409 });
      expect(await request(memberA, { items: [{ line: 0, quantity: 3 }] })).toMatchObject({ ok: false, status: 400 });
      expect(await request(memberA, { items: [] })).toMatchObject({ error: "İade edilecek en az bir ürün seçin." });

      const created = await request(memberA, { note: " Kutusu açılmadı " });
      expect(created.ok).toBe(true);
      if (!created.ok) return;
      expect(created.request).toMatchObject({
        code: expect.stringMatching(new RegExp(`^${returnCodePrefix(at)}\\d{4}$`)),
        orderCode: code,
        userId: "u-a",
        status: "new",
        reason: "changed_mind",
        note: "Kutusu açılmadı",
        items: [{ line: 0, productId: "p1", quantity: 1 }],
      });
      // Acik talep varken ikinci talep acilmaz.
      expect(await request(memberA)).toMatchObject({ ok: false, status: 409 });
      expect((await memberOrders(db, "u-a", at)).returnRequests).toHaveLength(1);
    });
  });
});

describe("aynı anda gelen siparişler", () => {
  it("kuponun kullanım sınırı aşılmaz: ikinci sipariş birincinin bitmesini bekler", async () => {
    const pool = new Pool({ connectionString: testDatabaseUrl(), max: 2 });
    const [a, b] = [await pool.connect(), await pool.connect()];
    const p = `es${Date.now()}-`;
    const lines = [{ productId: `${p}p1`, quantity: 2 }];
    const at = new Date();
    try {
      await fixtures(a, p);
      await a.query(
        `INSERT INTO coupons (id, code, discount_type, discount_value, total_usage_limit) VALUES ($1, $2, 'amount', 100, 1)`,
        [`${p}kupon`, `${p}TEK`.toUpperCase()],
      );
      const data = await pricing(drizzle(a, { schema }), p);
      const input = order({ lines, couponCode: `${p}TEK`, expectedTotal: 2550 });
      const member = { ...memberA, id: `${p}u-a`, email: `${p}a@ornek.com` };

      await a.query("BEGIN");
      const first = await placeOrder(drizzle(a, { schema }), member, input, at, data);
      await b.query("BEGIN");
      let done = false;
      const second = placeOrder(drizzle(b, { schema }), member, input, at, data).then((r) => ((done = true), r));
      await new Promise((resolve) => setTimeout(resolve, 300));
      expect(done).toBe(false);
      await a.query("COMMIT");
      const result = await second;
      await b.query("COMMIT");
      expect(first.ok).toBe(true);
      expect(result).toMatchObject({ ok: false, status: 409, coupon: { problem: "exhausted" } });
    } finally {
      await a.query("ROLLBACK").catch(() => {});
      await b.query("ROLLBACK").catch(() => {});
      await a.query("DELETE FROM coupon_redemptions WHERE coupon_id = $1", [`${p}kupon`]);
      await a.query("DELETE FROM orders WHERE user_id = $1", [`${p}u-a`]);
      await a.query("DELETE FROM coupons WHERE id = $1", [`${p}kupon`]);
      await a.query("DELETE FROM products WHERE id LIKE $1", [`${p}%`]);
      await a.query("DELETE FROM categories WHERE id LIKE $1", [`${p}%`]);
      await a.query("DELETE FROM category_groups WHERE id LIKE $1", [`${p}%`]);
      await a.query("DELETE FROM users WHERE id LIKE $1", [`${p}%`]);
      await a.query("DELETE FROM payment_pos WHERE id LIKE $1", [`${p}%`]);
      await a.query("DELETE FROM record_counters WHERE prefix = $1", [orderCodePrefix(at)]);
      a.release();
      b.release();
      await pool.end();
    }
  });
});
