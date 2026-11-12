import { and, asc, desc, eq, gt, inArray, isNotNull, max, notInArray, sql } from "drizzle-orm";
import {
  STOCK_FILE_NO_HEADER,
  STOCK_FILE_NO_MATCH,
  STOCK_FILE_TRUNCATED,
  diffStock,
  looksTruncated,
  matchStockRows,
  normalizeCode,
  readStockSheet,
  stockKey,
  stockVersion,
  summarizeImport,
  type StockImportSummary,
  type StockRow,
  type StockSourceSummary,
  type StockSourceType,
  type ZenweldDatabase,
} from "@zenweld/data";
import { tr } from "@zenweld/i18n";
import { writeAudit, type Actor, type AuditDb } from "./audit";
import { fail, newId, saved, text, unchanged, type PanelResult, type Saved } from "./panel";
import { dealerStockRow, readCatalog, readDealers, readRetailers, readSettings, retailerStockRow, stockImportRow } from "./read";
import * as s from "./schema";
import { newestFirst } from "@zenweld/utils";

/**
 * PANEL › STOK MATRISI SUNUCUDA (veritabani modu; Asama 5, 4. alan, adim
 * 4.2; KARARLAR K-99, K-103)
 *
 * Okuma: her gorunum yalnizca gereken stogu alir (liste: kaynak basina ozet;
 * kaynak sayfasi: o kaynagin satirlari, gecmisi ve kod eslestirmeleri; Ürün
 * Bazında: adedi olan satirlar). Yazma: elle duzeltme (adet, fiyat, link,
 * satir ekleme ve silme), "kac gunden eski stok gosterilmez" ayari (adim
 * 4.2), dosya yukleme, kod eslestirme ve son yuklemenin geri alinmasi (adim
 * 4.3).
 * Kurallar demo modundaki panelle aynidir (packages/store › repo/stock.ts).
 */

type Input = Record<string, unknown>;

const iso = (value: Date) => value.toISOString();
const stale = tr.panel.staleRecord;
const notFound = tr.panel.recordNotFound;
const invalid = () => fail(400, tr.panel.invalidRequest);

/* ------------------------------ Okuma ------------------------------ */

/** Ekranin istedigi gorunum (adresten: ?kaynak=dealer:<id>, ?sekme=urun&urun=<id>). */
export type StockPanelView = { source: { type: StockSourceType; id: string } } | { tab: "urun"; productId?: string } | { tab: "kaynaklar" };

/** Online satici bir bayiye bagliysa ayri kaynak degildir; stogu bayinin dosyasindan gelir. */
const dealerStoreIds = (dealers: ZenweldDatabase["dealers"]) => new Set(dealers.flatMap((d) => (d.retailerId ? [d.retailerId] : [])));

/**
 * Stok Matrisi'nin verisi. Her gorunumde bayiler, saticilar, ayarlar (stok
 * ayarinin son degisiklik aniyla) ve urunler; ayrica:
 * - liste: kaynak basina satir sayisi, stoktaki satir ve son guncelleme
 *   (summaries);
 * - kaynak sayfasi: o kaynagin satirlari, gecmisi (geri alma kopyasinin
 *   kendisi gonderilmez, yalnizca var oldugu) ve kod eslestirmeleri;
 * - Ürün Bazında: aktif kaynaklarin adedi 0'dan buyuk satirlari.
 */
