import { and, count, eq, sql } from "drizzle-orm";
import {
  FEATURED_REVIEW_LIMIT,
  featuredReviewLimitText,
  isValidDateKey,
  toggledWarrantyExpiry,
  type ProductReview,
  type Quote,
  type QuoteStatus,
  type ServiceRequest,
  type ServiceRequestStatus,
  type User,
  type WarrantyRecord,
} from "@zenweld/data";
import { tr } from "@zenweld/i18n";
import { changedFields, writeAudit, type Actor, type AuditDb } from "./audit";
import { checkRow, fail, isFailure, saved, text, unchanged, type PanelResult, type Saved } from "./panel";
import { readQuotes, readServiceRequests, readWarranties, reviewRecord } from "./read";
import { readPanelMembers } from "./admin-sales";
import * as s from "./schema";

/**
 * PANEL › TALEPLER SUNUCUDA (veritabani modu; Asama 5, 2. alan; KARARLAR K-99, K-100)
 *
 * Teklifler, Servis Talepleri, Garantiler, Yorumlar ile sitedeki formlardan
 * gelen Bayilik Basvurulari, Mesajlar (iletisim ve urun destek) ve Welders
 * Club kayitlari. Kurallar demo modundaki panelle aynidir (packages/store ›
 * repo/; packages/data). Yazmalar panel.ts'teki ortak kurallarla yapilir.
 *
 * Form kayitlari (basvuru, mesaj, Welders Club) panelden silinmez; Welders
 * Club'dan ayrilmak isteyen pasife alinir (K-100).
 */

const opt = <T>(value: T | null): T | undefined => (value === null ? undefined : value);
const iso = (value: Date) => value.toISOString();
const NOTE_MAX = 2000;
/** Bos not: null. */
const note = (value: unknown) => text(value, NOTE_MAX) || null;
const stale = tr.panel.staleRecord;
const notFound = tr.panel.recordNotFound;

/* ------------------------------ Kayit turleri ------------------------------ */

/** Bayilik basvurusu (yalnizca veritabaninda; dealer_applications). */
export interface DealerApplicationRecord {
  id: string;
  status: "new" | "reviewing" | "approved" | "rejected";
  companyName: string;
  taxInfo?: string;
  city?: string;
  sector?: string;
  yearsInSector?: string;
  brands?: string;
  hasShowroom?: boolean;
  hasService?: boolean;
  contactName?: string;
  email: string;
  phone?: string;
  message?: string;
  userId?: string;
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
}

/** Iletisim formu ya da urun sayfasindaki destek sorusu (support_messages). */
export interface SupportMessageRecord {
  id: string;
  type: "iletisim" | "urun-destek";
  status: "new" | "read" | "answered";
  name?: string;
  email?: string;
  phone?: string;
  subject?: string;
  message: string;
  productId?: string;
  productName?: string;
  productSku?: string;
  pageUrl?: string;
  userId?: string;
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
}

/** Welders Club katilimi (welders_club_signups). */
export interface WeldersClubRecord {
  id: string;
  name: string;
  email: string;
  city?: string;
  userId?: string;
  /** Pasife alindiysa (kulupten ayrildi) o an */
  leftAt?: string;
  createdAt: string;
  updatedAt: string;
}

/* ------------------------------ Okuma ------------------------------ */

export async function readQuotesPanel(db: AuditDb): Promise<{ quotes: Quote[] }> {
  return { quotes: await readQuotes(db) };
}

export async function readServicePanel(db: AuditDb): Promise<{ serviceRequests: ServiceRequest[] }> {
  return { serviceRequests: await readServiceRequests(db) };
}

/** Garantiler (son degisiklik aniyla) ve uyeler ("Uye" rozeti). */
export async function readWarrantiesPanel(db: AuditDb): Promise<{ warranties: WarrantyRecord[]; users: User[] }> {
  const warranties = await readWarranties(db);
  const stamps = await db.select({ id: s.warranties.id, updatedAt: s.warranties.updatedAt }).from(s.warranties);
  const updatedAt = new Map(stamps.map((w) => [w.id, iso(w.updatedAt)]));
  return {
    warranties: warranties.map((w) => ({ ...w, updatedAt: updatedAt.get(w.id) })),
    users: await readPanelMembers(db),
  };
}

