import { randomBytes } from "node:crypto";
import { and, eq, isNull, lt, max } from "drizzle-orm";
import type { NodePgQueryResultHKT } from "drizzle-orm/node-postgres";
import type { PgDatabase } from "drizzle-orm/pg-core";
import {
  canRequestReturn,
  cardBrand,
  cardInstallments,
  cardProgram,
  cartTotals,
  couponCartLines,
  couponView,
  defaultSettings,
  evaluateCoupon,
  installmentQuote,
  isTransferExpired,
  isValidTaxNumber,
  isValidTcKimlikNo,
  normalizeCouponCode,
  ORDER_CODE_DIGITS,
  orderCodePrefix,
  orderItemsFromLines,
  PAYMENT_EXPIRED_NOTE,
  posCommission,
  priceCartLines,
  RETURN_CODE_DIGITS,
  returnableQuantities,
  returnCodePrefix,
  type CartCatalog,
  type CartStoredLine,
  type CouponResult,
  type CouponView,
  type Order,
  type OrderAddress,
  type OrderInvoice,
  type OrderPayment,
  type PricedCartLine,
  type ReturnReason,
  type ReturnRequest,
  type ShopSettings,
  type User,
} from "@zenweld/data";
import { tr } from "@zenweld/i18n";
import { formatPrice } from "@zenweld/utils";
import { nextRecordCode } from "./codes";
import { readCatalog, readCoupons, readOrders, readReturnRequests, readSettings, readWarehouseStock } from "./read";
import * as s from "./schema";

/**
 * SIPARISLER SUNUCUDA (veritabani modu; Asama 5.2, KARARLAR K-97)
 *
 * Tarayici yalnizca sepetteki urun, secenek ve adedi, kupon kodunu, adres ve
 * fatura bilgisini, odeme yontemini ve taksit sayisini gonderir. Kart
 * numarasinin tamami gelmez: yalnizca ilk 6 hane (kart programi ve taksit)
 * ve son 4 hane.
 *
 * - Tutar sunucuda, veritabanindaki guncel urun, ayar ve POS bilgisiyle,
 *   sepetle ayni kurallardan (packages/data › cart.ts, checkout.ts,
 *   coupon.ts) yeniden hesaplanir. Musterinin gordugu tutar tutmazsa
 *   siparis alinmaz ve yeni tutar soylenir.
 * - Stok (Zenweld deposu) ve kupon yeniden denetlenir. Kupon satiri
 *   kilitlenir: ayni anda gelen iki siparis kullanim sinirini asamaz.
 * - Kartli odeme gercek POS baglanana kadar temsilidir: siparis odenmis
 *   sayilir ve "Hazirlaniyor" olarak kaydedilir.
 * - Odeme suresi dolan havale siparisi, siparisler okunurken iptal edilir
 *   ve kupon hakki geri verilir.
 *
 * Yazan fonksiyonlar bir islem (transaction) icinde cagrilir.
 */

export type OrderDb = PgDatabase<NodePgQueryResultHKT, typeof s>;

/** Siparisi veren uye (oturumdan; tarayicidan gelen kimlik kullanilmaz). */
export type Member = Pick<User, "id" | "role" | "email" | "firstName" | "lastName" | "phone">;

export interface OrderFailure {
  ok: false;
  status: 400 | 404 | 409;
  error: string;
  /** Kupon uygulanamadiysa nedeni (metni site yazar) */
  coupon?: CouponView;
}

/** Fiyat hesabinin verisi: katalog, depo stogu ve magaza ayarlari. */
export interface PricingData {
  catalog: CartCatalog;
  shop: ShopSettings;
}

const fail = (status: OrderFailure["status"], error: string, extra: Partial<OrderFailure> = {}): OrderFailure => ({
  ok: false,
  status,
  error,
  ...extra,
});
const text = (value: unknown, maxLength = 200) => (typeof value === "string" ? value.trim().slice(0, maxLength) : "");
const record = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
const newId = (prefix: string) => `${prefix}-${randomBytes(8).toString("hex")}`;
const MAX_LINES = 100;

