import { and, asc, eq, max, ne, sql } from "drizzle-orm";
import {
  EMPTY_SLUG_ERROR,
  FAQ_TOPICS,
  aboutDraftError,
  blogDraftError,
  blogSlugTakenText,
  eventDraftError,
  eventSlugTakenText,
  faqDraftError,
  isUploadedFile,
  newsDraftError,
  newsSlugTakenText,
  type AboutContent,
  type AboutSection,
  type AboutStat,
  type SeoFields,
  type ZenweldDatabase,
} from "@zenweld/data";
import { tr } from "@zenweld/i18n";
import { slugify } from "@zenweld/utils";
import { changedFields, writeAudit, type Actor, type AuditDb } from "./audit";
import { movePath, parseSeo, releasePath } from "./links";
import { direction, fail, newId, reorder, saved, text, unchanged, type PanelFailure, type PanelResult, type Saved } from "./panel";
import { readContent } from "./read";
import * as s from "./schema";

/**
 * PANEL › ICERIK SUNUCUDA (Asama 5, 5. alan, adim 5.2; KARARLAR K-99, K-101)
 *
 * Haberler, Etkinlikler, Blog, Sık Sorulan Sorular ve Hakkımızda. Kurallar
 * demo modundaki panelle aynidir (packages/data › content-rules.ts;
 * packages/store › repo/news.ts, events.ts, blog.ts, faqs.ts, site.ts).
 * Yazmalar panel.ts'teki ortak kurallarla yapilir; basarili kayittan sonra
 * sitenin icerik onbellegi yenilenir (cagiran uc).
 *
 * - Link degisince eski adres yeni adrese yonlenir (redirects); kayit
 *   silinince yonlendirmeleri de silinir.
 * - Dosya deposu gelene kadar yuklenmis gorsel (data: adresi) kaydedilmez,
 *   gorsel adresi girilir (K-101).
 */

type Input = Record<string, unknown>;

const record = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
const iso = (value: Date) => value.toISOString();
const stale = tr.panel.staleRecord;
const notFound = tr.panel.recordNotFound;
const invalid = () => fail(400, tr.panel.invalidRequest);
const uploadDisabled = () => fail(400, tr.panel.uploadDisabled);
/** Ayni anda iki kayit ayni linki almasin, sira karismasin diye bu kayitlar sirayla yapilir. */
const serialize = (db: AuditDb, name: string) => db.execute(sql`select pg_advisory_xact_lock(hashtext(${name}))`);

/** Kisa metin, uzun metin ve adres sinirlari (karakter). */
const SHORT = 300;
const MEDIUM = 2000;
const LONG = 100_000;

/** Gorsel adresi: metin; yuklenmis dosya (data:) null. */
function imageUrl(value: unknown): string | null {
  const url = text(value, MEDIUM);
  return isUploadedFile(url) ? null : url;
}

/** Galeri: en fazla 50 adres; yuklenmis dosya varsa null, bicim bozuksa undefined. */
function imageList(value: unknown): string[] | null | undefined {
  if (!Array.isArray(value) || value.length > 50 || !value.every((v) => typeof v === "string")) return undefined;
  const list = value.map((v) => text(v, MEDIUM)).filter(Boolean);
  return list.some(isUploadedFile) ? null : list;
}

/** Gecerli bir an (ISO); degilse null. */
function moment(value: unknown): Date | null {
  if (typeof value !== "string") return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Takvim gunu "2026-06-16"; degilse null. */
function day(value: unknown): string | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value) ? value : null;
}

/* ------------------------------ Okuma ------------------------------ */

/**
 * Panelin icerik ekranlari: blog, haber, etkinlik, SSS (son degisiklik
 * anlariyla) ve Hakkımızda; onbelleksiz (panel her zaman guncel kaydi gorur).
 */
