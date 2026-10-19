import type { Product, SkuAlias, StockImportSummary, StockRow } from "./types";

/**
 * STOK DOSYASI — OKUMA, ESLESTIRME, FARK
 *
 * Bayilerden ve online saticilardan gelen gunluk stok listesinin isleme
 * adimlari. Hepsi saf fonksiyondur (tarayiciya ya da veritabanina bagli
 * degil); backend kuruldugunda sunucuda aynen kullanilabilir:
 *
 *   1. readStockSheet()   tablo (satir x hucre) -> ham satirlar + hatalar
 *   2. matchStockRows()   kod -> urun/secenek (SKU, secenek SKU'su, eslestirme tablosu)
 *   3. diffStock()        mevcut stok <-> dosya: giren, degisen, cikan
 *
 * Her dosya o kaynagin TAM listesidir: dosyada olmayan urun stoktan cikar.
 */

/* ------------------------------------------------------------------ */
/* Yardimcilar                                                         */
/* ------------------------------------------------------------------ */

/** Kod karsilastirmasi: bosluklar atilir, buyuk harf (Turkce i/I donusumu yapilmaz). */
export const normalizeCode = (code: string) => code.replace(/\s+/g, "").toUpperCase();

/** Ayni urun/secenek satirini tanimlayan anahtar */
export const stockKey = (row: { productId: string; variantId?: string }) =>
  `${row.productId}|${row.variantId ?? ""}`;

/** Kayit sitede gosterilecek kadar yeni mi? staleDays 0 ise sinir yok. */
export function isStockFresh(updatedAt: string, staleDays: number, now: number = Date.now()): boolean {
  if (!staleDays) return true;
  return now - new Date(updatedAt).getTime() <= staleDays * 86_400_000;
}

/** Sitede "stokta" sayilir mi: adet > 0 ve guncel. */
export const isInStock = (row: StockRow, staleDays: number, now?: number) =>
  row.quantity > 0 && isStockFresh(row.updatedAt, staleDays, now);

/**
 * Turkce ve Ingilizce sayi bicimleri: "12", "1.234", "1.234,50", "12,5",
 * "12.5", "₺ 1.250". Okunamazsa null.
 */
