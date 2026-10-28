"use client";

import {
  defaultSettings,
  diffStock,
  isInStock,
  isStockFresh,
  normalizeCode,
  stockKey,
  summarizeImport,
  type MatchedStockFile,
  type Retailer,
  type SkuAlias,
  type StockImport,
  type StockImportSummary,
  type StockRow,
  type StockSettings,
  type StockSourceType,
  type ZenweldDatabase,
} from "@zenweld/data";
import { getSnapshot, mutate, uid } from "../database";
import { nowIso } from "./shared";

/**
 * STOK — BAYI VE ONLINE SATICI STOKLARI
 *
 * Iki tablo (bkz. docs/STOK.md):
 *   dealerStock    (DB: dealer_stock)    bayiler -> haritadaki "stoktaki bayiler"
 *   retailerStock  (DB: retailer_stock)  bir bayiye bagli olmayan online saticilar
 * Online magazasi olan bayi (Dealer.retailerId) tek dosya gonderir: satirlar
 * dealerStock'a yazilir; linkli olanlar o magazanin online satici kartinda
 * da gorunur.
 *
 * Her fonksiyon ileride bir API ucuna karsilik gelir (bkz. docs/STOK.md).
 * Sayfalar stoga yalnizca bu fonksiyonlar uzerinden ulasir.
 */

/** Geri alma icin onceki stok, her kaynagin son kac dosya yuklemesinde saklanir */
const KEEP_SNAPSHOTS = 5;
/** Kaynak basina tutulan en fazla gecmis kaydi */
const KEEP_HISTORY = 60;

const sameSource = (l: { sourceType: StockSourceType; sourceId: string }, type: StockSourceType, id: string) =>
  l.sourceType === type && l.sourceId === id;

/** Kaynak kimligi olmadan satir (gecmisteki onceki-hal kopyalari icin) */
const plain = ({ productId, variantId, sku, quantity, price, url, updatedAt }: StockRow): StockRow => ({
  productId,
  variantId,
  sku,
  quantity,
  price,
  url,
  updatedAt,
});

/** Kaynagin stogunu verilen satirlarla degistirir (tam liste). */
function replaceStock(db: ZenweldDatabase, type: StockSourceType, id: string, rows: StockRow[]) {
  if (type === "dealer") {
    db.dealerStock = [...db.dealerStock.filter((r) => r.dealerId !== id), ...rows.map((r) => ({ ...plain(r), dealerId: id }))];
  } else {
    db.retailerStock = [...db.retailerStock.filter((r) => r.retailerId !== id), ...rows.map((r) => ({ ...plain(r), retailerId: id }))];
  }
}

/** Online saticisi bir bayiye bagli mi (stogu bayinin dosyasindan gelir) */
const isDealerStore = (retailerId: string, db: ZenweldDatabase) => db.dealers.some((d) => d.retailerId === retailerId);

/* ------------------------------------------------------------------ */
/* Ayar                                                                */
/* ------------------------------------------------------------------ */

export function getStockSettings(db: ZenweldDatabase = getSnapshot()): StockSettings {
  return { ...defaultSettings.stock, ...(db.settings?.stock ?? {}) };
}

export function saveStockSettings(stock: StockSettings): void {
  mutate((db) => {
    db.settings = { ...db.settings, stock };
  });
}

/* ------------------------------------------------------------------ */
/* Site: urun sayfasi                                                  */
/* ------------------------------------------------------------------ */

export interface RetailerInStock {
  retailer: Retailer;
  stock: StockRow;
}

/**
 * Sitede online satici kartinda gorunen satirlar: adet > 0, guncel ve
 * linki olan. Saticinin kendi listesinden ya da online magazasi olan
 * bayinin listesinden gelir.
 */