export async function readStockPanel(
  db: AuditDb,
  view: StockPanelView,
): Promise<{ data: Partial<ZenweldDatabase>; summaries?: StockSourceSummary[] }> {
  const dealers = await readDealers(db);
  const retailers = await readRetailers(db);
  const settings = await readSettings(db);
  const [stockRow] = await db.select({ updatedAt: s.settings.updatedAt }).from(s.settings).where(eq(s.settings.key, "stock"));
  const catalog = await readCatalog(db);
  const base: Partial<ZenweldDatabase> = {
    dealers,
    retailers,
    settings: { ...settings, stock: { ...settings.stock, ...(stockRow && { updatedAt: iso(stockRow.updatedAt) }) } },
    products: catalog.products,
    optionDefinitions: catalog.optionDefinitions,
    dealerStock: [],
    retailerStock: [],
    stockImports: [],
    skuAliases: [],
  };

  if ("source" in view) {
    const { type, id } = view.source;
    const rows =
      type === "dealer"
        ? (await db.select().from(s.dealerStock).where(eq(s.dealerStock.dealerId, id))).map(dealerStockRow)
        : (await db.select().from(s.retailerStock).where(eq(s.retailerStock.retailerId, id))).map(retailerStockRow);
    const history = await db
      .select()
      .from(s.stockImports)
      .where(and(eq(s.stockImports.sourceType, type), eq(s.stockImports.sourceId, id)))
      // Ekran son 30 kaydi gosterir (KARARLAR K-103); hepsi tabloda kalir.
      .orderBy(desc(s.stockImports.createdAt), desc(s.stockImports.id))
      .limit(30);
    const aliases = await db.select().from(s.skuAliases).where(eq(s.skuAliases.sourceId, id));
    return {
      data: {
        ...base,
        ...(type === "dealer" ? { dealerStock: rows as ZenweldDatabase["dealerStock"] } : { retailerStock: rows as ZenweldDatabase["retailerStock"] }),
        // Geri alma kopyasi sunucuda kalir; ekran yalnizca var oldugunu bilir.
        stockImports: history.map((h) => ({ ...stockImportRow(h), previous: h.previous ? [] : undefined })),
        skuAliases: aliases.map((a) => ({ sourceId: a.sourceId, code: a.code, productId: a.productId, variantId: a.variantId || undefined })),
      },
    };
  }

  if ("tab" in view && view.tab === "urun") {
    const activeDealers = dealers.filter((d) => d.active).map((d) => d.id);
    const stores = dealerStoreIds(dealers);
    const activeRetailers = retailers.filter((r) => r.active && !stores.has(r.id)).map((r) => r.id);
    const dealerStock = activeDealers.length
      ? await db
          .select()
          .from(s.dealerStock)
          .where(and(inArray(s.dealerStock.dealerId, activeDealers), gt(s.dealerStock.quantity, 0)))
          .orderBy(asc(s.dealerStock.dealerId))
      : [];
    const retailerStock = activeRetailers.length
      ? await db
          .select()
          .from(s.retailerStock)
          .where(and(inArray(s.retailerStock.retailerId, activeRetailers), gt(s.retailerStock.quantity, 0)))
          .orderBy(asc(s.retailerStock.retailerId))
      : [];
    return { data: { ...base, dealerStock: dealerStock.map(dealerStockRow), retailerStock: retailerStock.map(retailerStockRow) } };
  }

  const summary = async (table: typeof s.dealerStock | typeof s.retailerStock, column: typeof s.dealerStock.dealerId | typeof s.retailerStock.retailerId) =>
    db
      .select({
        id: column,
        rows: sql<number>`count(*)::int`,
        inStock: sql<number>`count(*) filter (where ${table.quantity} > 0)::int`,
        lastUpdate: max(table.updatedAt),
      })
      .from(table)
      .groupBy(column);
  const dealerRows = await summary(s.dealerStock, s.dealerStock.dealerId);
  const retailerRows = await summary(s.retailerStock, s.retailerStock.retailerId);
  const summaries: StockSourceSummary[] = [
    ...dealerRows.map((r) => ({ type: "dealer" as const, id: r.id, rows: r.rows, inStock: r.inStock, lastUpdate: r.lastUpdate ? iso(r.lastUpdate) : undefined })),
    ...retailerRows.map((r) => ({ type: "retailer" as const, id: r.id, rows: r.rows, inStock: r.inStock, lastUpdate: r.lastUpdate ? iso(r.lastUpdate) : undefined })),
  ];
  return { data: base, summaries };
}

/* ------------------------------ Elle duzeltme ------------------------------ */

const stockTable = (type: StockSourceType) => (type === "dealer" ? s.dealerStock : s.retailerStock);

/**
 * Stok kaynagi: bayi ya da bir bayiye bagli olmayan online satici (bagli
 * olaninki bayinin listesindedir). withUrl: dosyada Link sutunu okunur mu
 * (online satici ve online magazasi olan bayi).
 */
