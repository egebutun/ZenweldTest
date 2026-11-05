import { and, asc, desc, eq, gt, inArray, max, sql } from "drizzle-orm";
import {
  stockKey,
  type StockImportSummary,
  type StockSourceSummary,
  type StockSourceType,
  type ZenweldDatabase,
} from "@zenweld/data";
import { tr } from "@zenweld/i18n";
import { writeAudit, type Actor, type AuditDb } from "./audit";
import { fail, newId, saved, text, unchanged, type PanelResult, type Saved } from "./panel";
import { dealerStockRow, readCatalog, readDealers, readRetailers, readSettings, retailerStockRow, stockImportRow } from "./read";
import * as s from "./schema";

/**
 * PANEL › STOK MATRISI SUNUCUDA (veritabani modu; Asama 5, 4. alan, adim
 * 4.2; KARARLAR K-99, K-103)
 *
 * Okuma: her gorunum yalnizca gereken stogu alir (liste: kaynak basina ozet;
 * kaynak sayfasi: o kaynagin satirlari, gecmisi ve kod eslestirmeleri; Ürün
 * Bazında: adedi olan satirlar). Yazma: elle duzeltme (adet, fiyat, link,
 * satir ekleme ve silme) ve "kac gunden eski stok gosterilmez" ayari.
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
      .orderBy(desc(s.stockImports.createdAt));
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

/** Kaynak (bayi ya da bir bayiye bagli olmayan online satici) ve satirin anahtari. */
async function stockTarget(db: AuditDb, input: Input) {
  const sourceType: StockSourceType | null = input.sourceType === "dealer" ? "dealer" : input.sourceType === "retailer" ? "retailer" : null;
  const sourceId = text(input.sourceId, 100);
  const productId = text(input.productId, 100);
  const variantId = text(input.variantId, 200);
  if (!sourceType || !sourceId || !productId) return null;
  if (sourceType === "dealer") {
    const [dealer] = await db.select({ id: s.dealers.id }).from(s.dealers).where(eq(s.dealers.id, sourceId));
    if (!dealer) return null;
  } else {
    const [retailer] = await db.select({ id: s.retailers.id }).from(s.retailers).where(eq(s.retailers.id, sourceId));
    const [owner] = await db.select({ id: s.dealers.id }).from(s.dealers).where(eq(s.dealers.retailerId, sourceId));
    if (!retailer || owner) return null;
  }
  return { sourceType, sourceId, productId, variantId, label: text(input.label, 300) || productId };
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
