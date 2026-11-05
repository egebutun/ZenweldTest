import { and, eq, inArray, isNull, max, ne, sql } from "drizzle-orm";
import {
  couponCodeTaken,
  isTransferExpired,
  normalizeCouponDraft,
  PAYMENT_EXPIRED_NOTE,
  validateCoupon,
  type Coupon,
  type CouponDraft,
  type Order,
  type OrderStatus,
  type ReturnRequest,
  type ReturnRequestStatus,
  type SiteSettings,
  type User,
  type CouponRedemption,
} from "@zenweld/data";
import { tr } from "@zenweld/i18n";
import { changedFields, writeAudit, type Actor, type AuditDb } from "./audit";
import { cancelExpiredTransfers } from "./orders";
import { checkRow, fail, isFailure, newId, saved, text, unchanged, type PanelFailure, type PanelResult, type Saved } from "./panel";
import { readCoupons, readOrders, readReturnRequests, readSettings, userRecord } from "./read";
import * as s from "./schema";

/**
 * PANEL › SATIS SUNUCUDA (veritabani modu; Asama 5, 1. alan; KARARLAR K-99)
 *
 * Siparisler, iade talepleri ve kuponlar ekranlari veriyi buradan okur ve
 * degisiklikleri buraya yazar. Kurallar demo modundaki panelle aynidir
 * (packages/store › commerce.ts, returns.ts, coupons.ts; packages/data).
 *
 * Her yazma panel.ts'teki ortak kurallarla yapilir: islem icinde, kayit
 * kilitlenerek, ekran acildiktan sonra degismis kayit kaydedilmeden ve
 * audit_log'a yazilarak.
 */

const iso = (value: Date | null | undefined) => (value ? value.toISOString() : undefined);

/* ------------------------------ Okuma ------------------------------ */

/*
 * Her panel sayfasi kendi verisini her acilista ve her kayittan sonra okur
 * (sayfanin sunucu bileseni; apps/zenweld-web/src/app/yonetim/(panel)).
 */

/**
 * Siparisler (liste) ya da tek siparis (detay) ve magaza ayarlari (kargo
 * firmalari). Once odeme suresi dolan havaleler iptal edilir; bu yuzden bir
 * islem (transaction) icinde cagrilir.
 */
export async function readOrdersPanel(
  db: AuditDb,
  at: Date,
  id?: string,
): Promise<{ orders: Order[]; settings: SiteSettings }> {
  await cancelExpiredTransfers(db, at);
  const orders = await readOrders(db, id === undefined ? undefined : eq(s.orders.id, id));
  const settings = await readSettings(db);
  return { orders, settings };
}

export async function readReturnsPanel(db: AuditDb): Promise<{ returnRequests: ReturnRequest[] }> {
  return { returnRequests: await readReturnRequests(db) };
}

/** Uyeler (kisiye ozel kuponun e-posta listesi); sifre ozeti gonderilmez. */
export async function readPanelMembers(db: AuditDb): Promise<User[]> {
  const rows = await db.select().from(s.users).where(ne(s.users.role, "admin")).orderBy(s.users.email);
  return rows.map((u) => ({ ...userRecord(u), passwordHash: "" }));
}

/**
 * Kuponlar ve kullanimlari (liste). id verilirse yalnizca o kupon, kullanildigi
 * siparisler ve uyeler (duzenleme ekrani).
 */
export async function readCouponsPanel(
  db: AuditDb,
  id?: string,
): Promise<{ coupons: Coupon[]; couponRedemptions: CouponRedemption[]; orders?: Order[]; users?: User[] }> {
  if (id === undefined) return readCoupons(db);
  const { coupons, couponRedemptions } = await readCoupons(db, eq(s.coupons.id, id));
  const orderIds = [...new Set(couponRedemptions.map((r) => r.orderId))];
  const orders = orderIds.length ? await readOrders(db, inArray(s.orders.id, orderIds)) : [];
  return { coupons, couponRedemptions, orders, users: await readPanelMembers(db) };
}

/* ------------------------------ Siparisler ------------------------------ */

type OrderRow = typeof s.orders.$inferSelect;

async function lockOrder(db: AuditDb, input: Record<string, unknown>): Promise<OrderRow | PanelFailure> {
  const id = text(input.id, 100);
  const [row] = id ? await db.select().from(s.orders).where(eq(s.orders.id, id)).for("update") : [];
  return checkRow(row, input, tr.panel.orderNotFound, tr.panel.staleRecord);
}