function onlineStock(
  db: ZenweldDatabase,
  now: number,
  filter: { productId?: string; retailerId?: string },
): RetailerInStock[] {
  const { staleDays } = getStockSettings(db);
  const visible = (row: StockRow) =>
    (!filter.productId || row.productId === filter.productId) && Boolean(row.url) && isInStock(row, staleDays, now);
  const activeRetailer = (id?: string) => db.retailers.find((r) => r.id === id && r.active);

  const result: RetailerInStock[] = [];
  db.retailerStock.forEach((row) => {
    if (!visible(row) || isDealerStore(row.retailerId, db)) return;
    const retailer = activeRetailer(row.retailerId);
    if (retailer) result.push({ retailer, stock: row });
  });
  db.dealers
    .filter((d) => d.active && d.retailerId)
    .forEach((dealer) => {
      const retailer = activeRetailer(dealer.retailerId);
      if (!retailer) return;
      db.dealerStock.forEach((row) => {
        if (row.dealerId === dealer.id && visible(row)) result.push({ retailer, stock: row });
      });
    });
  return filter.retailerId ? result.filter((r) => r.retailer.id === filter.retailerId) : result;
}

/**
 * Urunu stokta tutan (adet > 0, guncel, linkli) aktif online saticilar;
 * kendi magazamiz basta. variantId verilirse yalnizca o secenegi
 * bulunduranlar; secenek belirtilmemis kayitlar urunun tumu icin gecerlidir.
 */
export function retailersInStockFor(
  productId: string,
  db: ZenweldDatabase = getSnapshot(),
  now: number = Date.now(),
  variantId?: string,
): RetailerInStock[] {
  // Ayni magaza birden fazla satirda (secenekler) olabilir; bir kez
  // gosterilir. Kart secenegin kendi satirinin linkine gider.
  const byRetailer = new Map<string, RetailerInStock>();
  onlineStock(db, now, { productId })
    .filter((r) => !variantId || !r.stock.variantId || r.stock.variantId === variantId)
    .forEach((r) => {
      const seen = byRetailer.get(r.retailer.id);
      if (!seen || (variantId && r.stock.variantId === variantId && seen.stock.variantId !== variantId)) {
        byRetailer.set(r.retailer.id, r);
      }
    });
  return [...byRetailer.values()]
    .sort((a, b) =>
      a.retailer.isOwnStore !== b.retailer.isOwnStore
        ? a.retailer.isOwnStore
          ? -1
          : 1
        : a.retailer.name.localeCompare(b.retailer.name, "tr"),
    );
}

/** Online saticinin sitede kartinin gorundugu urun sayisi (panelde Online Saticilar). */
export function onlineProductCount(
  retailerId: string,
  db: ZenweldDatabase = getSnapshot(),
  now: number = Date.now(),
): number {
  return new Set(onlineStock(db, now, { retailerId }).map((r) => r.stock.productId)).size;
}

/**
 * Urunu stokta tutan bayiler. variantId verilirse yalnizca o secenegi
 * bulunduranlar; secenek belirtilmemis kayitlar urunun tumu icin gecerlidir.
 */
export function dealersWithProduct(
  productId: string,
  db: ZenweldDatabase = getSnapshot(),
  variantId?: string,
  now: number = Date.now(),
): Set<string> {
  const { staleDays } = getStockSettings(db);
  return new Set(
    db.dealerStock
      .filter(
        (l) =>
          l.productId === productId &&
          (!variantId || !l.variantId || l.variantId === variantId) &&
          isInStock(l, staleDays, now),
      )
      .map((l) => l.dealerId),
  );
}

/** Urun sayfasindaki "stok bilgisi ... tarihinde guncellendi" icin: saticilarin en son guncellemesi. */
export function lastStockUpdate(
  productId: string,
  db: ZenweldDatabase = getSnapshot(),
  now: number = Date.now(),
  variantId?: string,
): string | undefined {
  return retailersInStockFor(productId, db, now, variantId)
    .map((r) => r.stock.updatedAt)
    .sort()
    .pop();
}

/* ------------------------------------------------------------------ */
/* Panel: kaynaklar                                                    */
/* ------------------------------------------------------------------ */

export interface StockSource {
  type: StockSourceType;
  id: string;
  name: string;
  city?: string;
  isOwnStore?: boolean;
  /** Bayinin online magazasi (Online Saticilar kaydi) */
  onlineStore?: Retailer;
  /** Dosyada Link sutunu okunur mu: online saticilar ve online magazasi olan bayiler */
  withUrl: boolean;
}

/**
 * Stok gonderen aktif bayiler ve online saticilar. Bir bayiye bagli online
 * satici ayri kaynak degildir; stogu bayinin dosyasindan gelir.
 */