/** Butun yorumlar (onay bekleyenler dahil), yeniden eskiye. */
export async function readReviewsPanel(db: AuditDb): Promise<{ reviews: ProductReview[] }> {
  const rows = await db.select().from(s.reviews).orderBy(sql`${s.reviews.createdAt} DESC`);
  return { reviews: rows.map((r) => ({ ...reviewRecord(r), updatedAt: iso(r.updatedAt) })) };
}

export async function readDealerApplications(db: AuditDb): Promise<DealerApplicationRecord[]> {
  const rows = await db.select().from(s.dealerApplications).orderBy(sql`${s.dealerApplications.createdAt} DESC`);
  return rows.map((r) => ({
    id: r.id,
    status: r.status as DealerApplicationRecord["status"],
    companyName: r.companyName,
    taxInfo: opt(r.taxInfo),
    city: opt(r.city),
    sector: opt(r.sector),
    yearsInSector: opt(r.yearsInSector),
    brands: opt(r.brands),
    hasShowroom: opt(r.hasShowroom),
    hasService: opt(r.hasService),
    contactName: opt(r.contactName),
    email: r.email,
    phone: opt(r.phone),
    message: opt(r.message),
    userId: opt(r.userId),
    adminNote: opt(r.adminNote),
    createdAt: iso(r.createdAt),
    updatedAt: iso(r.updatedAt),
  }));
}

export async function readSupportMessages(db: AuditDb): Promise<SupportMessageRecord[]> {
  const rows = await db.select().from(s.supportMessages).orderBy(sql`${s.supportMessages.createdAt} DESC`);
  return rows.map((r) => ({
    id: r.id,
    type: r.type as SupportMessageRecord["type"],
    status: r.status as SupportMessageRecord["status"],
    name: opt(r.name),
    email: opt(r.email),
    phone: opt(r.phone),
    subject: opt(r.subject),
    message: r.message,
    productId: opt(r.productId),
    productName: opt(r.productName),
    productSku: opt(r.productSku),
    pageUrl: opt(r.pageUrl),
    userId: opt(r.userId),
    adminNote: opt(r.adminNote),
    createdAt: iso(r.createdAt),
    updatedAt: iso(r.updatedAt),
  }));
}

export async function readWeldersClub(db: AuditDb): Promise<WeldersClubRecord[]> {
  const rows = await db.select().from(s.weldersClubSignups).orderBy(sql`${s.weldersClubSignups.createdAt} DESC`);
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    city: opt(r.city),
    userId: opt(r.userId),
    leftAt: r.leftAt ? iso(r.leftAt) : undefined,
    createdAt: iso(r.createdAt),
    updatedAt: iso(r.updatedAt),
  }));
}

/* ------------------------------ Ortak ------------------------------ */

type Input = Record<string, unknown>;

/** Istekte verilen alanlar degisirse yazar; degisen bir sey yoksa hicbir sey yazmaz. */
async function update<Row extends { id: string; updatedAt: Date }>(
  db: AuditDb,
  actor: Actor,
  at: Date,
  target: { table: string; row: Row; label: string },
  next: Partial<Row>,
  write: (values: Partial<Row> & { updatedAt: Date }) => Promise<unknown>,
): Promise<PanelResult<Saved>> {
  const keys = Object.keys(next) as (keyof Row & string)[];
  const changes = changedFields(target.row, { ...target.row, ...next }, keys);
  if (Object.keys(changes).length === 0) return unchanged(target.row);
  await write({ ...next, updatedAt: at });
  await writeAudit(
    db,
    actor,
    { action: "update", entityType: target.table, entityId: target.row.id, entityLabel: target.label, changes },
    at,
  );
  return saved(at);
}

const pick = <T extends string>(value: unknown, allowed: readonly T[]) => allowed.find((x) => x === value);