/** Siparisin zaman cizelgesine yeni durum (yonetici changed_by'a yazilir). */
async function pushStatus(db: AuditDb, order: OrderRow, status: OrderStatus, at: Date, actor: Actor, note?: string) {
  const [{ last }] = await db
    .select({ last: max(s.orderStatusHistory.seq) })
    .from(s.orderStatusHistory)
    .where(eq(s.orderStatusHistory.orderId, order.id));
  await db
    .insert(s.orderStatusHistory)
    .values({ orderId: order.id, seq: (last ?? -1) + 1, status, at, note: note ?? null, changedBy: actor.id });
}

/** Siparis iptal edildi: kupon kullanimi geri sayilir. */
const releaseCoupon = (db: AuditDb, orderId: string, at: Date) =>
  db
    .update(s.couponRedemptions)
    .set({ releasedAt: at })
    .where(and(eq(s.couponRedemptions.orderId, orderId), isNull(s.couponRedemptions.releasedAt)));

const auditOrder = (db: AuditDb, actor: Actor, order: OrderRow, changes: Record<string, unknown>, at: Date) =>
  writeAudit(db, actor, { action: "update", entityType: "orders", entityId: order.id, entityLabel: order.code, changes }, at);

/**
 * Havale/EFT odemesi hesaba gecti: siparis hazirlanmaya baslar. Odeme suresi
 * dolmus siparis onaylanmaz, iptal edilir ve kupon hakki geri verilir
 * (expired: true).
 */
export async function adminMarkOrderPaid(
  db: AuditDb,
  actor: Actor,
  input: Record<string, unknown>,
  at: Date,
): Promise<PanelResult<{ expired: boolean } & Saved>> {
  const order = await lockOrder(db, input);
  if (isFailure(order)) return order;
  if (order.status !== "awaiting_payment") return fail(409, tr.panel.wrongState);

  const payment = { method: order.paymentMethod as Order["payment"]["method"], dueAt: iso(order.dueAt) };
  if (isTransferExpired({ status: "awaiting_payment", payment }, at)) {
    await db.update(s.orders).set({ status: "cancelled", updatedAt: at }).where(eq(s.orders.id, order.id));
    await pushStatus(db, order, "cancelled", at, actor, PAYMENT_EXPIRED_NOTE);
    await releaseCoupon(db, order.id, at);
    await auditOrder(db, actor, order, { status: [order.status, "cancelled"] }, at);
    return { ...saved(at), expired: true };
  }
  await db.update(s.orders).set({ status: "preparing", paidAt: at, updatedAt: at }).where(eq(s.orders.id, order.id));
  await pushStatus(db, order, "preparing", at, actor);
  await auditOrder(db, actor, order, { status: [order.status, "preparing"], paidAt: [null, at.toISOString()] }, at);
  return { ...saved(at), expired: false };
}

/**
 * Kargoya verildi (Hazirlaniyor -> Kargoda) ya da kargodaki siparisin firma
 * ve takip numarasi duzeltildi. Firma magaza ayarlarindaki listeden olmali;
 * listeden sonradan cikarilmis kayitli firma korunabilir. Gonderi tarihi
 * duzeltmede degismez.
 */
export async function adminShipOrder(
  db: AuditDb,
  actor: Actor,
  input: Record<string, unknown>,
  at: Date,
): Promise<PanelResult<Saved>> {
  const carrier = text(input.carrier, 100);
  const trackingNumber = text(input.trackingNumber, 100);
  if (!carrier || !trackingNumber) return fail(400, tr.panel.shipmentRequired);
  const order = await lockOrder(db, input);
  if (isFailure(order)) return order;
  if (order.status !== "preparing" && order.status !== "shipped") return fail(409, tr.panel.wrongState);

  const [shipment] = await db
    .select()
    .from(s.shipments)
    .where(and(eq(s.shipments.orderId, order.id), eq(s.shipments.kind, "outbound")));
  const [known] = await db.select({ id: s.carriers.id }).from(s.carriers).where(eq(s.carriers.name, carrier));
  if (!known && carrier !== shipment?.carrierName) return fail(400, tr.panel.unknownCarrier);

  const status: OrderStatus = order.status === "preparing" ? "shipped" : order.status;
  const changes = changedFields(
    { status: order.status, carrier: shipment?.carrierName, trackingNumber: shipment?.trackingNumber },
    { status, carrier, trackingNumber },
    ["status", "carrier", "trackingNumber"],
  );
  if (Object.keys(changes).length === 0) return unchanged(order);

  const carrierId = known?.id ?? null;
  if (shipment) {
    await db
      .update(s.shipments)
      .set({ carrierId, carrierName: carrier, trackingNumber, updatedAt: at })
      .where(eq(s.shipments.id, shipment.id));
  } else {
    await db.insert(s.shipments).values({
      id: newId("shp"),
      orderId: order.id,
      kind: "outbound",
      carrierId,
      carrierName: carrier,
      trackingNumber,
      shippedAt: at,
      createdAt: at,
      updatedAt: at,
    });
  }
  await db.update(s.orders).set({ status, updatedAt: at }).where(eq(s.orders.id, order.id));
  if (status !== order.status) await pushStatus(db, order, status, at, actor);
  await auditOrder(db, actor, order, changes, at);
  return saved(at);
}