/** Veritabanindan fiyat hesabinin verisi (onbelleksiz: siparis her zaman guncel veriyle). */
export async function readPricingData(db: OrderDb): Promise<PricingData> {
  const catalog = await readCatalog(db);
  const warehouseStock = await readWarehouseStock(db);
  const settings = await readSettings(db);
  return { catalog: { ...catalog, warehouseStock }, shop: { ...defaultSettings.shop, ...(settings.shop ?? {}) } };
}

/** Tarayicidan gelen sepet satirlari; bicim bozuksa null. */
export function parseCartLines(input: unknown): CartStoredLine[] | null {
  if (!Array.isArray(input) || input.length > MAX_LINES) return null;
  const lines: CartStoredLine[] = [];
  for (const item of input) {
    const line = record(item);
    if (typeof line.productId !== "string" || typeof line.quantity !== "number" || !Number.isFinite(line.quantity)) return null;
    lines.push({
      productId: line.productId,
      variantId: typeof line.variantId === "string" && line.variantId ? line.variantId : undefined,
      quantity: line.quantity,
    });
  }
  return lines;
}

/** Her satirin fiyati, gelen sirayla; satilamayan satir null. */
const priceEach = (lines: CartStoredLine[], catalog: CartCatalog, at: Date): (PricedCartLine | null)[] =>
  lines.map((line) => priceCartLines([line], catalog, at)[0] ?? null);

async function evaluate(
  db: OrderDb,
  code: string,
  lines: PricedCartLine[],
  member: Member | null,
  at: Date,
  lock: boolean,
): Promise<CouponResult> {
  // Kilit: ayni kuponla ayni anda verilen siparisler sirayla sayilir.
  if (lock) await db.select({ id: s.coupons.id }).from(s.coupons).where(eq(s.coupons.code, code)).for("update");
  const { coupons, couponRedemptions } = await readCoupons(db, eq(s.coupons.code, code));
  return evaluateCoupon(coupons[0], couponCartLines(lines), {
    redemptions: couponRedemptions,
    userId: member?.id,
    userEmail: member?.email,
    at,
  });
}

/**
 * Sepete yazilan kuponu degerlendirir (sepet ve odeme sayfasi). Uye
 * bilinmiyorsa kisiye ozel kupon ve kisi basi sinir denetlenmez (odemede
 * denetlenir). Indirim paylari gelen satirlarin sirasiyla doner.
 */
export async function checkCartCoupon(
  db: OrderDb,
  catalog: CartCatalog,
  input: Record<string, unknown>,
  member: Member | null,
  at: Date,
): Promise<CouponView> {
  const code = normalizeCouponCode(text(input.code, 64));
  const lines = parseCartLines(input.lines);
  if (!code || !lines) return { ok: false, problem: "invalid" };
  const priced = priceEach(lines, catalog, at);
  const result = couponView(await evaluate(db, code, priced.filter((l) => l !== null), member, at, false));
  if (!result.ok) return result;
  let k = 0;
  return { ...result, lineDiscounts: priced.map((l) => (l ? result.lineDiscounts[k++] : 0)) };
}

function parseAddress(input: unknown): OrderAddress | null {
  const a = record(input);
  const address = {
    fullName: text(a.fullName),
    phone: text(a.phone, 40),
    city: text(a.city, 80),
    district: text(a.district, 80),
    line: text(a.line, 500),
  };
  return Object.values(address).every(Boolean) ? address : null;
}

