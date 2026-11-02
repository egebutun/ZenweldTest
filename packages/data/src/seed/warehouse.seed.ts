import type { WarehouseStockRow } from "../types";
import { productSapCodes } from "../warehouse";
import { products } from "./products.seed";

/**
 * ORNEK ZENWELD DEPO STOGU (SAP gorunumunun yerine; KARARLAR K-82)
 *
 * Her urunun SAP kalemine ornek bir adet verilir. "STOKTA YOK" davranisi
 * denenebilsin diye bazi kalemler 0'dir:
 * - Seceneksiz iki urun tamamen stoksuz (ForceArc 280 MMA, UV-5).
 * - Ultimate 405 MTS'nin su sogutmali kalemi stoksuz; hava sogutmali stokta.
 * Gercek stok SAP'tan okunacak; bu dosya canlida kullanilmaz.
 */
const OUT_OF_STOCK_PRODUCTS = ["forcearc-280-mma", "uv-5"];
const OUT_OF_STOCK_VARIANTS: Record<string, string> = { "ultimate-405-mts": "su" };

export function createSampleWarehouseStock(now: number): WarehouseStockRow[] {
  const syncedAt = new Date(now).toISOString();
  const rows = new Map<string, number>();
  products.forEach((p, i) => {
    for (const code of productSapCodes(p)) {
      if (!rows.has(code)) rows.set(code, OUT_OF_STOCK_PRODUCTS.includes(p.slug) ? 0 : 3 + ((i * 7) % 23));
    }
    const coolingOut = OUT_OF_STOCK_VARIANTS[p.slug];
    if (coolingOut) {
      for (const v of p.options?.variants ?? []) {
        if (v.id.startsWith(`${coolingOut}_`)) for (const code of productSapCodes(p, v.id)) rows.set(code, 0);
      }
    }
  });
  return [...rows].map(([sapItemCode, quantity]) => ({ sapItemCode, quantity, syncedAt }));
}