/** Kargodaki siparis teslim edildi. */
export async function adminMarkOrderDelivered(
  db: AuditDb,
  actor: Actor,
  input: Record<string, unknown>,
  at: Date,
): Promise<PanelResult<Saved>> {
  const order = await lockOrder(db, input);
  if (isFailure(order)) return order;
  if (order.status !== "shipped") return fail(409, tr.panel.wrongState);
  await db
    .update(s.shipments)
    .set({ deliveredAt: at, updatedAt: at })
    .where(and(eq(s.shipments.orderId, order.id), eq(s.shipments.kind, "outbound")));
  await db.update(s.orders).set({ status: "delivered", updatedAt: at }).where(eq(s.orders.id, order.id));
  await pushStatus(db, order, "delivered", at, actor);
  await auditOrder(db, actor, order, { status: [order.status, "delivered"] }, at);
  return saved(at);
}

/** Teslim edilmemis siparisi iptal eder (neden musteriye gorunur); kupon hakki geri verilir. */
export async function adminCancelOrder(
  db: AuditDb,
  actor: Actor,
  input: Record<string, unknown>,
  at: Date,
): Promise<PanelResult<Saved>> {
  const note = text(input.note, 500) || undefined;
  const order = await lockOrder(db, input);
  if (isFailure(order)) return order;
  if (order.status === "delivered" || order.status === "cancelled") return fail(409, tr.panel.wrongState);
  await db.update(s.orders).set({ status: "cancelled", updatedAt: at }).where(eq(s.orders.id, order.id));
  await pushStatus(db, order, "cancelled", at, actor, note);
  await releaseCoupon(db, order.id, at);
  await auditOrder(db, actor, order, { status: [order.status, "cancelled"], ...(note ? { note: [null, note] } : {}) }, at);
  return saved(at);
}

/** Siparisin ic notu (yalnizca panelde gorunur). */
export async function adminSaveOrderNote(
  db: AuditDb,
  actor: Actor,
  input: Record<string, unknown>,
  at: Date,
): Promise<PanelResult<Saved>> {
  const adminNote = text(input.adminNote, 2000) || null;
  const order = await lockOrder(db, input);
  if (isFailure(order)) return order;
  if ((order.adminNote ?? null) === adminNote) return unchanged(order);
  await db.update(s.orders).set({ adminNote, updatedAt: at }).where(eq(s.orders.id, order.id));
  await auditOrder(db, actor, order, { adminNote: [order.adminNote, adminNote] }, at);
  return saved(at);
}

/* ------------------------------ Iade talepleri ------------------------------ */

const RETURN_STATUSES: ReturnRequestStatus[] = ["new", "reviewing", "approved", "rejected"];

/** Iade talebinin durumu ve ic notu. Para iadesi panelden yapilmaz. */
export async function adminSaveReturnRequest(
  db: AuditDb,
  actor: Actor,
  input: Record<string, unknown>,
  at: Date,
): Promise<PanelResult<Saved>> {
  const status = RETURN_STATUSES.find((x) => x === input.status);
  if (!status) return fail(400, tr.panel.invalidRequest);
  const adminNote = text(input.adminNote, 2000) || null;
  const id = text(input.id, 100);
  const [found] = id ? await db.select().from(s.returnRequests).where(eq(s.returnRequests.id, id)).for("update") : [];
  const row = checkRow(found, input, tr.panel.returnNotFound, tr.panel.staleRecord);
  if (isFailure(row)) return row;

  const changes = changedFields(row, { ...row, status, adminNote }, ["status", "adminNote"]);
  if (Object.keys(changes).length === 0) return unchanged(row);
  await db.update(s.returnRequests).set({ status, adminNote, updatedAt: at }).where(eq(s.returnRequests.id, row.id));
  await writeAudit(
    db,
    actor,
    { action: "update", entityType: "return_requests", entityId: row.id, entityLabel: row.code, changes },
    at,
  );
  return saved(at);
}