function parseInvoice(input: unknown): OrderInvoice | string {
  const i = record(input);
  const address = parseAddress(i.address);
  if (!address) return tr.checkout.required;
  if (i.type === "corporate") {
    const invoice = {
      type: "corporate" as const,
      companyName: text(i.companyName),
      taxOffice: text(i.taxOffice, 120),
      taxNumber: text(i.taxNumber, 10),
      address,
    };
    if (!invoice.companyName || !invoice.taxOffice) return tr.checkout.required;
    return isValidTaxNumber(invoice.taxNumber) ? invoice : tr.checkout.invalidTax;
  }
  const invoice = { type: "individual" as const, fullName: text(i.fullName), tcKimlikNo: text(i.tcKimlikNo, 11), address };
  if (!invoice.fullName) return tr.checkout.required;
  return isValidTcKimlikNo(invoice.tcKimlikNo) ? invoice : tr.checkout.invalidTc;
}


/**
 * Uyenin siparisi. Basarili olursa kaydedilen siparis doner; tutar tutmazsa,
 * stok bittiyse, kupon artik uygulanamiyorsa ya da bilgi eksikse siparis
 * alinmaz.
 */
export async function placeOrder(
  db: OrderDb,
  member: Member,
  input: Record<string, unknown>,
  at: Date,
  { catalog, shop }: PricingData,
): Promise<{ ok: true; order: Order } | OrderFailure> {
  const stored = parseCartLines(input.lines);
  if (!stored || stored.length === 0) return fail(400, tr.checkout.cartChanged);
  const priced = priceEach(stored, catalog, at);
  if (priced.some((l) => l === null)) return fail(409, tr.checkout.cartChanged);
  const lines = priced as PricedCartLine[];
  if (lines.some((l) => !l.inStock)) return fail(409, tr.cart.outOfStockBlock);

  const shippingAddress = parseAddress(input.shippingAddress);
  if (!shippingAddress) return fail(400, tr.checkout.required);
  const invoice = parseInvoice(input.invoice);
  if (typeof invoice === "string") return fail(400, invoice);
  if (input.termsAccepted !== true) return fail(400, tr.checkout.consentRequired);

  const pay = record(input.payment);
  const method = pay.method === "card" ? "card" : pay.method === "transfer" ? "transfer" : null;
  if (!method) return fail(400, tr.checkout.required);
  const bin = text(pay.cardBin, 6);
  const last4 = text(pay.cardLast4, 4);
  const installments = Number(pay.installments ?? 1);
  if (method === "card" && (!/^\d{6}$/.test(bin) || !/^\d{4}$/.test(last4) || !Number.isInteger(installments))) {
    return fail(400, tr.checkout.invalidCard);
  }

  const code = normalizeCouponCode(text(input.couponCode, 64));
  let coupon: Extract<CouponResult, { ok: true }> | undefined;
  if (code) {
    const result = await evaluate(db, code, lines, member, at, true);
    if (!result.ok) return fail(409, tr.cart.couponBlock, { coupon: couponView(result) });
    coupon = result;
  }
  const totals = cartTotals({ lines, lineDiscounts: coupon?.lineDiscounts }, shop);

  let payment: OrderPayment;
  let fee = 0;
  if (method === "card") {
    const program = cardProgram(bin);
    const { pos, options } = cardInstallments(totals.total, program, shop);
    if (!pos) return fail(409, tr.checkout.noPos);
    const option = options.find((o) => o.count === installments);
    if (!option) return fail(409, tr.checkout.invalidInstallment);
    fee = installmentQuote(totals.total, option).fee;
    payment = {
      method,
      installments: option.count,
      cardBrand: cardBrand(bin),
      cardProgram: program,
      cardLast4: last4,
      posId: pos.id,
      posName: pos.name,
      commissionPercent: posCommission(pos, option.count),
      // Gercek POS baglanana kadar odeme temsilidir (K-97).
      paidAt: at.toISOString(),
    };
  } else {
    payment = { method, dueAt: new Date(at.getTime() + shop.transferDueDays * 86_400_000).toISOString() };
  }
  const total = totals.total + fee;
  const expected = Number(input.expectedTotal);
  if (!Number.isFinite(expected) || Math.abs(expected - total) > 0.005) {
    return fail(409, tr.checkout.priceChanged.replace("{amount}", formatPrice(total)));
  }

  const status = method === "card" ? "preparing" : "awaiting_payment";
  const id = newId("o");
  const orderCode = await nextRecordCode(db, s.orders, orderCodePrefix(at), ORDER_CODE_DIGITS);
  const items = orderItemsFromLines(lines, coupon?.lineDiscounts);
  await db.insert(s.orders).values({
    id,
    code: orderCode,
    userId: member.id,
    status,
    customerName: `${member.firstName} ${member.lastName}`.trim(),
    email: member.email,
    phone: shippingAddress.phone || member.phone,
    shippingAddress,
    invoice,
    subtotal: totals.subtotal,
    vat: totals.vat,
    shipping: totals.shipping,
    installmentFee: fee,
    couponCode: coupon?.coupon.code,
    couponDiscount: coupon?.discount ?? 0,
    total,
    paymentMethod: method,
    installments: payment.installments,
    cardBrand: payment.cardBrand,
    cardProgram: payment.cardProgram,
    cardLast4: payment.cardLast4,
    posId: payment.posId,
    posName: payment.posName,
    commissionPercent: payment.commissionPercent,
    paidAt: payment.paidAt ? at : null,
    dueAt: payment.dueAt ? new Date(payment.dueAt) : null,
    customerNote: text(input.customerNote, 2000) || null,
    termsAcceptedAt: at,
    createdAt: at,
    updatedAt: at,
  });
  await db.insert(s.orderItems).values(
    items.map((item, line) => ({
      orderId: id,
      line,
      productId: item.productId,
      variantId: lines[line].variantId ?? null,
      productName: item.productName,
      sku: item.sku,
      variantLabel: item.variantLabel ?? null,
      quantity: item.quantity,
      unitPriceExVat: item.unitPriceExVat,
      vatRate: item.vatRate,
      unitPrice: item.unitPrice,
      couponDiscount: item.couponDiscount ?? 0,
    })),
  );
  await db.insert(s.orderStatusHistory).values({ orderId: id, seq: 0, status, at });
  if (coupon) {
    await db.insert(s.couponRedemptions).values({
      couponId: coupon.coupon.id,
      couponCode: coupon.coupon.code,
      userId: member.id,
      orderId: id,
      discountAmount: coupon.discount,
      createdAt: at,
    });
  }
  const [order] = await readOrders(db, eq(s.orders.id, id));
  return { ok: true, order };
}