async function sourceOf(db: AuditDb, type: unknown, value: unknown) {
  const sourceType: StockSourceType | null = type === "dealer" ? "dealer" : type === "retailer" ? "retailer" : null;
  const id = text(value, 100);
  if (!sourceType || !id) return null;
  if (sourceType === "dealer") {
    const [dealer] = await db.select({ name: s.dealers.name, store: s.dealers.retailerId }).from(s.dealers).where(eq(s.dealers.id, id));
    return dealer ? { type: sourceType, id, name: dealer.name, withUrl: Boolean(dealer.store) } : null;
  }
  const [retailer] = await db.select({ name: s.retailers.name }).from(s.retailers).where(eq(s.retailers.id, id));
  const [owner] = await db.select({ id: s.dealers.id }).from(s.dealers).where(eq(s.dealers.retailerId, id));
  return retailer && !owner ? { type: sourceType, id, name: retailer.name, withUrl: true } : null;
}

/** Kaynak ve satirin anahtari. */
async function stockTarget(db: AuditDb, input: Input) {
  const source = await sourceOf(db, input.sourceType, input.sourceId);
  const productId = text(input.productId, 100);
  const variantId = text(input.variantId, 200);
  if (!source || !productId) return null;
  return { sourceType: source.type, sourceId: source.id, productId, variantId, label: text(input.label, 300) || productId };
}

type Target = NonNullable<Awaited<ReturnType<typeof stockTarget>>>;

/** Satiri kilitleyerek okur. */
async function lockedRow(db: AuditDb, t: Target) {
  const table = stockTable(t.sourceType);
  const owner = t.sourceType === "dealer" ? s.dealerStock.dealerId : s.retailerStock.retailerId;
  const [row] = await db
    .select()
    .from(table)
    .where(and(eq(owner, t.sourceId), eq(table.productId, t.productId), eq(table.variantId, t.variantId)))
    .for("update");
  return row as (typeof s.dealerStock.$inferSelect | typeof s.retailerStock.$inferSelect) | undefined;
}

const rowKey = (t: Target) => `${t.sourceId}/${stockKey({ productId: t.productId, variantId: t.variantId || undefined })}`;
const manualSummary = (): StockImportSummary => ({ rows: 1, matched: 1, unmatched: 0, invalid: 0, added: 0, changed: 0, zeroed: 0 });

async function history(db: AuditDb, actor: Actor, t: Target, note: string, summary: StockImportSummary, at: Date) {
  await db.insert(s.stockImports).values({
    id: newId("si"),
    sourceType: t.sourceType,
    sourceId: t.sourceId,
    kind: "manual",
    note,
    createdAt: at,
    createdBy: actor.name,
    ...summary,
  });
}

/**
 * Elle duzeltme: tek satirin adedi, fiyati ya da linki degisir veya satir
 * eklenir (patch). Istek satirin ekranda gorulen son degisiklik anini
 * tasir; yeni satirda tasimaz. Degisiklik stok gecmisine ve islem kaydina
 * yazilir.
 */