/* ------------------------------ Teklifler ------------------------------ */

const QUOTE_STATUSES: QuoteStatus[] = ["new", "reviewing", "sent", "won", "lost"];

async function lockQuote(db: AuditDb, input: Input) {
  const id = text(input.id, 100);
  const [row] = id ? await db.select().from(s.quotes).where(eq(s.quotes.id, id)).for("update") : [];
  return checkRow(row, input, notFound, stale);
}

/**
 * Teklifin durumu, atanan satis temsilcisi ve ic notu. Ekran her alani ayri
 * kaydeder; istekte olmayan alan degismez.
 */
export async function adminSaveQuote(db: AuditDb, actor: Actor, input: Input, at: Date): Promise<PanelResult<Saved>> {
  const next: { status?: QuoteStatus; assignedTo?: string | null; adminNote?: string | null } = {};
  if (input.status !== undefined) {
    const status = pick(input.status, QUOTE_STATUSES);
    if (!status) return fail(400, tr.panel.invalidRequest);
    next.status = status;
  }
  if (input.assignedTo !== undefined) next.assignedTo = text(input.assignedTo, 200) || null;
  if (input.adminNote !== undefined) next.adminNote = note(input.adminNote);
  const row = await lockQuote(db, input);
  if (isFailure(row)) return row;
  return update(db, actor, at, { table: "quotes", row, label: row.code }, next, (values) =>
    db.update(s.quotes).set(values).where(eq(s.quotes.id, row.id)),
  );
}

/** Teklifi siler (satirlariyla). Numara yeniden verilmez (record_counters). */
export async function adminDeleteQuote(db: AuditDb, actor: Actor, input: Input, at: Date): Promise<PanelResult> {
  const row = await lockQuote(db, input);
  if (isFailure(row)) return row;
  const [quote] = await readQuotes(db, eq(s.quotes.id, row.id));
  await db.delete(s.quotes).where(eq(s.quotes.id, row.id));
  const { id, ...record } = quote;
  await writeAudit(db, actor, { action: "delete", entityType: "quotes", entityId: id, entityLabel: row.code, changes: record }, at);
  return { ok: true };
}

/* ------------------------------ Servis talepleri ------------------------------ */

const SERVICE_STATUSES: ServiceRequestStatus[] = ["new", "in_progress", "done"];

export async function adminSaveServiceRequest(
  db: AuditDb,
  actor: Actor,
  input: Input,
  at: Date,
): Promise<PanelResult<Saved>> {
  const status = pick(input.status, SERVICE_STATUSES);
  if (!status) return fail(400, tr.panel.invalidRequest);
  const id = text(input.id, 100);
  const [found] = id ? await db.select().from(s.serviceRequests).where(eq(s.serviceRequests.id, id)).for("update") : [];
  const row = checkRow(found, input, notFound, stale);
  if (isFailure(row)) return row;
  return update(db, actor, at, { table: "service_requests", row, label: row.code }, { status, adminNote: note(input.adminNote) }, (values) =>
    db.update(s.serviceRequests).set(values).where(eq(s.serviceRequests.id, row.id)),
  );
}

/* ------------------------------ Garantiler ------------------------------ */

async function lockWarranty(db: AuditDb, input: Input) {
  const id = text(input.id, 100);
  const [row] = id ? await db.select().from(s.warranties).where(eq(s.warranties.id, id)).for("update") : [];
  return checkRow(row, input, notFound, stale);
}

/**
 * Garantinin bitis tarihi ya da uzatilmis garantisi. Uzatilmis garanti acilip
 * kapaninca bitis tarihine 12 ay eklenir ya da cikarilir (kayittaki guncel
 * tarihten). Musterinin Garantilerim sayfasi ve sitedeki sorgulama hemen
 * gorur (veritabanindan okunur).
 */