/**
 * Odeme suresi dolan havale siparislerini iptal eder (uye verilirse
 * yalnizca onunkileri): durum "Iptal Edildi", nota "Odeme suresi doldu",
 * kupon kullanimi geri sayilir. Iptal edilen siparislerin kimlikleri doner.
 */
export async function cancelExpiredTransfers(db: OrderDb, at: Date, userId?: string): Promise<string[]> {
  const candidates = await db
    .select({ id: s.orders.id, status: s.orders.status, dueAt: s.orders.dueAt })
    .from(s.orders)
    .where(
      and(
        eq(s.orders.status, "awaiting_payment"),
        lt(s.orders.dueAt, at),
        userId ? eq(s.orders.userId, userId) : undefined,
      ),
    )
    .for("update");
  const expired = candidates.filter((o) =>
    isTransferExpired({ status: "awaiting_payment", payment: { method: "transfer", dueAt: o.dueAt?.toISOString() } }, at),
  );
  for (const { id } of expired) {
    const [{ last }] = await db
      .select({ last: max(s.orderStatusHistory.seq) })
      .from(s.orderStatusHistory)
      .where(eq(s.orderStatusHistory.orderId, id));
    await db.update(s.orders).set({ status: "cancelled", updatedAt: at }).where(eq(s.orders.id, id));
    await db
      .insert(s.orderStatusHistory)
      .values({ orderId: id, seq: (last ?? -1) + 1, status: "cancelled", at, note: PAYMENT_EXPIRED_NOTE });
    await db
      .update(s.couponRedemptions)
      .set({ releasedAt: at })
      .where(and(eq(s.couponRedemptions.orderId, id), isNull(s.couponRedemptions.releasedAt)));
  }
  return expired.map((o) => o.id);
}

