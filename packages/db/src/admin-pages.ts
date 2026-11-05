import { asc, eq, max, sql } from "drizzle-orm";
import {
  DOCUMENT_SECTIONS,
  TITLE_REQUIRED,
  documentAddressError,
  documentFileFromAddress,
  documentPageError,
  legalDraftError,
  type DocumentSection,
  type ZenweldDatabase,
} from "@zenweld/data";
import { tr } from "@zenweld/i18n";
import { changedFields, writeAudit, type Actor, type AuditDb } from "./audit";
import { checkRow, direction, fail, isFailure, newId, reorder, saved, text, unchanged, type PanelResult, type Saved } from "./panel";
import { readContent } from "./read";
import * as s from "./schema";

/**
 * PANEL › YASAL METINLER, BELGELER VE SAYFA SEO SUNUCUDA (Asama 5, 5. alan,
 * adim 5.3; KARARLAR K-99, K-104)
 *
 * Kurallar demo modundaki panelle aynidir (packages/data › content-rules.ts;
 * packages/store › repo/legal.ts, documents.ts, site.ts). Yazmalar panel.ts'teki
 * ortak kurallarla yapilir; basarili kayittan sonra sitenin icerik onbellegi
 * yenilenir (cagiran uc).
 *
 * - Yasal metinlerin listesi ve adresleri sabittir; baslik ve metin degisir.
 * - Sayfa SEO: iki alan da bos kalirsa satir silinir, sayfa varsayilan
 *   metne doner. Hangi sayfalarin duzenlenebilecegi sitenin sayfa listesine
 *   baglidir (cagiran uc verir: lib/page-meta.ts › isIndexablePage).
 * - Belgeler: dosya deposu gelene kadar dosya yuklenmez, dosyanin adresi
 *   girilir; adres kaydin dosya anahtarinda (file_key) durur, boyut 0 (K-104).
 */

type Input = Record<string, unknown>;

const iso = (value: Date) => value.toISOString();
const stale = tr.panel.staleRecord;
const notFound = tr.panel.recordNotFound;
const invalid = () => fail(400, tr.panel.invalidRequest);
/** Ayni kayda iki islem ayni anda gelmesin, sira karismasin diye bu kayitlar sirayla yapilir. */
const serialize = (db: AuditDb, name: string) => db.execute(sql`select pg_advisory_xact_lock(hashtext(${name}))`);

/** Kisa metin, adres ve uzun metin sinirlari (karakter). */
const SHORT = 300;
const MEDIUM = 2000;
const LONG = 100_000;

/** Satir yoksa ekranin gordugu an bos olmali; varsa ayni an. */
const sameStamp = (row: { updatedAt: Date } | undefined, input: Input) =>
  (row ? iso(row.updatedAt) : undefined) === ((typeof input.updatedAt === "string" && input.updatedAt) || undefined);

const sectionOf = (value: unknown): DocumentSection | null =>
  DOCUMENT_SECTIONS.find((d) => d.id === value)?.id ?? null;

/* ------------------------------ Okuma ------------------------------ */

/**
 * Yasal Metinler, Belgeler ve Sayfa SEO ekranlarinin verisi, son degisiklik
 * anlariyla (yasal metinlerde ve belgelerde zaten var).
 */
export async function readPagesPanel(db: AuditDb): Promise<Partial<ZenweldDatabase>> {
  const content = await readContent(db);
  const pageStamps = new Map(
    (await db.select({ section: s.documentPages.section, updatedAt: s.documentPages.updatedAt }).from(s.documentPages)).map(
      (r) => [r.section, iso(r.updatedAt)],
    ),
  );
  const seoStamps = new Map(
    (await db.select({ path: s.pageSeo.path, updatedAt: s.pageSeo.updatedAt }).from(s.pageSeo)).map((r) => [r.path, iso(r.updatedAt)]),
  );
  return {
    legalPages: content.legalPages,
    documentPages: content.documentPages.map((p) => ({ ...p, updatedAt: pageStamps.get(p.section) })),
    documents: content.documents,
    pageSeo: Object.fromEntries(
      Object.entries(content.pageSeo ?? {}).map(([path, fields]) => [path, { ...fields, updatedAt: seoStamps.get(path) }]),
    ),
  };
}

/* ------------------------------ Yasal metinler ------------------------------ */

/** Yasal metni kaydeder. input: { id, title, body, updatedAt }. */
export async function adminSaveLegalPage(db: AuditDb, actor: Actor, input: Input, at: Date): Promise<PanelResult<Saved>> {
  const next = { title: text(input.title, SHORT), body: text(input.body, LONG) };
  const error = legalDraftError(next);
  if (error) return fail(400, error);

  const id = text(input.id, 100);
  const [row] = await db.select().from(s.legalPages).where(eq(s.legalPages.id, id)).for("update");
  const checked = checkRow(row, input, notFound, stale);
  if (isFailure(checked)) return checked;

  const changes = changedFields(checked, next, ["title", "body"]);
  if (!Object.keys(changes).length) return unchanged(checked);
  await db.update(s.legalPages).set({ ...next, updatedAt: at }).where(eq(s.legalPages.id, id));
  await writeAudit(db, actor, { action: "update", entityType: "legal_pages", entityId: id, entityLabel: next.title, changes }, at);
  return saved(at);
}