export function parseNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (value == null) return null;
  let s = String(value).replace(/[^\d.,-]/g, "");
  if (!s || s === "-") return null;
  const lastDot = s.lastIndexOf(".");
  const lastComma = s.lastIndexOf(",");
  if (lastDot >= 0 && lastComma >= 0) {
    // Hangisi sondaysa ondalik ayiracidir.
    s = lastComma > lastDot ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "");
  } else if (lastComma >= 0) {
    s = s.replace(",", ".");
  } else if (lastDot >= 0) {
    // "1.234" binlik, "12.5" ondalik
    const decimals = s.length - lastDot - 1;
    if (decimals === 3 || s.split(".").length > 2) s = s.replace(/\./g, "");
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

const asText = (value: unknown) =>
  value == null ? "" : value instanceof Date ? value.toISOString() : String(value).trim();

/** Baslik karsilastirmasi: kucuk harf, Turkce karakterler sadelestirilmis */
const simplify = (s: string) =>
  s
    .toLocaleLowerCase("tr")
    .replace(/[ıi̇]/g, "i")
    .replace(/ş/g, "s")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/* ------------------------------------------------------------------ */
/* 1. Dosyayi okuma                                                    */
/* ------------------------------------------------------------------ */

/** Taninan sutun basliklari (sadelestirilmis hali). */
const HEADERS = {
  code: ["sku", "urun kodu", "stok kodu", "kod", "urun kod", "malzeme kodu", "model kodu", "code", "product code"],
  quantity: ["adet", "stok", "stok adedi", "miktar", "mevcut", "stok miktari", "quantity", "qty", "stock"],
  price: ["fiyat", "satis fiyati", "fiyat tl", "kdv dahil fiyat", "price"],
  url: ["link", "url", "urun linki", "urun adresi", "adres", "baglanti", "urun url"],
};

export interface StockColumns {
  /** Basligin bulundugu satir (0'dan); baslik yoksa -1 */
  headerRow: number;
  code: number;
  quantity: number;
  price?: number;
  url?: number;
}

/** Ilk 10 satirda basligi arar; bulunamazsa sablon sirasi varsayilir (kod, adet, fiyat, link). */
export function detectStockColumns(rows: unknown[][]): StockColumns {
  for (let r = 0; r < Math.min(rows.length, 10); r++) {
    const cells = rows[r].map((c) => simplify(asText(c)));
    const find = (names: string[]) => cells.findIndex((c) => names.includes(c));
    const code = find(HEADERS.code);
    const quantity = find(HEADERS.quantity);
    if (code >= 0 && quantity >= 0) {
      const price = find(HEADERS.price);
      const url = find(HEADERS.url);
      return { headerRow: r, code, quantity, price: price >= 0 ? price : undefined, url: url >= 0 ? url : undefined };
    }
  }
  return { headerRow: -1, code: 0, quantity: 1, price: 2, url: 3 };
}

export interface StockFileRow {
  /** Dosyadaki satir numarasi (1'den, Excel'deki gibi) */
  line: number;
  code: string;
  quantity: number;
  price?: number;
  url?: string;
  /** Satir kullanilamaz (kod bos, adet okunamadi ...) */
  error?: string;
  /** Satir kullanildi ama dikkat (eksi adet 0 sayildi ...) */
  warning?: string;
}

export interface StockSheet {
  columns: StockColumns;
  rows: StockFileRow[];
}

/**
 * Okunan tabloyu satirlara cevirir. Link sutunu yalnizca withUrl ise okunur
 * (online saticilar ve online magazasi olan bayiler).
 */
export function readStockSheet(table: unknown[][], options: { withUrl: boolean }): StockSheet {
  const columns = detectStockColumns(table);
  const rows: StockFileRow[] = [];
  table.forEach((cells, index) => {
    if (index <= columns.headerRow) return;
    if (cells.every((c) => asText(c) === "")) return;
    const line = index + 1;
    const code = asText(cells[columns.code]);
    const rawQty = cells[columns.quantity];
    const qty = parseNumber(rawQty);
    const row: StockFileRow = { line, code, quantity: 0 };

    if (!code) row.error = "Ürün kodu boş";
    else if (qty === null) row.error = `Adet okunamadı (${asText(rawQty) || "boş"})`;
    else if (!Number.isInteger(qty)) row.error = `Adet tam sayı olmalı (${asText(rawQty)})`;
    else if (qty < 0) {
      row.warning = `Eksi adet (${qty}) 0 sayıldı`;
    } else row.quantity = qty;

    if (columns.price !== undefined) {
      const price = parseNumber(cells[columns.price]);
      if (price !== null && price >= 0) row.price = price;
    }
    if (options.withUrl && columns.url !== undefined) {
      const url = asText(cells[columns.url]);
      if (url) {
        if (/^https?:\/\//i.test(url)) row.url = url;
        else row.warning = [row.warning, "Link http(s):// ile başlamıyor, alınmadı"].filter(Boolean).join(" · ");
      }
    }
    rows.push(row);
  });
  return { columns, rows };
}

/* ------------------------------------------------------------------ */
/* 2. Eslestirme                                                       */
/* ------------------------------------------------------------------ */

export interface StockMatch {
  productId: string;
  variantId?: string;
  /** Eslestirme tablosundan mi bulundu */
  viaAlias?: boolean;
}

/** Kod -> urun/secenek sozlugu: urun SKU'lari, secenek SKU'lari, kaynaga ozel eslestirmeler. */
export function buildCodeIndex(products: Product[], aliases: SkuAlias[], sourceId: string) {
  const index = new Map<string, StockMatch>();
  products.forEach((p) => {
    index.set(normalizeCode(p.sku), { productId: p.id });
    p.variantGroups?.[0]?.options.forEach((o) => {
      if (o.sku) index.set(normalizeCode(o.sku), { productId: p.id, variantId: o.id });
    });
  });
  aliases
    .filter((a) => a.sourceId === sourceId)
    .forEach((a) => index.set(normalizeCode(a.code), { productId: a.productId, variantId: a.variantId, viaAlias: true }));
  return index;
}

export interface MatchedStockRow extends StockFileRow {
  match?: StockMatch;
  /** Ayni urun dosyada birden fazla kez geciyorsa ilk satirlar devre disi kalir */
  duplicateOf?: number;
}

export interface MatchedStockFile {
  rows: MatchedStockRow[];
  /** Uygulanacak stok satirlari (dosyanin son hali) */
  incoming: StockRow[];
  unmatched: MatchedStockRow[];
  invalid: MatchedStockRow[];
  duplicates: MatchedStockRow[];
}

export function matchStockRows(
  sheet: StockSheet,
  ctx: {
    sourceId: string;
    products: Product[];
    aliases: SkuAlias[];
    at: string;
  },
): MatchedStockFile {
  const index = buildCodeIndex(ctx.products, ctx.aliases, ctx.sourceId);
  const rows: MatchedStockRow[] = sheet.rows.map((r) =>
    r.error ? { ...r } : { ...r, match: index.get(normalizeCode(r.code)) },
  );

  // Ayni urun birden fazla satirdaysa son satir gecerlidir.
  const lastLine = new Map<string, number>();
  rows.forEach((r) => r.match && lastLine.set(stockKey(r.match), r.line));
  rows.forEach((r) => {
    if (!r.match) return;
    const last = lastLine.get(stockKey(r.match))!;
    if (last !== r.line) r.duplicateOf = last;
  });

  const incoming: StockRow[] = rows
    .filter((r) => r.match && !r.duplicateOf)
    .map((r) => ({
      productId: r.match!.productId,
      variantId: r.match!.variantId,
      sku: r.code,
      quantity: r.quantity,
      price: r.price,
      url: r.url,
      updatedAt: ctx.at,
    }));

  return {
    rows,
    incoming,
    unmatched: rows.filter((r) => !r.error && !r.match),
    invalid: rows.filter((r) => r.error),
    duplicates: rows.filter((r) => r.duplicateOf),
  };
}

/* ------------------------------------------------------------------ */
/* 3. Fark                                                             */
/* ------------------------------------------------------------------ */

export interface StockChange {
  key: string;
  productId: string;
  variantId?: string;
  before?: StockRow;
  after?: StockRow;
}

export interface StockDiff {
  /** 0 -> adet (ya da yeni satir) */
  added: StockChange[];
  /** Adet, fiyat ya da link degisti (stokta kalmaya devam) */
  changed: StockChange[];
  /** Adet -> 0 ya da dosyada yok */
  zeroed: StockChange[];
  unchanged: number;
}

/** Tam liste mantigi: incoming, kaynagin yeni stogunun tamamidir. */
export function diffStock(current: StockRow[], incoming: StockRow[]): StockDiff {
  const before = new Map(current.map((l) => [stockKey(l), l]));
  const after = new Map(incoming.map((l) => [stockKey(l), l]));
  const diff: StockDiff = { added: [], changed: [], zeroed: [], unchanged: 0 };

  after.forEach((a, key) => {
    const b = before.get(key);
    const change = { key, productId: a.productId, variantId: a.variantId, before: b, after: a };
    const wasIn = (b?.quantity ?? 0) > 0;
    const isIn = a.quantity > 0;
    if (!wasIn && isIn) diff.added.push(change);
    else if (wasIn && !isIn) diff.zeroed.push(change);
    else if (b && (b.quantity !== a.quantity || b.price !== a.price || b.url !== a.url)) diff.changed.push(change);
    else diff.unchanged += 1;
  });
  before.forEach((b, key) => {
    if (!after.has(key) && b.quantity > 0) {
      diff.zeroed.push({ key, productId: b.productId, variantId: b.variantId, before: b });
    }
  });
  return diff;
}

export function summarizeImport(file: MatchedStockFile, diff: StockDiff): StockImportSummary {
  return {
    rows: file.rows.length,
    matched: file.incoming.length,
    unmatched: file.unmatched.length,
    invalid: file.invalid.length,
    added: diff.added.length,
    changed: diff.changed.length,
    zeroed: diff.zeroed.length,
  };
}

/**
 * Dosya oncekinden cok kisaysa (yarim gonderilmis olabilir) uyari.
 * Onceki listede en az 10 stoklu urun varken yeni dosya bunun yarisindan
 * azini iceriyorsa true.
 */
export function looksTruncated(current: StockRow[], incoming: StockRow[]): boolean {
  const prev = current.filter((l) => l.quantity > 0).length;
  return prev >= 10 && incoming.length < prev / 2;
}

/* ------------------------------------------------------------------ */
/* Sablon                                                              */
/* ------------------------------------------------------------------ */

/**
 * Bayiye gonderilecek sablon: bizim SKU'larimiz, urun adi ve kaynagin
 * mevcut adet ve fiyatlari (withUrl ise linkleri). Secenekli urunlerde her
 * secenek ayri satirdir.
 */
export function stockTemplateRows(
  products: Product[],
  current: StockRow[],
  options: { withUrl: boolean },
): string[][] {
  const byKey = new Map(current.map((l) => [stockKey(l), l]));
  const header = ["SKU", "Ürün Adı", "Adet", "Fiyat", ...(options.withUrl ? ["Link"] : [])];
  const rows: string[][] = [header];
  products.forEach((p) => {
    const variants = p.variantGroups?.[0]?.options;
    const lines = variants?.length
      ? variants.map((o) => ({ sku: o.sku ?? p.sku, name: `${p.name} (${o.label})`, variantId: o.id }))
      : [{ sku: p.sku, name: p.name, variantId: undefined }];
    lines.forEach((l) => {
      const level = byKey.get(stockKey({ productId: p.id, variantId: l.variantId })) ?? byKey.get(stockKey({ productId: p.id }));
      const row = [l.sku, l.name, String(level?.quantity ?? 0), level?.price != null ? String(level.price) : ""];
      if (options.withUrl) row.push(level?.url ?? "");
      rows.push(row);
    });
  });
  return rows;
}