export async function readContentPanel(db: AuditDb): Promise<Partial<ZenweldDatabase>> {
  const content = await readContent(db);
  const stamp = async (table: typeof s.blogPosts | typeof s.news | typeof s.events | typeof s.faqs) =>
    new Map((await db.select({ id: table.id, updatedAt: table.updatedAt }).from(table)).map((r) => [r.id, iso(r.updatedAt)]));
  const blog = await stamp(s.blogPosts);
  const news = await stamp(s.news);
  const events = await stamp(s.events);
  const faqs = await stamp(s.faqs);
  return {
    blogPosts: content.blogPosts.map((b) => ({ ...b, updatedAt: blog.get(b.id) })),
    news: content.news.map((n) => ({ ...n, updatedAt: news.get(n.id) })),
    events: content.events.map((e) => ({ ...e, updatedAt: events.get(e.id) })),
    faqs: content.faqs.map((f) => ({ ...f, updatedAt: faqs.get(f.id) })),
    about: content.about,
  };
}

/* ------------------------------ Haber, etkinlik, blog ------------------------------ */

/** Ortak alanlar: link, baslik, yayinda, SEO. */
interface ArticleBase {
  slug: string;
  title: string;
  active: boolean;
  seo: SeoFields | undefined;
}

/** Kayit turunun veritabani islemleri ve kurallari. */
interface ArticleSpec<V extends ArticleBase> {
  /** Yonlendirme hedefi */
  target: "news" | "blog" | "event";
  /** Sitedeki adresin basi: "/haberler/" */
  prefix: string;
  /** Yeni kaydin kimlik on eki */
  idPrefix: string;
  /** audit_log.entity_type */
  entityType: "news" | "blog_posts" | "events";
  /** Karsilastirma ve islem kaydi icin alanlar */
  keys: readonly (keyof V & string)[];
  /** Formdan gelen alanlar (link haric); bicim bozuksa hata. */
  parse: (input: Input) => Omit<V, "slug"> | PanelFailure;
  draftError: (value: V) => string | null;
  slugTaken: (slug: string, title: string) => string;
  find: (db: AuditDb, id: string) => Promise<({ id: string; updatedAt: Date } & V) | undefined>;
  /** Linki kullanan baska kayit */
  owner: (db: AuditDb, slug: string, exceptId: string) => Promise<{ title: string } | undefined>;
  insert: (db: AuditDb, id: string, value: V, at: Date) => Promise<unknown>;
  update: (db: AuditDb, id: string, value: Partial<V>, at: Date) => Promise<unknown>;
  remove: (db: AuditDb, id: string) => Promise<unknown>;
}

const isFailureValue = <T extends object>(value: T | PanelFailure): value is PanelFailure => "ok" in value && value.ok === false;

/** Karsilastirma: alanlar ayni sirayla, SEO bicimi ayni. */
const comparable = <V extends ArticleBase>(value: V, keys: readonly (keyof V & string)[]) =>
  JSON.stringify(keys.map((k) => (k === "seo" ? (parseSeo(value.seo) ?? null) : (value[k] ?? null))));

/**
 * Kaydeder (id yoksa yeni kayit). input: formun alanlari, link (bossa
 * basliktan), updatedAt. Link baska kayitta kullaniliyorsa kaydedilmez;
 * link degisince eski adres yeni adrese yonlenir.
 */