/* ------------------------------ Sayfa SEO ------------------------------ */

/**
 * Sabit sayfanin arama basligini ve aciklamasini kaydeder. input: { path,
 * title, description, updatedAt? }. allowed: panelde duzenlenebilen sayfa mi
 * (sitenin sayfa listesi). Iki alan da bossa satir silinir.
 */
export async function adminSavePageSeo(
  db: AuditDb,
  actor: Actor,
  input: Input,
  at: Date,
  allowed: (path: string) => boolean,
): Promise<PanelResult<Saved>> {
  const path = text(input.path, 200);
  if (!allowed(path)) return invalid();
  const next = { title: text(input.title, 200) || null, description: text(input.description, 500) || null };

  await serialize(db, `page_seo:${path}`);
  const [row] = await db.select().from(s.pageSeo).where(eq(s.pageSeo.path, path));
  if (!sameStamp(row, input)) return fail(409, stale);
  const before = { title: row?.title ?? null, description: row?.description ?? null };
  const changes = changedFields(before, next, ["title", "description"]);
  if (!Object.keys(changes).length) return row ? unchanged(row) : { ok: true };

  const empty = !next.title && !next.description;
  if (empty) await db.delete(s.pageSeo).where(eq(s.pageSeo.path, path));
  else if (row) await db.update(s.pageSeo).set({ ...next, updatedAt: at }).where(eq(s.pageSeo.path, path));
  else await db.insert(s.pageSeo).values({ path, ...next, updatedAt: at });

  await writeAudit(
    db,
    actor,
    { action: empty ? "delete" : row ? "update" : "create", entityType: "page_seo", entityId: path, entityLabel: `Sayfa SEO: ${path}`, changes },
    at,
  );
  return empty ? { ok: true } : saved(at);
}

/* ------------------------------ Belge sayfalari ------------------------------ */

/** Belge sayfasinin basligini ve aciklamasini kaydeder. input: { section, title, subtitle, updatedAt? }. */
export async function adminSaveDocumentPage(db: AuditDb, actor: Actor, input: Input, at: Date): Promise<PanelResult<Saved>> {
  const section = sectionOf(input.section);
  if (!section) return invalid();
  const next = { title: text(input.title, SHORT), subtitle: text(input.subtitle, MEDIUM) };
  const error = documentPageError(next);
  if (error) return fail(400, error);

  await serialize(db, `document_pages:${section}`);
  const [row] = await db.select().from(s.documentPages).where(eq(s.documentPages.section, section));
  if (!sameStamp(row, input)) return fail(409, stale);
  const changes = changedFields(row ?? { title: "", subtitle: "" }, next, ["title", "subtitle"]);
  if (row && !Object.keys(changes).length) return unchanged(row);

  if (row) await db.update(s.documentPages).set({ ...next, updatedAt: at }).where(eq(s.documentPages.section, section));
  else await db.insert(s.documentPages).values({ section, ...next, updatedAt: at });
  await writeAudit(
    db,
    actor,
    {
      action: row ? "update" : "create",
      entityType: "document_pages",
      entityId: section,
      entityLabel: `Belge sayfası: ${DOCUMENT_SECTIONS.find((d) => d.id === section)!.label}`,
      changes,
    },
    at,
  );
  return saved(at);
}

/* ------------------------------ Belgeler ------------------------------ */

/** Adresi girilen dosya: adres dosya anahtarinda, ad ve tur adresten, boyut bilinmez (0). */
function fileOf(address: string, title: string) {
  const { fileName, mimeType, size } = documentFileFromAddress(address, title);
  return { fileKey: address, fileName, mimeType, sizeBytes: size };
}

const DOCUMENT_KEYS = ["title", "productId", "lotNumber", "fileKey", "fileName", "mimeType", "sizeBytes", "active"] as const;

/**
 * Belge ekler ya da gunceller. input: { id?, section, title, productId?,
 * lotNumber?, active, address?, updatedAt? }. Yeni belgede adres zorunlu;
 * duzenlemede adres bos birakilirsa eski dosya kalir. Parti numarasi
 * yalnizca parti sertifikalarinda tutulur. Yeni belge bolumun sonuna eklenir.
 */
