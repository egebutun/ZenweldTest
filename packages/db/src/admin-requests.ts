import { and, count, desc, eq, gte, inArray, lt, ne, sql, type SQL } from "drizzle-orm";
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
  type DealerApplication,
  type SupportMessage,
  type WarrantyRecord,
} from "@zenweld/data";
import { tr } from "@zenweld/i18n";
import { pageWindow, type ListPage } from "@zenweld/utils";
import { changedFields, writeAudit, type Actor, type AuditDb } from "./audit";
import { checkRow, fail, isFailure, saved, text, unchanged, type PanelResult, type Saved } from "./panel";
import { countRows, searchLike } from "./panel-lists";
import { readQuotes, readServiceRequests, readWarranties, reviewRecord } from "./read";
import * as s from "./schema";

/**
 * PANEL › TALEPLER SUNUCUDA (veritabani modu; Asama 5, 2. alan; KARARLAR K-99, K-100)
 *
 * Teklifler, Servis Talepleri, Garantiler, Yorumlar ile sitedeki formlardan
 * gelen Bayilik Basvurulari ve Mesajlar (iletisim ve urun destek). Kurallar
 * demo modundaki panelle aynidir (packages/store › repo/; packages/data).
 * Yazmalar panel.ts'teki ortak kurallarla yapilir.
 *
 * Form kayitlari (basvuru, mesaj) panelden silinmez (K-100).
 */

const opt = <T>(value: T | null): T | undefined => (value === null ? undefined : value);
const iso = (value: Date) => value.toISOString();
const NOTE_MAX = 2000;
/** Bos not: null. */
const note = (value: unknown) => text(value, NOTE_MAX) || null;
const stale = tr.panel.staleRecord;
const notFound = tr.panel.recordNotFound;

/* ------------------------------ Kayit turleri ------------------------------ */

/**
 * Form kayitlari (dealer_applications, support_messages). Tipler
 * packages/data'dadir; demo modunda ayni kayitlar tarayicida tutulur
 * (KARARLAR K-109).
 */
export type DealerApplicationRecord = DealerApplication;
export type SupportMessageRecord = SupportMessage;

/* ------------------------------ Okuma ------------------------------ */

/*
 * Uzun listeler sayfa sayfa okunur (50; panel-lists.ts): sunucu yalnizca
 * istenen sayfanin kayitlarini ve sayilari gonderir. CSV icin suzgece uyan
 * kayitlarin tamami okunur (*ForExport).
 */

export interface QuoteListFilter {
  status?: QuoteStatus;
  page: number;
}

const quoteWhere = (filter: Omit<QuoteListFilter, "page">) => (filter.status ? eq(s.quotes.status, filter.status) : undefined);

/** Teklifler: suzgece uyan tekliflerin bir sayfasi (yeniden eskiye). */
export async function readQuotesPage(db: AuditDb, filter: QuoteListFilter): Promise<ListPage<Quote>> {
  const where = quoteWhere(filter);
  const total = await countRows(db, s.quotes, where);
  const w = pageWindow(total, filter.page);
  return { rows: total ? await readQuotes(db, where, w) : [], total, page: w.page };
}

/** Tekliflerin CSV'si: suzgece uyan tekliflerin tamami. */
export async function readQuotesForExport(db: AuditDb, filter: Omit<QuoteListFilter, "page">): Promise<Quote[]> {
  return readQuotes(db, quoteWhere(filter));
}

export interface ServiceListPage extends ListPage<ServiceRequest> {
  /** Yeni (islenmemis) talepler */
  newCount: number;
}

/** Servis talepleri: bir sayfa (yeniden eskiye) ve yeni talep sayisi. */
export async function readServicePage(db: AuditDb, page: number): Promise<ServiceListPage> {
  const t = s.serviceRequests;
  const total = await countRows(db, t);
  const w = pageWindow(total, page);
  return {
    rows: total ? await readServiceRequests(db, undefined, w) : [],
    total,
    page: w.page,
    newCount: await countRows(db, t, eq(t.status, "new")),
  };
}

export type WarrantyState = "valid" | "expired" | "extended";

export interface WarrantyListFilter {
  /** Seri no, sahibi, e-posta */
  q?: string;
  state?: WarrantyState;
  /** Turkiye gunu (YYYY-AA-GG): bitisi bu gunden once olan "suresi doldu" */
  today: string;
  page: number;
}

export interface WarrantyListPage extends ListPage<WarrantyRecord> {
  /** Butun kayitlar */
  all: number;
  /** Garantisi devam eden kayitlar (butun kayitlarda) */
  valid: number;
  /** Bu sayfadaki kayitlardan uye olanlarin e-postalari (kucuk harf; "Uye" rozeti) */
  members: string[];
}

function warrantyWhere(filter: Omit<WarrantyListFilter, "page">): SQL | undefined {
  const t = s.warranties;
  return and(
    filter.state === "valid" ? gte(t.expiresAt, filter.today) : undefined,
    filter.state === "expired" ? lt(t.expiresAt, filter.today) : undefined,
    filter.state === "extended" ? eq(t.extended, true) : undefined,
    searchLike([t.serialNumber, t.ownerName, t.email], filter.q),
  );
}