async function saveArticle<V extends ArticleBase>(
  spec: ArticleSpec<V>,
  db: AuditDb,
  actor: Actor,
  input: Input,
  at: Date,
): Promise<PanelResult<{ id: string } & Saved>> {
  const fields = spec.parse(input);
  if (isFailureValue(fields)) return fields;
  const slug = slugify(text(input.slug, SHORT)) || slugify(fields.title);
  const value = { ...fields, slug } as V;
  const problem = spec.draftError(value);
  if (problem) return fail(400, problem);
  if (!slug) return fail(400, EMPTY_SLUG_ERROR);

  await serialize(db, `${spec.target}:slug`);
  const id = text(input.id, 100);
  const row = id ? await spec.find(db, id) : undefined;
  if (id && !row) return fail(404, notFound);
  if (row && iso(row.updatedAt) !== input.updatedAt) return fail(409, stale);
  const owner = await spec.owner(db, slug, id);
  if (owner) return fail(400, spec.slugTaken(slug, owner.title));

  if (!row) {
    const newIdValue = newId(spec.idPrefix);
    await spec.insert(db, newIdValue, value, at);
    await releasePath(db, `${spec.prefix}${slug}`);
    await writeAudit(
      db,
      actor,
      { action: "create", entityType: spec.entityType, entityId: newIdValue, entityLabel: value.title, changes: changedFields({} as V, value, spec.keys) },
      at,
    );
    return { ...saved(at), id: newIdValue };
  }

  if (comparable(row, spec.keys) === comparable(value, spec.keys)) return { ...unchanged(row), id: row.id };
  await spec.update(db, row.id, value, at);
  await movePath(db, `${spec.prefix}${row.slug}`, `${spec.prefix}${slug}`, spec.target, row.id);
  const before = { ...row, seo: parseSeo(row.seo) ?? undefined } as V;
  await writeAudit(
    db,
    actor,
    { action: "update", entityType: spec.entityType, entityId: row.id, entityLabel: value.title, changes: changedFields(before, value, spec.keys) },
    at,
  );
  return { ...saved(at), id: row.id };
}

/** Listeden yayina alir ya da yayindan kaldirir. input: { id, active, updatedAt }. */
async function setArticleActive<V extends ArticleBase>(
  spec: ArticleSpec<V>,
  db: AuditDb,
  actor: Actor,
  input: Input,
  at: Date,
): Promise<PanelResult<Saved>> {
  if (typeof input.active !== "boolean") return invalid();
  const row = await spec.find(db, text(input.id, 100));
  if (!row) return fail(404, notFound);
  if (iso(row.updatedAt) !== input.updatedAt) return fail(409, stale);
  if (row.active === input.active) return unchanged(row);
  await spec.update(db, row.id, { active: input.active } as Partial<V>, at);
  await writeAudit(
    db,
    actor,
    { action: "update", entityType: spec.entityType, entityId: row.id, entityLabel: row.title, changes: { active: [row.active, input.active] } },
    at,
  );
  return saved(at);
}

/**
 * Siler. Kaydin eski adres yonlendirmelerini veritabani kendisi siler
 * (migrations/0001_kurallar.sql › zw_delete_redirects). input: { id, updatedAt }.
 */
async function deleteArticle<V extends ArticleBase>(spec: ArticleSpec<V>, db: AuditDb, actor: Actor, input: Input, at: Date): Promise<PanelResult> {
  const row = await spec.find(db, text(input.id, 100));
  if (!row) return fail(404, notFound);
  if (iso(row.updatedAt) !== input.updatedAt) return fail(409, stale);
  await spec.remove(db, row.id);
  const { title, slug, active } = row;
  await writeAudit(
    db,
    actor,
    { action: "delete", entityType: spec.entityType, entityId: row.id, entityLabel: title, changes: { slug: [slug, null], active: [active, null] } },
    at,
  );
  return { ok: true };
}

/** Ortak alanlarin okunmasi (link haric). */
function parseBase(input: Input): Omit<ArticleBase, "slug"> | PanelFailure {
  const seo = parseSeo(input.seo);
  if (seo === null || typeof input.active !== "boolean") return invalid();
  return { title: text(input.title, SHORT), active: input.active, seo };
}

/* Haber */

interface NewsValue extends ArticleBase {
  summary: string;
  body: string;
  coverUrl: string;
  images: string[];
  publishedAt: string;
}

const newsRow = (r: typeof s.news.$inferSelect) => ({
  id: r.id,
  updatedAt: r.updatedAt,
  slug: r.slug,
  title: r.title,
  summary: r.summary,
  body: r.body,
  coverUrl: r.coverUrl,
  images: r.images,
  publishedAt: iso(r.publishedAt),
  active: r.active,
  seo: r.seo ?? undefined,
});