export async function adminSaveDocument(db: AuditDb, actor: Actor, input: Input, at: Date): Promise<PanelResult<Saved & { id: string }>> {
  if (typeof input.active !== "boolean") return invalid();
  const title = text(input.title, SHORT);
  if (!title) return fail(400, TITLE_REQUIRED);
  const productId = text(input.productId, 100) || null;
  if (productId) {
    const [product] = await db.select({ id: s.products.id }).from(s.products).where(eq(s.products.id, productId));
    if (!product) return fail(400, "Seçilen ürün bulunamadı; sayfayı yenileyin.");
  }
  const address = text(input.address, MEDIUM);
  const id = text(input.id, 100);

  await serialize(db, "documents");
  const [row] = id ? await db.select().from(s.documents).where(eq(s.documents.id, id)).for("update") : [];
  if (id) {
    const checked = checkRow(row, input, notFound, stale);
    if (isFailure(checked)) return checked;
  }
  const section = row ? (row.section as DocumentSection) : sectionOf(input.section);
  if (!section) return invalid();
  if (!row || address) {
    const error = documentAddressError(address);
    if (error) return fail(400, error);
  }

  const fields = {
    title,
    productId,
    lotNumber: section === "parti-sertifikalari" ? text(input.lotNumber, 100) || null : null,
    active: input.active,
  };
  const file = address ? fileOf(address, title) : undefined;
  const next = { ...fields, ...file };

  if (row) {
    const changes = changedFields(row, { ...row, ...next }, DOCUMENT_KEYS);
    if (!Object.keys(changes).length) return { ...unchanged(row), id: row.id };
    await db.update(s.documents).set({ ...next, updatedAt: at }).where(eq(s.documents.id, row.id));
    await writeAudit(db, actor, { action: "update", entityType: "documents", entityId: row.id, entityLabel: title, changes }, at);
    return { ...saved(at), id: row.id };
  }

  const [{ last }] = await db.select({ last: max(s.documents.position) }).from(s.documents);
  const created = {
    id: newId("doc"),
    section,
    ...fields,
    ...fileOf(address, title),
    position: (last ?? 0) + 1,
    createdAt: at,
    updatedAt: at,
  };
  await db.insert(s.documents).values(created);
  await writeAudit(
    db,
    actor,
    {
      action: "create",
      entityType: "documents",
      entityId: created.id,
      entityLabel: title,
      changes: { section, title, productId, lotNumber: created.lotNumber, fileKey: created.fileKey, active: created.active },
    },
    at,
  );
  return { ...saved(at), id: created.id };
}

/** Belgeyi yayina alir ya da yayindan kaldirir. input: { id, active, updatedAt }. */
export async function adminSetDocumentActive(db: AuditDb, actor: Actor, input: Input, at: Date): Promise<PanelResult<Saved>> {
  if (typeof input.active !== "boolean") return invalid();
  const [row] = await db.select().from(s.documents).where(eq(s.documents.id, text(input.id, 100))).for("update");
  const checked = checkRow(row, input, notFound, stale);
  if (isFailure(checked)) return checked;
  if (checked.active === input.active) return unchanged(checked);
  await db.update(s.documents).set({ active: input.active, updatedAt: at }).where(eq(s.documents.id, checked.id));
  await writeAudit(
    db,
    actor,
    { action: "update", entityType: "documents", entityId: checked.id, entityLabel: checked.title, changes: { active: [checked.active, input.active] } },
    at,
  );
  return saved(at);
}

/** Belgeyi siler (dosya deposu olmadigi icin silinecek dosya yok). input: { id, updatedAt }. */
export async function adminDeleteDocument(db: AuditDb, actor: Actor, input: Input, at: Date): Promise<PanelResult> {
  const [row] = await db.select().from(s.documents).where(eq(s.documents.id, text(input.id, 100))).for("update");
  const checked = checkRow(row, input, notFound, stale);
  if (isFailure(checked)) return checked;
  await db.delete(s.documents).where(eq(s.documents.id, checked.id));
  await writeAudit(
    db,
    actor,
    {
      action: "delete",
      entityType: "documents",
      entityId: checked.id,
      entityLabel: checked.title,
      changes: { section: checked.section, title: checked.title, fileKey: checked.fileKey },
    },
    at,
  );
  return { ok: true };
}

/** Belgeyi kendi bolumu icinde bir yukari (-1) ya da asagi (+1) tasir. input: { id, direction }. */
export async function adminMoveDocument(db: AuditDb, actor: Actor, input: Input, at: Date): Promise<PanelResult> {
  const step = direction(input.direction);
  if (!step) return invalid();
  await serialize(db, "documents");
  const id = text(input.id, 100);
  const [doc] = await db.select({ section: s.documents.section }).from(s.documents).where(eq(s.documents.id, id));
  if (!doc) return fail(404, notFound);
  const rows = await db
    .select({ id: s.documents.id, title: s.documents.title, position: s.documents.position })
    .from(s.documents)
    .where(eq(s.documents.section, doc.section))
    .orderBy(asc(s.documents.position), asc(s.documents.id));
  for (const change of reorder(rows, id, step)) {
    await db.update(s.documents).set({ position: change.after }).where(eq(s.documents.id, change.id));
    await writeAudit(
      db,
      actor,
      {
        action: "update",
        entityType: "documents",
        entityId: change.id,
        entityLabel: rows.find((r) => r.id === change.id)!.title,
        changes: { position: [change.before, change.after] },
      },
      at,
    );
  }
  return { ok: true };
}