/** Garantiler: bir sayfa (son degisiklik aniyla), sayilar ve sayfadaki uyeler. */
export async function readWarrantiesPage(db: AuditDb, filter: WarrantyListFilter): Promise<WarrantyListPage> {
  const t = s.warranties;
  const where = warrantyWhere(filter);
  const total = await countRows(db, t, where);
  const w = pageWindow(total, filter.page);
  const rows = total ? await readWarranties(db, where, w) : [];
  const ids = rows.map((r) => r.id);
  const stamps = ids.length ? await db.select({ id: t.id, updatedAt: t.updatedAt }).from(t).where(inArray(t.id, ids)) : [];
  const updatedAt = new Map(stamps.map((r) => [r.id, iso(r.updatedAt)]));
  const emails = [...new Set(rows.map((r) => r.email.toLowerCase()))];
  const members = emails.length
    ? await db
        .select({ email: sql<string>`lower(${s.users.email})` })
        .from(s.users)
        .where(and(ne(s.users.role, "admin"), inArray(sql`lower(${s.users.email})`, emails)))
    : [];
  return {
    rows: rows.map((r) => ({ ...r, updatedAt: updatedAt.get(r.id) })),
    total,
    page: w.page,
    all: await countRows(db, t),
    valid: await countRows(db, t, gte(t.expiresAt, filter.today)),
    members: members.map((m) => m.email),
  };
}

/** Garantilerin CSV'si: suzgece uyan kayitlarin tamami. */
export async function readWarrantiesForExport(db: AuditDb, filter: Omit<WarrantyListFilter, "page">): Promise<WarrantyRecord[]> {
  return readWarranties(db, warrantyWhere(filter));
}

export interface ReviewListFilter {
  /** Yazan kisi ve yorum metni */
  q?: string;
  /** Yalnizca onay bekleyenler */
  pending?: boolean;
  page: number;
}

export interface ReviewListPage extends ListPage<ProductReview> {
  /** Onay bekleyen yorumlar (butun yorumlarda) */
  pendingCount: number;
  /** Anasayfada gorunebilen one cikarilmis yorumlar (onayli, urunu yayinda) */
  featuredCount: number;
}

/** Yorumlar (onay bekleyenler dahil): bir sayfa (yeniden eskiye) ve sayilar. */
export async function readReviewsPage(db: AuditDb, filter: ReviewListFilter): Promise<ReviewListPage> {
  const t = s.reviews;
  const where = and(filter.pending ? eq(t.approved, false) : undefined, searchLike([t.authorName, t.body], filter.q));
  const total = await countRows(db, t, where);
  const w = pageWindow(total, filter.page);
  const rows = total
    ? await db.select().from(t).where(where).orderBy(desc(t.createdAt), desc(t.id)).limit(w.limit).offset(w.offset)
    : [];
  const [featured] = await db
    .select({ n: count() })
    .from(t)
    .innerJoin(s.products, eq(s.products.id, t.productId))
    .where(and(eq(t.approved, true), eq(t.featured, true), eq(s.products.active, true)));
  return {
    rows: rows.map((r) => ({ ...reviewRecord(r), updatedAt: iso(r.updatedAt) })),
    total,
    page: w.page,
    pendingCount: await countRows(db, t, eq(t.approved, false)),
    featuredCount: featured?.n ?? 0,
  };
}

type DealerApplicationRow = typeof s.dealerApplications.$inferSelect;
type SupportMessageRow = typeof s.supportMessages.$inferSelect;

const dealerApplicationRecord = (r: DealerApplicationRow): DealerApplicationRecord => ({
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
});

const supportMessageRecord = (r: SupportMessageRow): SupportMessageRecord => ({
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
});

export interface CountedListPage<T> extends ListPage<T> {
  /** Butun kayitlar */
  all: number;
  /** Yeni (incelenmemis) kayitlar, butun kayitlarda */
  newCount: number;
}

/** Bayilik basvurulari: bir sayfa (yeniden eskiye) ve sayilar. */
export async function readDealerApplicationsPage(db: AuditDb, page: number): Promise<CountedListPage<DealerApplicationRecord>> {
  const t = s.dealerApplications;
  const total = await countRows(db, t);
  const w = pageWindow(total, page);
  const rows = total ? await db.select().from(t).orderBy(desc(t.createdAt), desc(t.id)).limit(w.limit).offset(w.offset) : [];
  return { rows: rows.map(dealerApplicationRecord), total, page: w.page, all: total, newCount: await countRows(db, t, eq(t.status, "new")) };
}

export interface MessageListFilter {
  type?: SupportMessageRecord["type"];
  page: number;
}

/** Mesajlar: suzgece (tur) uyan mesajlarin bir sayfasi; sayilar butun mesajlarda. */
export async function readMessagesPage(db: AuditDb, filter: MessageListFilter): Promise<CountedListPage<SupportMessageRecord>> {
  const t = s.supportMessages;
  const where = filter.type ? eq(t.type, filter.type) : undefined;
  const total = await countRows(db, t, where);
  const w = pageWindow(total, filter.page);
  const rows = total
    ? await db.select().from(t).where(where).orderBy(desc(t.createdAt), desc(t.id)).limit(w.limit).offset(w.offset)
    : [];
  return {
    rows: rows.map(supportMessageRecord),
    total,
    page: w.page,
    all: await countRows(db, t),
    newCount: await countRows(db, t, eq(t.status, "new")),
  };
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

/* --------------------- Basvurular, mesajlar --------------------- */

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