const NEWS: ArticleSpec<NewsValue> = {
  target: "news",
  prefix: "/haberler/",
  idPrefix: "n",
  entityType: "news",
  keys: ["slug", "title", "summary", "body", "coverUrl", "images", "publishedAt", "active", "seo"],
  parse: (input) => {
    const base = parseBase(input);
    if (isFailureValue(base)) return base;
    const coverUrl = imageUrl(input.coverUrl);
    const images = imageList(input.images);
    const publishedAt = moment(input.publishedAt);
    if (images === undefined || !publishedAt) return invalid();
    if (coverUrl === null || images === null) return uploadDisabled();
    return { ...base, summary: text(input.summary, MEDIUM), body: text(input.body, LONG), coverUrl, images, publishedAt: iso(publishedAt) };
  },
  draftError: newsDraftError,
  slugTaken: newsSlugTakenText,
  find: async (db, id) => {
    const [row] = id ? await db.select().from(s.news).where(eq(s.news.id, id)).for("update") : [];
    return row && newsRow(row);
  },
  owner: async (db, slug, exceptId) =>
    (await db.select({ title: s.news.title }).from(s.news).where(and(eq(s.news.slug, slug), ne(s.news.id, exceptId))))[0],
  insert: (db, id, v, at) =>
    db.insert(s.news).values({ id, ...v, seo: v.seo ?? null, publishedAt: new Date(v.publishedAt), createdAt: at, updatedAt: at }),
  update: (db, id, v, at) => {
    const { publishedAt, seo, ...rest } = v;
    return db
      .update(s.news)
      .set({
        ...rest,
        ...("seo" in v && { seo: seo ?? null }),
        ...(publishedAt !== undefined && { publishedAt: new Date(publishedAt) }),
        updatedAt: at,
      })
      .where(eq(s.news.id, id));
  },
  remove: (db, id) => db.delete(s.news).where(eq(s.news.id, id)),
};

/* Blog */

interface BlogValue extends ArticleBase {
  excerpt: string;
  body: string;
  coverUrl: string;
  category: string;
  author: string;
  publishedAt: string;
}

const blogRow = (r: typeof s.blogPosts.$inferSelect) => ({
  id: r.id,
  updatedAt: r.updatedAt,
  slug: r.slug,
  title: r.title,
  excerpt: r.excerpt,
  body: r.body,
  coverUrl: r.coverUrl,
  category: r.category,
  author: r.author,
  publishedAt: iso(r.publishedAt),
  active: r.active,
  seo: r.seo ?? undefined,
});

const BLOG: ArticleSpec<BlogValue> = {
  target: "blog",
  prefix: "/blog/",
  idPrefix: "b",
  entityType: "blog_posts",
  keys: ["slug", "title", "excerpt", "body", "coverUrl", "category", "author", "publishedAt", "active", "seo"],
  parse: (input) => {
    const base = parseBase(input);
    if (isFailureValue(base)) return base;
    const coverUrl = imageUrl(input.coverUrl);
    const publishedAt = moment(input.publishedAt);
    if (!publishedAt) return invalid();
    if (coverUrl === null) return uploadDisabled();
    return {
      ...base,
      excerpt: text(input.excerpt, MEDIUM),
      body: text(input.body, LONG),
      coverUrl,
      category: text(input.category, 100),
      // Yazar bos birakilirsa "Zenweld" (demo ile ayni).
      author: text(input.author, SHORT) || "Zenweld",
      publishedAt: iso(publishedAt),
    };
  },
  draftError: blogDraftError,
  slugTaken: blogSlugTakenText,
  find: async (db, id) => {
    const [row] = id ? await db.select().from(s.blogPosts).where(eq(s.blogPosts.id, id)).for("update") : [];
    return row && blogRow(row);
  },
  owner: async (db, slug, exceptId) =>
    (await db.select({ title: s.blogPosts.title }).from(s.blogPosts).where(and(eq(s.blogPosts.slug, slug), ne(s.blogPosts.id, exceptId))))[0],
  insert: (db, id, v, at) =>
    db.insert(s.blogPosts).values({ id, ...v, seo: v.seo ?? null, publishedAt: new Date(v.publishedAt), createdAt: at, updatedAt: at }),
  update: (db, id, v, at) => {
    const { publishedAt, seo, ...rest } = v;
    return db
      .update(s.blogPosts)
      .set({
        ...rest,
        ...("seo" in v && { seo: seo ?? null }),
        ...(publishedAt !== undefined && { publishedAt: new Date(publishedAt) }),
        updatedAt: at,
      })
      .where(eq(s.blogPosts.id, id));
  },
  remove: (db, id) => db.delete(s.blogPosts).where(eq(s.blogPosts.id, id)),
};