/* ------------------------------ Kuponlar ------------------------------ */

const COUPON_FIELDS = [
  "code",
  "name",
  "discountType",
  "discountValue",
  "minCartTotal",
  "startsAt",
  "endsAt",
  "totalUsageLimit",
  "perUserLimit",
  "scope",
  "productIds",
  "categoryIds",
  "audience",
  "customerEmails",
  "active",
] as const satisfies readonly (keyof CouponDraft)[];

const MAX_LIST = 1000;

/** Bos: sinir yok. Sayi olmayan deger NaN olur; validateCoupon reddeder. */
const optionalNumber = (value: unknown) =>
  value === undefined || value === null || value === "" ? undefined : typeof value === "number" ? value : NaN;
const stringList = (value: unknown) =>
  Array.isArray(value) ? value.filter((x): x is string => typeof x === "string").slice(0, MAX_LIST) : [];

/** Tarayicidan gelen kupon formu; tur ya da tarih bozuksa null. */
function parseCouponDraft(input: Record<string, unknown>): CouponDraft | null {
  const date = (value: unknown): string | undefined | null => {
    if (value === undefined || value === null || value === "") return undefined;
    const time = typeof value === "string" ? Date.parse(value) : NaN;
    return Number.isNaN(time) ? null : new Date(time).toISOString();
  };
  const startsAt = date(input.startsAt);
  const endsAt = date(input.endsAt);
  const discountType = input.discountType === "percent" || input.discountType === "amount" ? input.discountType : null;
  const scope = input.scope === "all" || input.scope === "targets" ? input.scope : null;
  const audience = input.audience === "all" || input.audience === "customers" ? input.audience : null;
  if (startsAt === null || endsAt === null || !discountType || !scope || !audience || typeof input.active !== "boolean") {
    return null;
  }
  return {
    code: text(input.code, 60),
    name: text(input.name, 200) || undefined,
    discountType,
    discountValue: optionalNumber(input.discountValue) ?? NaN,
    minCartTotal: optionalNumber(input.minCartTotal),
    startsAt,
    endsAt,
    totalUsageLimit: optionalNumber(input.totalUsageLimit),
    perUserLimit: optionalNumber(input.perUserLimit),
    scope,
    productIds: stringList(input.productIds),
    categoryIds: stringList(input.categoryIds),
    audience,
    customerEmails: stringList(input.customerEmails),
    active: input.active,
  };
}

const findCoupon = async (db: AuditDb, id: string) => (await readCoupons(db, eq(s.coupons.id, id))).coupons[0];

/** Duzenlenecek kuponu kilitler; yoksa ya da ekran acildiktan sonra degismisse hata. */
async function lockCoupon(db: AuditDb, input: Record<string, unknown>): Promise<Coupon | PanelFailure> {
  const id = text(input.id, 100);
  const [found] = id ? await db.select().from(s.coupons).where(eq(s.coupons.id, id)).for("update") : [];
  const row = checkRow(found, input, tr.panel.couponNotFound, tr.panel.staleRecord);
  return isFailure(row) ? row : findCoupon(db, row.id);
}

/**
 * Kuponu ekler (id yoksa) ya da gunceller. Bicim ve kurallar demo moduyla
 * ayni (packages/data › coupon.ts); kod baska kuponda kullanilamaz, secilen
 * urun ve kategoriler var olmali. Kullanim kayitlarina dokunulmaz.
 */