export async function adminSaveWarranty(db: AuditDb, actor: Actor, input: Input, at: Date): Promise<PanelResult<Saved>> {
  if (input.expiresAt !== undefined && (typeof input.expiresAt !== "string" || !isValidDateKey(input.expiresAt))) {
    return fail(400, tr.panel.invalidDate);
  }
  if (input.extended !== undefined && typeof input.extended !== "boolean") return fail(400, tr.panel.invalidRequest);
  const row = await lockWarranty(db, input);
  if (isFailure(row)) return row;
  const next: { expiresAt?: string; extended?: boolean } = {};
  if (typeof input.expiresAt === "string") next.expiresAt = input.expiresAt;
  if (typeof input.extended === "boolean" && input.extended !== row.extended) {
    next.extended = input.extended;
    next.expiresAt = toggledWarrantyExpiry(next.expiresAt ?? row.expiresAt, input.extended);
  }
  return update(db, actor, at, { table: "warranties", row, label: row.serialNumber }, next, (values) =>
    db.update(s.warranties).set(values).where(eq(s.warranties.id, row.id)),
  );
}

export async function adminDeleteWarranty(db: AuditDb, actor: Actor, input: Input, at: Date): Promise<PanelResult> {
  const row = await lockWarranty(db, input);
  if (isFailure(row)) return row;
  await db.delete(s.warranties).where(eq(s.warranties.id, row.id));
  const { id, ...record } = row;
  await writeAudit(
    db,
    actor,
    { action: "delete", entityType: "warranties", entityId: id, entityLabel: row.serialNumber, changes: record },
    at,
  );
  return { ok: true };
}

/* ------------------------------ Yorumlar ------------------------------ */

async function lockReview(db: AuditDb, input: Input) {
  const id = text(input.id, 100);
  const [row] = id ? await db.select().from(s.reviews).where(eq(s.reviews.id, id)).for("update") : [];
  return checkRow(row, input, notFound, stale);
}

/** Onaylar ya da yayindan kaldirir; kaldirilan yorum anasayfadan da cikar. */
export async function adminSetReviewApproved(
  db: AuditDb,
  actor: Actor,
  input: Input,
  at: Date,
): Promise<PanelResult<Saved>> {
  if (typeof input.approved !== "boolean") return fail(400, tr.panel.invalidRequest);
  const row = await lockReview(db, input);
  if (isFailure(row)) return row;
  const next = input.approved ? { approved: true } : { approved: false, featured: false };
  return update(db, actor, at, { table: "reviews", row, label: row.authorName }, next, (values) =>
    db.update(s.reviews).set(values).where(eq(s.reviews.id, row.id)),
  );
}

/**
 * Anasayfa seridine alir ya da cikarir. Yalnizca onayli yorum alinir; seritte
 * en fazla 10 yorum olur (yalnizca gorunenler sayilir: onayli ve urunu
 * yayinda). Isaretlemeler sirayla yapilir; ayni anda iki yonetici siniri
 * asamaz.
 */
export async function adminSetReviewFeatured(
  db: AuditDb,
  actor: Actor,
  input: Input,
  at: Date,
): Promise<PanelResult<Saved>> {
  if (typeof input.featured !== "boolean") return fail(400, tr.panel.invalidRequest);
  const row = await lockReview(db, input);
  if (isFailure(row)) return row;
  if (input.featured && !row.featured) {
    if (!row.approved) return fail(409, tr.panel.reviewNotApproved);
    await db.execute(sql`select pg_advisory_xact_lock(hashtext('reviews.featured'))`);
    const [{ n }] = await db
      .select({ n: count() })
      .from(s.reviews)
      .innerJoin(s.products, eq(s.products.id, s.reviews.productId))
      .where(and(eq(s.reviews.approved, true), eq(s.reviews.featured, true), eq(s.products.active, true)));
    if (n >= FEATURED_REVIEW_LIMIT) return fail(409, featuredReviewLimitText());
  }
  return update(db, actor, at, { table: "reviews", row, label: row.authorName }, { featured: input.featured }, (values) =>
    db.update(s.reviews).set(values).where(eq(s.reviews.id, row.id)),
  );
}