/* Etkinlik */

interface EventValue extends ArticleBase {
  summary: string;
  description: string;
  startDate: string;
  endDate: string;
  venue: string;
  city: string;
  country: string;
  logoUrl: string;
  images: string[];
  websiteUrl: string | undefined;
}

const eventRow = (r: typeof s.events.$inferSelect) => ({
  id: r.id,
  updatedAt: r.updatedAt,
  slug: r.slug,
  title: r.title,
  summary: r.summary,
  description: r.description,
  startDate: r.startDate,
  endDate: r.endDate,
  venue: r.venue,
  city: r.city,
  country: r.country,
  logoUrl: r.logoUrl,
  images: r.images,
  websiteUrl: r.websiteUrl ?? undefined,
  active: r.active,
  seo: r.seo ?? undefined,
});

const EVENTS: ArticleSpec<EventValue> = {
  target: "event",
  prefix: "/etkinlikler/",
  idPrefix: "e",
  entityType: "events",
  keys: ["slug", "title", "summary", "description", "startDate", "endDate", "venue", "city", "country", "logoUrl", "images", "websiteUrl", "active", "seo"],
  parse: (input) => {
    const base = parseBase(input);
    if (isFailureValue(base)) return base;
    const logoUrl = imageUrl(input.logoUrl);
    const images = imageList(input.images);
    const startDate = day(input.startDate);
    const endDate = day(input.endDate);
    if (images === undefined || !startDate || !endDate) return invalid();
    if (logoUrl === null || images === null) return uploadDisabled();
    return {
      ...base,
      summary: text(input.summary, MEDIUM),
      description: text(input.description, LONG),
      startDate,
      endDate,
      venue: text(input.venue, SHORT),
      city: text(input.city, SHORT),
      country: text(input.country, SHORT),
      logoUrl,
      images,
      websiteUrl: text(input.websiteUrl, 500) || undefined,
    };
  },
  draftError: eventDraftError,
  slugTaken: eventSlugTakenText,
  find: async (db, id) => {
    const [row] = id ? await db.select().from(s.events).where(eq(s.events.id, id)).for("update") : [];
    return row && eventRow(row);
  },
  owner: async (db, slug, exceptId) =>
    (await db.select({ title: s.events.title }).from(s.events).where(and(eq(s.events.slug, slug), ne(s.events.id, exceptId))))[0],
  insert: (db, id, v, at) =>
    db.insert(s.events).values({ id, ...v, seo: v.seo ?? null, websiteUrl: v.websiteUrl ?? null, createdAt: at, updatedAt: at }),
  update: (db, id, v, at) =>
    db
      .update(s.events)
      .set({
        ...v,
        ...("seo" in v && { seo: v.seo ?? null }),
        ...("websiteUrl" in v && { websiteUrl: v.websiteUrl ?? null }),
        updatedAt: at,
      })
      .where(eq(s.events.id, id)),
  remove: (db, id) => db.delete(s.events).where(eq(s.events.id, id)),
};

