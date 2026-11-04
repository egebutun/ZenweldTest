import { normalizeCode, parseNumber } from "./stock";
import type { Product, WarehouseStockRow } from "./types";

/**
 * ZENWELD DEPO STOGU (IS-KURALLARI › Zenweld depo stogu, KARARLAR K-82)
 *
 * Stok SAP kalem kodu basinadir. Urunun ve seceneklerin kodlari SAP koduna
 * su kuralla baglanir (KARARLAR K-72):
 * - Seceneksiz urun: urun kodu SAP kodudur.
 * - Secenekli urun: secenegin kodundan torc uzunlugu ("-3M") ve ara paket
 *   uzunlugu ("-AP5M") ekleri atilinca SAP kodu kalir
 *   ("ZW30100000027-3M-AP5M" -> "ZW30100000027"). Ayni SAP kalemini paylasan
 *   secenekler (yalnizca torc uzunlugu farkli) ayni stogu gosterir.
 * SAP'ta karsiligi olmayan kod (orn. gecici kod, K-75) stokta sayilmaz.
 */

/** Secenek koduna eklenen torc ve ara paket ekleri: -4M, -AP10M */
const DERIVED_SUFFIX = /(?:-(?:AP)?\d+M)+$/;

/** Urun ya da secenek kodunun SAP kalem kodu. */
export function sapItemCode(code: string): string {
  return normalizeCode(code).replace(DERIVED_SUFFIX, "");
}

/** SAP kalem kodu -> kullanilabilir stok. */
export function warehouseStockMap(rows: readonly WarehouseStockRow[]): Map<string, number> {
  return new Map(rows.map((r) => [normalizeCode(r.sapItemCode), r.quantity]));
}

/**
 * Urunun (ya da secili secenegin) bagli oldugu SAP kalemleri. Secenek
 * verilmezse butun seceneklerin kalemleri (tekrarsiz).
 */
export function productSapCodes(product: Pick<Product, "sku" | "options">, variantId?: string): string[] {
  const variants = product.options?.variants ?? [];
  if (variants.length === 0) return [sapItemCode(product.sku)];
  const chosen = variantId ? variants.filter((v) => v.id === variantId) : variants;
  return [...new Set(chosen.map((v) => sapItemCode(v.sku)))];
}

/** Depodaki kullanilabilir stok (secenek verilmezse butun seceneklerin toplami). */
export function warehouseQuantity(
  product: Pick<Product, "sku" | "options">,
  stock: ReadonlyMap<string, number>,
  variantId?: string,
): number {
  return productSapCodes(product, variantId).reduce((sum, code) => sum + (stock.get(code) ?? 0), 0);
}

/** Stokta mi: secili secenegin (ya da herhangi bir secenegin) stogu 0'dan buyuk. */
export function isInWarehouse(
  product: Pick<Product, "sku" | "options">,
  stock: ReadonlyMap<string, number>,
  variantId?: string,
): boolean {
  return warehouseQuantity(product, stock, variantId) > 0;
}

/* ------------------------------------------------------------------ */
/* SAP okumasi (IS-KURALLARI › 20 › SAP okumasi)                       */
/* ------------------------------------------------------------------ */

/** SAP stok gorunumunden gelen satir (kolonlarin kesin adi SAP ekibinden gelecek). */
export interface SapStockLine {
  code: string;
  name?: string;
  /** Kullanilabilir miktar: sayi ya da metin ("12", "12,5") */
  quantity: unknown;
}

export type SapStockRow = Pick<WarehouseStockRow, "sapItemCode" | "itemName" | "quantity">;

/**
 * SAP okumasini depo stoguna cevirir. Okuma butun olarak kabul ya da
 * reddedilir: bos okuma, kodu bos ya da miktari okunamayan satir hata
 * firlatir; o zaman son iyi stok korunur.
 * - Kodlar bosluksuz, buyuk harf.
 * - Ayni kalem birden fazla satirda gelirse (orn. depo basina) miktarlar
 *   toplanir; toplam eksiyse 0 sayilir (siparise ayrilan eldekini asmis).
 * - Miktar en fazla 3 ondalik (kg ile satilan kalemler).
 */
export function readSapStock(lines: readonly SapStockLine[]): SapStockRow[] {
  if (lines.length === 0) throw new Error("SAP'tan hiç kalem gelmedi.");
  const rows = new Map<string, SapStockRow>();
  lines.forEach((line, index) => {
    const code = normalizeCode(String(line.code ?? ""));
    if (!code) throw new Error(`${index + 1}. satırda kalem kodu boş.`);
    const quantity = parseNumber(line.quantity);
    if (quantity === null) throw new Error(`${code}: miktar okunamadı (${String(line.quantity ?? "") || "boş"}).`);
    const row = rows.get(code) ?? { sapItemCode: code, quantity: 0 };
    row.quantity += quantity;
    const name = line.name?.trim();
    if (name && !row.itemName) row.itemName = name;
    rows.set(code, row);
  });
  return [...rows.values()].map((r) => ({ ...r, quantity: Math.max(0, Math.round(r.quantity * 1000) / 1000) }));
}

/** Iki okuma arasindaki fark: yeni gelen, okumadan cikan ve miktari degisen kalemler. */
export function diffWarehouseStock(
  current: readonly Pick<WarehouseStockRow, "sapItemCode" | "quantity">[],
  next: readonly Pick<WarehouseStockRow, "sapItemCode" | "quantity">[],
): { added: string[]; removed: string[]; changed: string[] } {
  const before = new Map(current.map((r) => [r.sapItemCode, r.quantity]));
  const after = new Set(next.map((r) => r.sapItemCode));
  return {
    added: next.filter((r) => !before.has(r.sapItemCode)).map((r) => r.sapItemCode),
    removed: current.filter((r) => !after.has(r.sapItemCode)).map((r) => r.sapItemCode),
    changed: next.filter((r) => before.has(r.sapItemCode) && before.get(r.sapItemCode) !== r.quantity).map((r) => r.sapItemCode),
  };
}

/**
 * Yarim okuma korumasi (KARARLAR K-93): onceki okumada en az 10 kalem
 * stoktayken yeni okumada stoktaki kalem sayisi bunun yarisinin altina
 * duserse okuma yarim (ya da hatali) sayilir ve uygulanmaz. Dogruysa elle
 * zorla uygulanir. Bayi dosyalarindaki looksTruncated'in SAP karsiligi.
 */
export function looksLikePartialSapRead(
  current: readonly Pick<WarehouseStockRow, "quantity">[],
  next: readonly Pick<WarehouseStockRow, "quantity">[],
): { before: number; after: number } | null {
  const before = current.filter((r) => r.quantity > 0).length;
  const after = next.filter((r) => r.quantity > 0).length;
  return before >= 10 && after < before / 2 ? { before, after } : null;
}