export async function adminDeleteReview(db: AuditDb, actor: Actor, input: Input, at: Date): Promise<PanelResult> {
  const row = await lockReview(db, input);
  if (isFailure(row)) return row;
  await db.delete(s.reviews).where(eq(s.reviews.id, row.id));
  // Fotograf ve videolar (buyuk veri) kayda yazilmaz; yalnizca sayisi.
  const { id, media, ...record } = row;
  await writeAudit(
    db,
    actor,
    {
      action: "delete",
      entityType: "reviews",
      entityId: id,
      entityLabel: row.authorName,
      changes: { ...record, media: `${media.length} dosya` },
    },
    at,
  );
  return { ok: true };
}

/* --------------------- Basvurular, mesajlar, Welders Club --------------------- */

const APPLICATION_STATUSES = ["new", "reviewing", "approved", "rejected"] as const;
const MESSAGE_STATUSES = ["new", "read", "answered"] as const;

/** Bayilik basvurusunun durumu ve ic notu. Bayi kaydi Bayiler ekranindan ayrica acilir. */
export async function adminSaveDealerApplication(
  db: AuditDb,
  actor: Actor,
  input: Input,
  at: Date,
): Promise<PanelResult<Saved>> {
  const status = pick(input.status, APPLICATION_STATUSES);
  if (!status) return fail(400, tr.panel.invalidRequest);
  const id = text(input.id, 100);
  const [found] = id ? await db.select().from(s.dealerApplications).where(eq(s.dealerApplications.id, id)).for("update") : [];
  const row = checkRow(found, input, notFound, stale);
  if (isFailure(row)) return row;
  return update(
    db,
    actor,
    at,
    { table: "dealer_applications", row, label: row.companyName },
    { status, adminNote: note(input.adminNote) },
    (values) => db.update(s.dealerApplications).set(values).where(eq(s.dealerApplications.id, row.id)),
  );
}

/** Mesajin durumu (Yeni, Okundu, Yanıtlandı) ve ic notu. Yanit e-postayla ayrica verilir. */
export async function adminSaveSupportMessage(
  db: AuditDb,
  actor: Actor,
  input: Input,
  at: Date,
): Promise<PanelResult<Saved>> {
  const status = pick(input.status, MESSAGE_STATUSES);
  if (!status) return fail(400, tr.panel.invalidRequest);
  const id = text(input.id, 100);
  const [found] = id ? await db.select().from(s.supportMessages).where(eq(s.supportMessages.id, id)).for("update") : [];
  const row = checkRow(found, input, notFound, stale);
  if (isFailure(row)) return row;
  return update(
    db,
    actor,
    at,
    { table: "support_messages", row, label: row.name || row.email || row.id },
    { status, adminNote: note(input.adminNote) },
    (values) => db.update(s.supportMessages).set(values).where(eq(s.supportMessages.id, row.id)),
  );
}

/** Welders Club: kulupten ayrilmak isteyen pasife alinir (kayit silinmez; K-100); yeniden aktif yapilabilir. */
export async function adminSetWeldersClubActive(
  db: AuditDb,
  actor: Actor,
  input: Input,
  at: Date,
): Promise<PanelResult<Saved>> {
  if (typeof input.active !== "boolean") return fail(400, tr.panel.invalidRequest);
  const id = text(input.id, 100);
  const [found] = id ? await db.select().from(s.weldersClubSignups).where(eq(s.weldersClubSignups.id, id)).for("update") : [];
  const row = checkRow(found, input, notFound, stale);
  if (isFailure(row)) return row;
  if (input.active === (row.leftAt === null)) return unchanged(row);
  const leftAt = input.active ? null : at;
  await db.update(s.weldersClubSignups).set({ leftAt, updatedAt: at }).where(eq(s.weldersClubSignups.id, row.id));
  await writeAudit(
    db,
    actor,
    {
      action: "update",
      entityType: "welders_club_signups",
      entityId: row.id,
      entityLabel: row.email,
      changes: { leftAt: [row.leftAt ? iso(row.leftAt) : null, leftAt ? iso(leftAt) : null] },
    },
    at,
  );
  return saved(at);
}