export const adminSaveNews = (db: AuditDb, actor: Actor, input: Input, at: Date) => saveArticle(NEWS, db, actor, input, at);
export const adminSetNewsActive = (db: AuditDb, actor: Actor, input: Input, at: Date) => setArticleActive(NEWS, db, actor, input, at);
export const adminDeleteNews = (db: AuditDb, actor: Actor, input: Input, at: Date) => deleteArticle(NEWS, db, actor, input, at);
export const adminSaveBlogPost = (db: AuditDb, actor: Actor, input: Input, at: Date) => saveArticle(BLOG, db, actor, input, at);
export const adminSetBlogPostActive = (db: AuditDb, actor: Actor, input: Input, at: Date) => setArticleActive(BLOG, db, actor, input, at);
export const adminDeleteBlogPost = (db: AuditDb, actor: Actor, input: Input, at: Date) => deleteArticle(BLOG, db, actor, input, at);
export const adminSaveEvent = (db: AuditDb, actor: Actor, input: Input, at: Date) => saveArticle(EVENTS, db, actor, input, at);
export const adminSetEventActive = (db: AuditDb, actor: Actor, input: Input, at: Date) => setArticleActive(EVENTS, db, actor, input, at);
export const adminDeleteEvent = (db: AuditDb, actor: Actor, input: Input, at: Date) => deleteArticle(EVENTS, db, actor, input, at);

/* ------------------------------ Sik sorulan sorular ------------------------------ */

const FAQ_KEYS = ["question", "answer", "topic"] as const;

/** Ekler (id yoksa, listenin sonuna) ya da gunceller. input: { id?, question, answer, topic, updatedAt? }. */
export async function adminSaveFaq(db: AuditDb, actor: Actor, input: Input, at: Date): Promise<PanelResult<{ id: string } & Saved>> {
  const topic = input.topic as (typeof FAQ_TOPICS)[number];
  if (!FAQ_TOPICS.includes(topic)) return invalid();
  const value = { question: text(input.question, MEDIUM), answer: text(input.answer, LONG), topic };
  const problem = faqDraftError(value);
  if (problem) return fail(400, problem);

  await serialize(db, "faqs");
  const id = text(input.id, 100);
  if (!id) {
    const [{ last }] = await db.select({ last: max(s.faqs.position) }).from(s.faqs);
    const created = newId("f");
    await db.insert(s.faqs).values({ id: created, ...value, position: (last ?? 0) + 1, createdAt: at, updatedAt: at });
    await writeAudit(db, actor, { action: "create", entityType: "faqs", entityId: created, entityLabel: value.question, changes: changedFields({} as typeof value, value, FAQ_KEYS) }, at);
    return { ...saved(at), id: created };
  }
  const [row] = await db.select().from(s.faqs).where(eq(s.faqs.id, id)).for("update");
  if (!row) return fail(404, notFound);
  if (iso(row.updatedAt) !== input.updatedAt) return fail(409, stale);
  const changes = changedFields(row as typeof value, value, FAQ_KEYS);
  if (!Object.keys(changes).length) return { ...unchanged(row), id };
  await db.update(s.faqs).set({ ...value, updatedAt: at }).where(eq(s.faqs.id, id));
  await writeAudit(db, actor, { action: "update", entityType: "faqs", entityId: id, entityLabel: value.question, changes }, at);
  return { ...saved(at), id };
}

/** Siler. input: { id, updatedAt }. */
export async function adminDeleteFaq(db: AuditDb, actor: Actor, input: Input, at: Date): Promise<PanelResult> {
  const id = text(input.id, 100);
  const [row] = id ? await db.select().from(s.faqs).where(eq(s.faqs.id, id)).for("update") : [];
  if (!row) return fail(404, notFound);
  if (iso(row.updatedAt) !== input.updatedAt) return fail(409, stale);
  await db.delete(s.faqs).where(eq(s.faqs.id, id));
  await writeAudit(
    db,
    actor,
    { action: "delete", entityType: "faqs", entityId: id, entityLabel: row.question, changes: { question: [row.question, null], topic: [row.topic, null] } },
    at,
  );
  return { ok: true };
}