export function listStockSources(db: ZenweldDatabase = getSnapshot()): StockSource[] {
  return [
    ...db.dealers
      .filter((d) => d.active)
      .map((d): StockSource => {
        const onlineStore = db.retailers.find((r) => r.id === d.retailerId);
        return { type: "dealer", id: d.id, name: d.name, city: d.city, onlineStore, withUrl: Boolean(onlineStore) };
      }),
    ...db.retailers
      .filter((r) => r.active && !isDealerStore(r.id, db))
      .map((r): StockSource => ({ type: "retailer", id: r.id, name: r.name, city: r.city, isOwnStore: r.isOwnStore, withUrl: true })),
  ];
}

export function findStockSource(type: StockSourceType, id: string, db: ZenweldDatabase = getSnapshot()) {
  return listStockSources(db).find((s) => s.type === type && s.id === id);
}

/** Kaynagin satirlari (dizideki kayitlarin kendisi; mutate icinde degistirilebilir). */
export function stockOfSource(type: StockSourceType, id: string, db: ZenweldDatabase = getSnapshot()): StockRow[] {
  return type === "dealer"
    ? db.dealerStock.filter((r) => r.dealerId === id)
    : db.retailerStock.filter((r) => r.retailerId === id);
}

export interface SourceStatus {
  rows: number;
  /** Adedi 0'dan buyuk satir */
  inStock: number;
  lastUpdate?: string;
  /** Son guncelleme sinir icinde mi (sitede gorunur mu) */
  fresh: boolean;
  /** Son guncellemeden bu yana gecen gun */
  ageDays?: number;
}

export function sourceStatus(
  type: StockSourceType,
  id: string,
  db: ZenweldDatabase = getSnapshot(),
  now: number = Date.now(),
): SourceStatus {
  const rows = stockOfSource(type, id, db);
  const lastUpdate = rows.map((r) => r.updatedAt).sort().pop();
  const { staleDays } = getStockSettings(db);
  return {
    rows: rows.length,
    inStock: rows.filter((r) => r.quantity > 0).length,
    lastUpdate,
    fresh: lastUpdate ? isStockFresh(lastUpdate, staleDays, now) : false,
    ageDays: lastUpdate ? Math.floor((now - new Date(lastUpdate).getTime()) / 86_400_000) : undefined,
  };
}