export async function adminSaveCoupon(
  db: AuditDb,
  actor: Actor,
  input: Record<string, unknown>,
  at: Date,
): Promise<PanelResult<{ id: string } & Saved>> {
  const parsed = parseCouponDraft(input);
  if (!parsed) return fail(400, tr.panel.invalidRequest);
  const draft = normalizeCouponDraft(parsed);
  const problem = validateCoupon(draft);
  if (problem) return fail(400, problem);

  const before = input.id === undefined || input.id === null ? undefined : await lockCoupon(db, input);
  if (before && isFailure(before)) return before;
  const id = before?.id ?? newId("cpn");

  // Ayni kodla ayni anda iki kayit acilamasin diye kupon kayitlari sirayla yapilir.
  await db.execute(sql`select pg_advisory_xact_lock(hashtext('coupons.code'))`);
  const [taken] = await db
    .select({ id: s.coupons.id })
    .from(s.coupons)
    .where(and(sql`upper(${s.coupons.code}) = ${draft.code}`, ne(s.coupons.id, id)));
  if (taken) return fail(409, couponCodeTaken(draft.code));

  const products = draft.productIds.length
    ? await db.select({ id: s.products.id }).from(s.products).where(inArray(s.products.id, draft.productIds))
    : [];
  const categories = draft.categoryIds.length
    ? await db.select({ id: s.categories.id }).from(s.categories).where(inArray(s.categories.id, draft.categoryIds))
    : [];
  if (products.length !== draft.productIds.length || categories.length !== draft.categoryIds.length) {
    return fail(400, tr.panel.couponTargetsMissing);
  }

  const columns = {
    code: draft.code,
    name: draft.name ?? null,
    discountType: draft.discountType,
    discountValue: draft.discountValue,
    minCartTotal: draft.minCartTotal ?? null,
    startsAt: draft.startsAt ? new Date(draft.startsAt) : null,
    endsAt: draft.endsAt ? new Date(draft.endsAt) : null,
    totalUsageLimit: draft.totalUsageLimit ?? null,
    perUserLimit: draft.perUserLimit ?? null,
    scope: draft.scope,
    audience: draft.audience,
    active: draft.active,
    updatedAt: at,
  };
  if (before) {
    await db.update(s.coupons).set(columns).where(eq(s.coupons.id, id));
    await db.delete(s.couponTargets).where(eq(s.couponTargets.couponId, id));
    await db.delete(s.couponCustomers).where(eq(s.couponCustomers.couponId, id));
  } else {
    await db.insert(s.coupons).values({ id, ...columns, createdAt: at });
  }
  const targets = [
    ...draft.productIds.map((productId) => ({ couponId: id, productId })),
    ...draft.categoryIds.map((categoryId) => ({ couponId: id, categoryId })),
  ];
  if (targets.length) await db.insert(s.couponTargets).values(targets);
  if (draft.customerEmails.length) {
    await db.insert(s.couponCustomers).values(draft.customerEmails.map((email) => ({ couponId: id, email })));
  }

  const changes = before
    ? changedFields(before, { ...before, ...draft }, COUPON_FIELDS)
    : Object.fromEntries(COUPON_FIELDS.map((key) => [key, draft[key] ?? null]));
  if (!before || Object.keys(changes).length > 0) {
    await writeAudit(
      db,
      actor,
      { action: before ? "update" : "create", entityType: "coupons", entityId: id, entityLabel: draft.code, changes },
      at,
    );
  }
  return { ...saved(at), id };
}

/** Kupon listesindeki goz dugmesi: aktif / pasif. */
export async function adminSetCouponActive(
  db: AuditDb,
  actor: Actor,
  input: Record<string, unknown>,
  at: Date,
): Promise<PanelResult<Saved>> {
  if (typeof input.active !== "boolean") return fail(400, tr.panel.invalidRequest);
  const coupon = await lockCoupon(db, input);
  if (isFailure(coupon)) return coupon;
  if (coupon.active === input.active) return { ok: true, updatedAt: coupon.updatedAt };
  await db.update(s.coupons).set({ active: input.active, updatedAt: at }).where(eq(s.coupons.id, coupon.id));
  await writeAudit(
    db,
    actor,
    {
      action: "update",
      entityType: "coupons",
      entityId: coupon.id,
      entityLabel: coupon.code,
      changes: { active: [coupon.active, input.active] },
    },
    at,
  );
  return saved(at);
}

/** Hic kullanilmamis kupon silinir; kullanilmis kupon silinmez, pasife alinir. */
export async function adminDeleteCoupon(
  db: AuditDb,
  actor: Actor,
  input: Record<string, unknown>,
  at: Date,
): Promise<PanelResult> {
  const coupon = await lockCoupon(db, input);
  if (isFailure(coupon)) return coupon;
  const [used] = await db
    .select({ id: s.couponRedemptions.id })
    .from(s.couponRedemptions)
    .where(eq(s.couponRedemptions.couponId, coupon.id))
    .limit(1);
  if (used) return fail(409, tr.panel.couponUsed);
  await db.delete(s.coupons).where(eq(s.coupons.id, coupon.id));
  const { id, ...record } = coupon;
  await writeAudit(
    db,
    actor,
    { action: "delete", entityType: "coupons", entityId: id, entityLabel: coupon.code, changes: record },
    at,
  );
  return { ok: true };
}