export async function adminSetStockLevel(db: AuditDb, actor: Actor, input: Input, at: Date): Promise<PanelResult<Saved>> {
  const t = await stockTarget(db, input);
  if (!t) return invalid();
  const patch = input.patch && typeof input.patch === "object" ? (input.patch as Record<string, unknown>) : {};
  const quantity = patch.quantity;
  const price = patch.price;
  const url = patch.url;
  if (quantity !== undefined && !(Number.isInteger(quantity) && (quantity as number) >= 0 && (quantity as number) < 1e9)) return invalid();
  if (price !== undefined && price !== null && !(typeof price === "number" && Number.isFinite(price) && price >= 0 && price < 1e10)) return invalid();
  if (url !== undefined && url !== null && !(typeof url === "string" && /^https?:\/\//i.test(url.trim()) && url.length <= 2000)) return invalid();

  const [product] = await db.select({ id: s.products.id, sku: s.products.sku }).from(s.products).where(eq(s.products.id, t.productId));
  if (!product) return fail(404, notFound);
  const [variant] = t.variantId
    ? await db
        .select({ sku: s.productVariants.sku })
        .from(s.productVariants)
        .where(and(eq(s.productVariants.productId, t.productId), eq(s.productVariants.id, t.variantId)))
    : [];
  if (t.variantId && !variant) return fail(404, notFound);

  const row = await lockedRow(db, t);
  const isNew = input.updatedAt === undefined || input.updatedAt === null || input.updatedAt === "";
  if (row && (isNew || iso(row.updatedAt) !== input.updatedAt)) return fail(409, stale);
  if (!row && !isNew) return fail(404, notFound);

  const before = row && { quantity: row.quantity, price: row.price, url: row.url };
  const after = {
    quantity: (quantity as number | undefined) ?? row?.quantity ?? 0,
    price: price === undefined ? (row?.price ?? null) : price === null ? null : Math.round((price as number) * 100) / 100,
    url: url === undefined ? (row?.url ?? null) : url === null ? null : (url as string).trim(),
  };
  if (row && before && before.quantity === after.quantity && before.price === after.price && before.url === after.url) return unchanged(row);

  const table = stockTable(t.sourceType);
  const owner = t.sourceType === "dealer" ? s.dealerStock.dealerId : s.retailerStock.retailerId;
  if (row) {
    await db
      .update(table)
      .set({ ...after, updatedAt: at })
      .where(and(eq(owner, t.sourceId), eq(table.productId, t.productId), eq(table.variantId, t.variantId)));
  } else {
    const values = { productId: t.productId, variantId: t.variantId, sku: variant?.sku ?? product.sku, ...after, updatedAt: at };
    if (t.sourceType === "dealer") await db.insert(s.dealerStock).values({ dealerId: t.sourceId, ...values });
    else await db.insert(s.retailerStock).values({ retailerId: t.sourceId, ...values });
  }

  // Gecmis notu ve ozet demodaki gibi (packages/store › setStockLevel).
  const parts: string[] = [];
  if (!before || before.quantity !== after.quantity) parts.push(`adet ${before?.quantity ?? "—"} → ${after.quantity}`);
  if (before?.price !== after.price && price !== undefined) parts.push(`fiyat ${before?.price ?? "—"} → ${after.price ?? "—"}`);
  if (before?.url !== after.url && url !== undefined) parts.push("link değişti");
  const summary = manualSummary();
  const wasIn = (before?.quantity ?? 0) > 0;
  if (!wasIn && after.quantity > 0) summary.added = 1;
  else if (wasIn && after.quantity <= 0) summary.zeroed = 1;
  else summary.changed = 1;
  await history(db, actor, t, `${t.label}: ${parts.join(", ") || "güncellendi"}${before ? "" : " (yeni satır)"}`, summary, at);

  const changes = Object.fromEntries(
    (["quantity", "price", "url"] as const)
      .filter((k) => !before || before[k] !== after[k])
      .map((k) => [k, before ? [before[k], after[k]] : after[k]]),
  );
  await writeAudit(
    db,
    actor,
    { action: before ? "update" : "create", entityType: `${t.sourceType}_stock`, entityId: rowKey(t), entityLabel: t.label, changes },
    at,
  );
  return saved(at);
}

/** Elle duzeltme: satiri kaynagin listesinden cikarir. */
export async function adminDeleteStockLevel(db: AuditDb, actor: Actor, input: Input, at: Date): Promise<PanelResult> {
  const t = await stockTarget(db, input);
  if (!t) return invalid();
  const row = await lockedRow(db, t);
  if (!row) return fail(404, notFound);
  if (iso(row.updatedAt) !== input.updatedAt) return fail(409, stale);
  const table = stockTable(t.sourceType);
  const owner = t.sourceType === "dealer" ? s.dealerStock.dealerId : s.retailerStock.retailerId;
  await db.delete(table).where(and(eq(owner, t.sourceId), eq(table.productId, t.productId), eq(table.variantId, t.variantId)));
  const summary = manualSummary();
  if (row.quantity > 0) summary.zeroed = 1;
  await history(db, actor, t, `${t.label}: listeden çıkarıldı (adet ${row.quantity})`, summary, at);
  await writeAudit(
    db,
    actor,
    {
      action: "delete",
      entityType: `${t.sourceType}_stock`,
      entityId: rowKey(t),
      entityLabel: t.label,
      changes: { sku: row.sku, quantity: row.quantity, price: row.price, url: row.url },
    },
    at,
  );
  return { ok: true };
}

/* ------------------------------ Ayar ------------------------------ */

/** "Kac gunden eski stok sitede gosterilmez" (0 = sinir yok, en fazla 365). */
export async function adminSaveStockSettings(db: AuditDb, actor: Actor, input: Input, at: Date): Promise<PanelResult<Saved>> {
  const staleDays = input.staleDays;
  if (!Number.isInteger(staleDays) || (staleDays as number) < 0 || (staleDays as number) > 365) return invalid();
  const [row] = await db.select().from(s.settings).where(eq(s.settings.key, "stock")).for("update");
  if (row && iso(row.updatedAt) !== input.updatedAt) return fail(409, stale);
  const before = (row?.value as { staleDays?: number } | undefined)?.staleDays;
  if (row && before === staleDays) return unchanged(row);
  if (row) await db.update(s.settings).set({ value: { staleDays }, updatedAt: at }).where(eq(s.settings.key, "stock"));
  else await db.insert(s.settings).values({ key: "stock", value: { staleDays }, updatedAt: at });
  await writeAudit(
    db,
    actor,
    { action: row ? "update" : "create", entityType: "settings", entityId: "stock", entityLabel: "Stok ayarı", changes: { staleDays: [before ?? null, staleDays] } },
    at,
  );
  return saved(at);
}

/* ------------------------------ Dosya yukleme, geri alma, eslestirme ------------------------------ */

/** Geri alma icin onceki stok, kaynagin son kac dosya yuklemesinde saklanir (KARARLAR K-103). */
const KEEP_SNAPSHOTS = 5;
/** Dosya tablosunun sinirlari (5 MB'lik bir dosya bunlarin altinda kalir). */
const MAX_ROWS = 20000;
const MAX_CELLS = 100;

/** Ayni kaynaga iki islem ayni anda gelmesin: kaynak bazinda sirayla. */
const lockSource = (db: AuditDb, type: StockSourceType, id: string) =>
  db.execute(sql`select pg_advisory_xact_lock(hashtext(${`stock:${type}:${id}`}))`);

const ownerColumn = (type: StockSourceType) => (type === "dealer" ? s.dealerStock.dealerId : s.retailerStock.retailerId);

/** Kaynagin satirlari, kaynak kimligi olmadan (gecmisteki onceki-hal kopyasi bu sekilde durur). */
async function sourceRows(db: AuditDb, type: StockSourceType, id: string): Promise<StockRow[]> {
  const table = stockTable(type);
  const rows = await db.select().from(table).where(eq(ownerColumn(type), id)).orderBy(asc(table.productId), asc(table.variantId));
  return rows.map((r) => ({
    productId: r.productId,
    ...(r.variantId && { variantId: r.variantId }),
    sku: r.sku,
    quantity: r.quantity,
    ...(r.price !== null && { price: r.price }),
    ...(r.url !== null && { url: r.url }),
    updatedAt: iso(r.updatedAt),
  }));
}

async function sourceHistory(db: AuditDb, type: StockSourceType, id: string) {
  return db
    .select({ id: s.stockImports.id, createdAt: s.stockImports.createdAt })
    .from(s.stockImports)
    .where(and(eq(s.stockImports.sourceType, type), eq(s.stockImports.sourceId, id)))
    .then((rows) => rows.map((r) => ({ id: r.id, createdAt: iso(r.createdAt) })));
}

/** Kaynagin stogunu verilen satirlarla degistirir (tam liste). */
async function replaceRows(db: AuditDb, type: StockSourceType, id: string, rows: StockRow[], importId: string | null) {
  await db.delete(stockTable(type)).where(eq(ownerColumn(type), id));
  const values = rows.map((r) => ({
    productId: r.productId,
    variantId: r.variantId ?? "",
    sku: r.sku,
    quantity: r.quantity,
    price: r.price ?? null,
    url: r.url ?? null,
    updatedAt: new Date(r.updatedAt),
    importId,
  }));
  for (let i = 0; i < values.length; i += 1000) {
    const chunk = values.slice(i, i + 1000);
    if (type === "dealer") await db.insert(s.dealerStock).values(chunk.map((v) => ({ dealerId: id, ...v })));
    else await db.insert(s.retailerStock).values(chunk.map((v) => ({ retailerId: id, ...v })));
  }
}

/** Gecmisin butun kayitlari kalir; onceki-hal kopyasi yalnizca son 5 dosya yuklemesinde tutulur. */
async function pruneSnapshots(db: AuditDb, type: StockSourceType, id: string) {
  const source = and(eq(s.stockImports.sourceType, type), eq(s.stockImports.sourceId, id), eq(s.stockImports.kind, "file"));
  const keep = await db
    .select({ id: s.stockImports.id })
    .from(s.stockImports)
    .where(source)
    .orderBy(desc(s.stockImports.createdAt), desc(s.stockImports.id))
    .limit(KEEP_SNAPSHOTS);
  await db
    .update(s.stockImports)
    .set({ previous: null })
    .where(and(source, isNotNull(s.stockImports.previous), notInArray(s.stockImports.id, keep.map((k) => k.id).concat(""))));
}

/** Dosyadan okunan tablo: satir x hucre (metin, sayi, evet/hayir ya da bos). */
function parseTable(value: unknown): unknown[][] | null {
  if (!Array.isArray(value) || value.length > MAX_ROWS) return null;
  for (const row of value) {
    if (!Array.isArray(row) || row.length > MAX_CELLS) return null;
    for (const cell of row) {
      const ok = cell === null || typeof cell === "number" || typeof cell === "boolean" || (typeof cell === "string" && cell.length <= 2000);
      if (!ok) return null;
    }
  }
  return value as unknown[][];
}

/**
 * Stok dosyasini uygular: kaynagin stogu dosyadaki listeyle DEGISTIRILIR
 * (tam liste). Dosyayi tarayici okur ve onizler; sunucu okunan tabloyu
 * ayni kurallarla (packages/data › readStockSheet, matchStockRows) veritabanindaki
 * urunler ve kod eslestirmeleriyle yeniden eslestirir. Onizleme acildiktan
 * sonra kaynagin stogu degistiyse (version) uygulanmaz. Onceki hal geri
 * alma icin kayda yazilir.
 */
export async function adminApplyStockImport(
  db: AuditDb,
  actor: Actor,
  input: Input,
  at: Date,
): Promise<PanelResult<{ id: string; summary: StockImportSummary } & Saved>> {
  const source = await sourceOf(db, input.sourceType, input.sourceId);
  if (Array.isArray(input.table) && input.table.length > MAX_ROWS) return fail(400, "Dosya çok uzun: en fazla 20.000 satır uygulanabilir.");
  const table = parseTable(input.table);
  if (!source || !table) return invalid();
  const fileName = text(input.fileName, 200) || "Dosya";

  await lockSource(db, source.type, source.id);
  const current = await sourceRows(db, source.type, source.id);
  if (stockVersion(current, await sourceHistory(db, source.type, source.id)) !== input.version) return fail(409, stale);

  const sheet = readStockSheet(table, { withUrl: source.withUrl });
  if (!sheet.columns) return fail(400, STOCK_FILE_NO_HEADER);
  const aliases = (await db.select().from(s.skuAliases).where(eq(s.skuAliases.sourceId, source.id))).map((a) => ({
    sourceId: a.sourceId,
    code: a.code,
    productId: a.productId,
    variantId: a.variantId || undefined,
  }));
  const file = matchStockRows(sheet, { sourceId: source.id, products: (await readCatalog(db)).products, aliases, at: iso(at) });
  if (!file.incoming.length) return fail(400, STOCK_FILE_NO_MATCH);
  if (looksTruncated(current, file.incoming) && input.confirmTruncated !== true) return fail(400, STOCK_FILE_TRUNCATED);

  const summary = summarizeImport(file, diffStock(current, file.incoming));
  const id = newId("si");
  await db.insert(s.stockImports).values({
    id,
    sourceType: source.type,
    sourceId: source.id,
    kind: "file",
    fileName,
    createdAt: at,
    createdBy: actor.name,
    ...summary,
    previous: current,
  });
  await replaceRows(db, source.type, source.id, file.incoming, id);
  await pruneSnapshots(db, source.type, source.id);
  await writeAudit(
    db,
    actor,
    { action: "create", entityType: "stock_imports", entityId: id, entityLabel: `${source.name}: ${fileName}`, changes: { kind: "file", fileName, ...summary } },
    at,
  );
  return { ...saved(at), id, summary };
}

/**
 * Son dosya yuklemesini geri alir: kaynagin stogu yuklemeden onceki hale
 * doner. Yalnizca kaynagin en son islemi olan, geri alinmamis ve onceki
 * hali saklanmis dosya yuklemesi geri alinir; bu arada baska islem
 * yapildiysa geri alinmaz.
 */
export async function adminRevertStockImport(db: AuditDb, actor: Actor, input: Input, at: Date): Promise<PanelResult<{ summary: StockImportSummary } & Saved>> {
  const importId = text(input.id, 100);
  const [found] = importId ? await db.select().from(s.stockImports).where(eq(s.stockImports.id, importId)) : [];
  if (!found) return fail(404, notFound);
  const source = await sourceOf(db, found.sourceType, found.sourceId);
  if (!source) return fail(404, notFound);

  await lockSource(db, source.type, source.id);
  const [record] = await db.select().from(s.stockImports).where(eq(s.stockImports.id, importId)).for("update");
  const [latest] = [...(await sourceHistory(db, source.type, source.id))].sort(
    (a, b) => newestFirst(a.createdAt, b.createdAt) || b.id.localeCompare(a.id),
  );
  if (!record || latest?.id !== record.id || record.kind !== "file" || record.revertedAt || !record.previous) return fail(409, stale);

  const current = await sourceRows(db, source.type, source.id);
  const restored = record.previous;
  const diff = diffStock(current, restored);
  await replaceRows(db, source.type, source.id, restored, null);
  await db.update(s.stockImports).set({ revertedAt: at }).where(eq(s.stockImports.id, record.id));
  const summary: StockImportSummary = {
    rows: restored.length,
    matched: restored.length,
    unmatched: 0,
    invalid: 0,
    added: diff.added.length,
    changed: diff.changed.length,
    zeroed: diff.zeroed.length,
  };
  await db.insert(s.stockImports).values({
    id: newId("si"),
    sourceType: source.type,
    sourceId: source.id,
    kind: "revert",
    note: `${record.fileName ?? "Dosya"} yüklemesi geri alındı`,
    createdAt: at,
    createdBy: actor.name,
    ...summary,
  });
  await writeAudit(
    db,
    actor,
    {
      action: "update",
      entityType: "stock_imports",
      entityId: record.id,
      entityLabel: `${source.name}: ${record.fileName ?? "Dosya"}`,
      changes: { revertedAt: [null, iso(at)], ...summary },
    },
    at,
  );
  return { ...saved(at), summary };
}

/**
 * Kod eslestirme: bayinin ya da saticinin kendi kodu bizim urunumuze (ya da
 * secenegine) baglanir; sonraki dosyalarda kendiliginden taninir. Stok
 * satirlarina dokunmaz.
 */
export async function adminSaveSkuAlias(db: AuditDb, actor: Actor, input: Input, at: Date): Promise<PanelResult> {
  const source = await sourceOf(db, input.sourceType, input.sourceId);
  const code = normalizeCode(text(input.code, 100));
  const productId = text(input.productId, 100);
  const variantId = text(input.variantId, 200);
  if (!source || !code || !productId) return invalid();
  const [product] = await db.select({ id: s.products.id }).from(s.products).where(eq(s.products.id, productId));
  const [variant] = variantId
    ? await db
        .select({ id: s.productVariants.id })
        .from(s.productVariants)
        .where(and(eq(s.productVariants.productId, productId), eq(s.productVariants.id, variantId)))
    : [];
  if (!product || (variantId && !variant)) return fail(404, notFound);

  const [before] = await db
    .select()
    .from(s.skuAliases)
    .where(and(eq(s.skuAliases.sourceId, source.id), eq(s.skuAliases.code, code)))
    .for("update");
  if (before && before.productId === productId && before.variantId === variantId) return { ok: true };
  await db
    .insert(s.skuAliases)
    .values({ sourceId: source.id, code, productId, variantId })
    .onConflictDoUpdate({ target: [s.skuAliases.sourceId, s.skuAliases.code], set: { productId, variantId } });
  await writeAudit(
    db,
    actor,
    {
      action: before ? "update" : "create",
      entityType: "sku_aliases",
      entityId: `${source.id}/${code}`,
      entityLabel: `${source.name}: ${code}`,
      changes: before
        ? { productId: [before.productId, productId], variantId: [before.variantId || null, variantId || null] }
        : { productId, variantId: variantId || null },
    },
    at,
  );
  return { ok: true };
}