/** Kaynagin gecmisi (yeniden eskiye). */
export function stockHistory(type: StockSourceType, id: string, db: ZenweldDatabase = getSnapshot()): StockImport[] {
  return db.stockImports
    .filter((i) => sameSource(i, type, id))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Geri alinabilecek kayit: kaynagin en son islemi, dosya yuklemesi, onceki hali saklanmis. */
export function revertableImport(type: StockSourceType, id: string, db: ZenweldDatabase = getSnapshot()) {
  const last = stockHistory(type, id, db)[0];
  return last && last.kind === "file" && !last.revertedAt && last.previous ? last : undefined;
}

/** Hicbir online saticida stokta (adet > 0, guncel) gorunmeyen aktif urunler. */
export function productsWithoutOnlineStock(db: ZenweldDatabase = getSnapshot(), now: number = Date.now()) {
  return db.products.filter((p) => p.active && retailersInStockFor(p.id, db, now).length === 0);
}

export interface SourcedStockRow extends StockRow {
  sourceType: StockSourceType;
  sourceId: string;
}

/** Bir urunun tum kaynaklardaki stogu (panelde urun bazinda gorunum). */
export function stockOfProduct(productId: string, db: ZenweldDatabase = getSnapshot()): SourcedStockRow[] {
  return [
    ...db.dealerStock
      .filter((r) => r.productId === productId)
      .map((r): SourcedStockRow => ({ ...plain(r), sourceType: "dealer", sourceId: r.dealerId })),
    ...db.retailerStock
      .filter((r) => r.productId === productId)
      .map((r): SourcedStockRow => ({ ...plain(r), sourceType: "retailer", sourceId: r.retailerId })),
  ];
}

/* ------------------------------------------------------------------ */
/* Panel: yazma                                                        */
/* ------------------------------------------------------------------ */

/** Eski kayitlarin onceki-hal kopyalarini ve fazla gecmisi temizler (depo boyutu icin). */
function prune(db: ZenweldDatabase, type: StockSourceType, id: string) {
  let files = 0;
  let count = 0;
  const keep = new Set<string>();
  db.stockImports
    .filter((i) => sameSource(i, type, id))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .forEach((i) => {
      count += 1;
      if (count <= KEEP_HISTORY) keep.add(i.id);
      if (i.kind === "file" && i.previous) {
        files += 1;
        if (files > KEEP_SNAPSHOTS) delete i.previous;
      }
    });
  db.stockImports = db.stockImports.filter((i) => !sameSource(i, type, id) || keep.has(i.id));
}

/**
 * Dosyayi uygular: kaynagin stogu dosyadaki listeyle DEGISTIRILIR (tam
 * liste). Onceki hal geri alma icin kayda yazilir. Kaydedilemezse (tarayici
 * deposu dolu) null doner.
 */
export function applyStockImport(args: {
  sourceType: StockSourceType;
  sourceId: string;
  fileName: string;
  file: MatchedStockFile;
  by?: string;
}): StockImport | null {
  const at = nowIso();
  const record: StockImport = {
    id: uid("si"),
    sourceType: args.sourceType,
    sourceId: args.sourceId,
    kind: "file",
    fileName: args.fileName,
    createdAt: at,
    createdBy: args.by,
    summary: { rows: 0, matched: 0, unmatched: 0, invalid: 0, added: 0, changed: 0, zeroed: 0 },
  };
  const saved = mutate((db) => {
    const current = stockOfSource(args.sourceType, args.sourceId, db).map(plain);
    const incoming = args.file.incoming.map((l) => ({ ...l, updatedAt: at }));
    record.summary = summarizeImport(args.file, diffStock(current, incoming));
    record.previous = current;
    replaceStock(db, args.sourceType, args.sourceId, incoming);
    db.stockImports.push(record);
    prune(db, args.sourceType, args.sourceId);
  });
  return saved ? record : null;
}

/** Son dosya yuklemesini geri alir: kaynagin stogu yuklemeden onceki hale doner. */
export function revertStockImport(importId: string, by?: string): boolean {
  const target = getSnapshot().stockImports.find((i) => i.id === importId);
  if (!target || revertableImport(target.sourceType, target.sourceId)?.id !== importId) return false;
  return mutate((db) => {
    const at = nowIso();
    const rec = db.stockImports.find((i) => i.id === importId)!;
    const current = stockOfSource(rec.sourceType, rec.sourceId, db);
    const restored = rec.previous ?? [];
    const diff = diffStock(current, restored);
    replaceStock(db, rec.sourceType, rec.sourceId, restored);
    rec.revertedAt = at;
    db.stockImports.push({
      id: uid("si"),
      sourceType: rec.sourceType,
      sourceId: rec.sourceId,
      kind: "revert",
      createdAt: at,
      createdBy: by,
      note: `${rec.fileName ?? "Dosya"} yüklemesi geri alındı`,
      summary: { rows: restored.length, matched: restored.length, unmatched: 0, invalid: 0, added: diff.added.length, changed: diff.changed.length, zeroed: diff.zeroed.length },
    });
    prune(db, rec.sourceType, rec.sourceId);
  });
}

const emptySummary = (): StockImportSummary => ({ rows: 1, matched: 1, unmatched: 0, invalid: 0, added: 0, changed: 0, zeroed: 0 });

/**
 * Elle duzeltme: tek satirin adedi, fiyati ya da linki degisir veya satir
 * eklenir. Degisiklik gecmise yazilir.
 */
export function setStockLevel(args: {
  sourceType: StockSourceType;
  sourceId: string;
  productId: string;
  variantId?: string;
  patch: Partial<Pick<StockRow, "quantity" | "price" | "url" | "sku">>;
  by?: string;
  /** Gecmiste gorunecek urun adi */
  label: string;
}): void {
  mutate((db) => {
    const at = nowIso();
    const key = stockKey(args);
    const find = () => stockOfSource(args.sourceType, args.sourceId, db).find((l) => stockKey(l) === key);
    const row = find();
    const before = row ? { ...row } : undefined;
    if (row) Object.assign(row, args.patch, { updatedAt: at });
    else {
      const product = db.products.find((p) => p.id === args.productId);
      const option = product?.options?.variants.find((v) => v.id === args.variantId);
      const added: StockRow = {
        productId: args.productId,
        variantId: args.variantId,
        sku: args.patch.sku ?? option?.sku ?? product?.sku ?? "",
        quantity: args.patch.quantity ?? 0,
        price: args.patch.price,
        url: args.patch.url,
        updatedAt: at,
      };
      if (args.sourceType === "dealer") db.dealerStock.push({ ...added, dealerId: args.sourceId });
      else db.retailerStock.push({ ...added, retailerId: args.sourceId });
    }
    const after = find()!;
    const parts: string[] = [];
    if ((before?.quantity ?? 0) !== after.quantity || !before) parts.push(`adet ${before?.quantity ?? "—"} → ${after.quantity}`);
    if (before?.price !== after.price && args.patch.price !== undefined) parts.push(`fiyat ${before?.price ?? "—"} → ${after.price ?? "—"}`);
    if (before?.url !== after.url && args.patch.url !== undefined) parts.push("link değişti");
    const summary = emptySummary();
    const wasIn = (before?.quantity ?? 0) > 0;
    if (!wasIn && after.quantity > 0) summary.added = 1;
    else if (wasIn && after.quantity <= 0) summary.zeroed = 1;
    else summary.changed = 1;
    db.stockImports.push({
      id: uid("si"),
      sourceType: args.sourceType,
      sourceId: args.sourceId,
      kind: "manual",
      createdAt: at,
      createdBy: args.by,
      note: `${args.label}: ${parts.join(", ") || "güncellendi"}${before ? "" : " (yeni satır)"}`,
      summary,
    });
    prune(db, args.sourceType, args.sourceId);
  });
}

/** Elle duzeltme: satiri kaynagin listesinden cikarir. */
export function deleteStockLevel(args: {
  sourceType: StockSourceType;
  sourceId: string;
  productId: string;
  variantId?: string;
  by?: string;
  label: string;
}): void {
  mutate((db) => {
    const key = stockKey(args);
    const rows = stockOfSource(args.sourceType, args.sourceId, db);
    const row = rows.find((l) => stockKey(l) === key);
    if (!row) return;
    replaceStock(db, args.sourceType, args.sourceId, rows.filter((l) => stockKey(l) !== key));
    const summary = emptySummary();
    if (row.quantity > 0) summary.zeroed = 1;
    db.stockImports.push({
      id: uid("si"),
      sourceType: args.sourceType,
      sourceId: args.sourceId,
      kind: "manual",
      createdAt: nowIso(),
      createdBy: args.by,
      note: `${args.label}: listeden çıkarıldı (adet ${row.quantity})`,
      summary,
    });
    prune(db, args.sourceType, args.sourceId);
  });
}

/* ------------------------------------------------------------------ */
/* Kod eslestirme                                                      */
/* ------------------------------------------------------------------ */

export function skuAliasesOf(sourceId: string, db: ZenweldDatabase = getSnapshot()): SkuAlias[] {
  return db.skuAliases.filter((a) => a.sourceId === sourceId);
}

/** Bayinin kendi kodunu bizim urunumuze baglar; bir sonraki dosyada kendiliginden eslesir. */
export function saveSkuAlias(alias: SkuAlias): void {
  const code = normalizeCode(alias.code);
  mutate((db) => {
    db.skuAliases = [
      ...db.skuAliases.filter((a) => !(a.sourceId === alias.sourceId && a.code === code)),
      { ...alias, code },
    ];
  });
}

export function deleteSkuAlias(sourceId: string, code: string): void {
  mutate((db) => {
    db.skuAliases = db.skuAliases.filter((a) => !(a.sourceId === sourceId && a.code === code));
  });
}

/** Kaynak silinince stoku, gecmisi ve eslestirmeleri de silinir. */
export function removeStockOfSource(db: ZenweldDatabase, type: StockSourceType, id: string): void {
  replaceStock(db, type, id, []);
  db.stockImports = db.stockImports.filter((i) => !sameSource(i, type, id));
  db.skuAliases = db.skuAliases.filter((a) => a.sourceId !== id);
}