/** Soruyu bir yukari (-1) ya da asagi (+1) tasir. Sira degisikligi kaydi eskitmez. */
export async function adminMoveFaq(db: AuditDb, actor: Actor, input: Input, at: Date): Promise<PanelResult> {
  const step = direction(input.direction);
  if (!step) return invalid();
  await serialize(db, "faqs");
  const rows = await db
    .select({ id: s.faqs.id, question: s.faqs.question, position: s.faqs.position })
    .from(s.faqs)
    .orderBy(asc(s.faqs.position), asc(s.faqs.id));
  const id = text(input.id, 100);
  if (!rows.some((r) => r.id === id)) return fail(404, notFound);
  for (const change of reorder(rows, id, step)) {
    await db.update(s.faqs).set({ position: change.after }).where(eq(s.faqs.id, change.id));
    await writeAudit(
      db,
      actor,
      {
        action: "update",
        entityType: "faqs",
        entityId: change.id,
        entityLabel: rows.find((r) => r.id === change.id)!.question,
        changes: { position: [change.before, change.after] },
      },
      at,
    );
  }
  return { ok: true };
}

/* ------------------------------ Hakkimizda ------------------------------ */

function parseAbout(value: unknown): Omit<AboutContent, "updatedAt"> | PanelFailure {
  const input = record(value);
  if (!Array.isArray(input.stats) || input.stats.length > 20 || !Array.isArray(input.sections) || input.sections.length > 50) return invalid();
  const heroImage = imageUrl(input.heroImage);
  const stats: AboutStat[] = input.stats
    .map((v) => record(v))
    .map((v) => ({ id: text(v.id, 100), value: text(v.value, 100), label: text(v.label, SHORT) }))
    // Degeri bos kutu kaydedilmez (demo ile ayni).
    .filter((v) => v.value);
  const sections: AboutSection[] = [];
  for (const v of input.sections.map((x) => record(x))) {
    const imageUrlValue = imageUrl(v.imageUrl);
    if (imageUrlValue === null) return uploadDisabled();
    sections.push({ id: text(v.id, 100), title: text(v.title, SHORT), body: text(v.body, LONG), ...(imageUrlValue && { imageUrl: imageUrlValue }) });
  }
  if (heroImage === null) return uploadDisabled();
  if ([...stats, ...sections].some((x) => !x.id) || new Set(sections.map((x) => x.id)).size !== sections.length) return invalid();
  return {
    heroTitle: text(input.heroTitle, SHORT),
    heroSubtitle: text(input.heroSubtitle, MEDIUM),
    ...(heroImage && { heroImage }),
    stats,
    sections,
  };
}

const ABOUT_KEYS = ["heroTitle", "heroSubtitle", "heroImage", "stats", "sections"] as const;

/** Hakkımızda sayfasini kaydeder (tek kayit). input: { about, updatedAt }. */
export async function adminSaveAbout(db: AuditDb, actor: Actor, input: Input, at: Date): Promise<PanelResult<Saved>> {
  const value = parseAbout(input.about);
  if (isFailureValue(value)) return value;
  const problem = aboutDraftError(value);
  if (problem) return fail(400, problem);

  await serialize(db, "about");
  const [row] = await db.select().from(s.aboutPage).where(eq(s.aboutPage.id, 1)).for("update");
  if (row && iso(row.updatedAt) !== input.updatedAt) return fail(409, stale);
  // Veritabani JSON alanlarinin sirasini degistirir; karsilastirma formdaki sirayla.
  const before = row
    ? {
        heroTitle: row.heroTitle,
        heroSubtitle: row.heroSubtitle,
        heroImage: row.heroImage ?? undefined,
        stats: row.stats.map((x) => ({ id: x.id, value: x.value, label: x.label })),
        sections: row.sections.map((x) => ({ id: x.id, title: x.title, body: x.body, ...(x.imageUrl && { imageUrl: x.imageUrl }) })),
      }
    : ({} as typeof value);
  const changes = changedFields(before, value, ABOUT_KEYS);
  if (row && !Object.keys(changes).length) return unchanged(row);
  const values = { ...value, heroImage: value.heroImage ?? null, updatedAt: at };
  if (row) await db.update(s.aboutPage).set(values).where(eq(s.aboutPage.id, 1));
  else await db.insert(s.aboutPage).values({ id: 1, ...values });
  await writeAudit(db, actor, { action: row ? "update" : "create", entityType: "about_page", entityId: "1", entityLabel: "Hakkımızda", changes }, at);
  return saved(at);
}