/** Uyenin siparisleri ve iade talepleri (once suresi dolan havaleler iptal edilir). */
export async function memberOrders(
  db: OrderDb,
  userId: string,
  at: Date,
): Promise<{ orders: Order[]; returnRequests: ReturnRequest[] }> {
  await cancelExpiredTransfers(db, at, userId);
  return {
    orders: await readOrders(db, eq(s.orders.userId, userId)),
    returnRequests: await readReturnRequests(db, eq(s.returnRequests.userId, userId)),
  };
}

const RETURN_REASONS: ReturnReason[] = ["changed_mind", "defective", "wrong_item", "other"];

/**
 * Iade (cayma) talebi (IS-KURALLARI › Iade): uyenin kendi siparisi, bireysel
 * uye, teslimden itibaren 14 gun, acik talep yok, adetler iade edilebilecek
 * adedi asmiyor. Kurallar packages/data/src/returns.ts'tedir; siparis
 * satiri kilitlenir, ayni anda iki talep acilamaz.
 */
export async function createReturnRequest(
  db: OrderDb,
  member: Member,
  input: Record<string, unknown>,
  at: Date,
): Promise<{ ok: true; request: ReturnRequest; order: Order } | OrderFailure> {
  const orderCode = text(input.orderCode, 40);
  const [row] = orderCode
    ? await db
        .select({ id: s.orders.id })
        .from(s.orders)
        .where(and(eq(s.orders.code, orderCode), eq(s.orders.userId, member.id)))
        .for("update")
    : [];
  if (!row) return fail(404, tr.orders.notFound);
  const [order] = await readOrders(db, eq(s.orders.id, row.id));
  const requests = await readReturnRequests(db, eq(s.returnRequests.orderId, order.id));
  if (!canRequestReturn(order, member.role, requests, at)) return fail(409, tr.returns.failed);

  const reason = RETURN_REASONS.find((r) => r === input.reason);
  if (!reason) return fail(400, tr.returns.failed);
  const left = returnableQuantities(order, requests);
  const wanted = Array.isArray(input.items) ? input.items.map(record) : [];
  const lines = new Set<number>();
  const items: ReturnRequest["items"] = [];
  for (const w of wanted) {
    const line = Number(w.line);
    const quantity = Number(w.quantity);
    if (!Number.isInteger(line) || lines.has(line) || !order.items[line]) return fail(400, tr.returns.failed);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > (left[line] ?? 0)) return fail(400, tr.returns.failed);
    lines.add(line);
    const item = order.items[line];
    items.push({
      line,
      productId: item.productId,
      productName: item.productName,
      sku: item.sku,
      variantLabel: item.variantLabel,
      quantity,
    });
  }
  if (items.length === 0) return fail(400, tr.returns.noItems);

  const id = newId("iad");
  const code = await nextRecordCode(db, s.returnRequests, returnCodePrefix(at), RETURN_CODE_DIGITS);
  const note = text(input.note, 2000) || undefined;
  await db.insert(s.returnRequests).values({
    id,
    code,
    orderId: order.id,
    orderCode: order.code,
    userId: member.id,
    customerName: order.customerName,
    email: order.email,
    phone: order.phone,
    reason,
    note: note ?? null,
    status: "new",
    createdAt: at,
    updatedAt: at,
  });
  await db.insert(s.returnRequestItems).values(
    items.map((item) => ({
      returnRequestId: id,
      orderLine: item.line,
      // Silinmis urunde bag bos kalir; ad ve kod kopyasi durur.
      productId: item.productId || null,
      productName: item.productName,
      sku: item.sku,
      variantLabel: item.variantLabel ?? null,
      quantity: item.quantity,
    })),
  );
  const [request] = await readReturnRequests(db, eq(s.returnRequests.id, id));
  return { ok: true, request, order };
}
