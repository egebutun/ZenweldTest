import { normalizeCode } from "./stock";
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
