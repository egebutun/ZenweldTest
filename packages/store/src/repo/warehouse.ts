import { isInWarehouse, warehouseQuantity, warehouseStockMap, type Product, type ZenweldDatabase } from "@zenweld/data";
import { getSnapshot } from "../database";

/**
 * ZENWELD DEPO STOGU (KARARLAR K-82)
 *
 * Stok satirlari bir kez sozluge cevrilir ve ayni veritabani anlik goruntusu
 * icin saklanir; katalog sayfasindaki her kart ayni sozlugu kullanir.
 */
const cache = new WeakMap<ZenweldDatabase["warehouseStock"], Map<string, number>>();

function stockOf(db: ZenweldDatabase): Map<string, number> {
  const rows = db.warehouseStock ?? [];
  let map = cache.get(rows);
  if (!map) {
    map = warehouseStockMap(rows);
    cache.set(rows, map);
  }
  return map;
}

/** Depodaki kullanilabilir stok; secenek verilmezse butun seceneklerin toplami. */
export function productWarehouseQuantity(
  product: Pick<Product, "sku" | "options">,
  variantId?: string,
  db: ZenweldDatabase = getSnapshot(),
): number {
  return warehouseQuantity(product, stockOf(db), variantId);
}

/** Sepete eklenebilir mi: secili secenek (ya da herhangi bir secenek) depoda var. */
export function isProductInStock(
  product: Pick<Product, "sku" | "options">,
  variantId?: string,
  db: ZenweldDatabase = getSnapshot(),
): boolean {
  return isInWarehouse(product, stockOf(db), variantId);
}

/** SAP'tan son okuma ani (en yeni satir); stok yoksa bos. */
export function warehouseSyncedAt(db: ZenweldDatabase = getSnapshot()): string | undefined {
  return (db.warehouseStock ?? []).reduce<string | undefined>((max, r) => (!max || r.syncedAt > max ? r.syncedAt : max), undefined);
}
