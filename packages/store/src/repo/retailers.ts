"use client";

import type { Retailer, RetailerStock, ZenweldDatabase } from "@zenweld/data";
import { getSnapshot, mutate } from "../database";
import { nowIso } from "./shared";

/* ------------------------------------------------------------------ */
/* Online satici stogu — urun sayfasinin kalbi                         */
/* ------------------------------------------------------------------ */

export interface RetailerWithStock {
  retailer: Retailer;
  stock: RetailerStock;
}

/** Bir urunun STOKTA OLDUGU online saticilar. */
export function retailersInStockFor(
  productId: string,
  db: ZenweldDatabase = getSnapshot(),
): RetailerWithStock[] {
  return db.retailerStock
    .filter((s) => s.productId === productId && s.inStock)
    .map((stock) => {
      const retailer = db.retailers.find((r) => r.id === stock.retailerId);
      return retailer && retailer.active ? { retailer, stock } : null;
    })
    .filter((x): x is RetailerWithStock => x !== null)
    .sort((a, b) => {
      if (a.retailer.isOwnStore !== b.retailer.isOwnStore) {
        return a.retailer.isOwnStore ? -1 : 1;
      }
      return a.retailer.name.localeCompare(b.retailer.name, "tr");
    });
}

export function getRetailerStock(
  productId: string,
  retailerId: string,
  db: ZenweldDatabase = getSnapshot(),
): RetailerStock | undefined {
  return db.retailerStock.find(
    (s) => s.productId === productId && s.retailerId === retailerId,
  );
}

type StockPatch = Partial<Omit<RetailerStock, "productId" | "retailerId">>;

/** Tek bir urun-satici stok satirini taslak veritabaninda gunceller ya da ekler. */
function patchStock(
  db: ZenweldDatabase,
  productId: string,
  retailerId: string,
  patch: StockPatch,
): void {
  const row = db.retailerStock.find(
    (s) => s.productId === productId && s.retailerId === retailerId,
  );
  if (row) {
    Object.assign(row, patch, { updatedAt: nowIso() });
    return;
  }
  const retailer = db.retailers.find((r) => r.id === retailerId);
  const product = db.products.find((p) => p.id === productId);
  db.retailerStock.push({
    productId,
    retailerId,
    inStock: patch.inStock ?? false,
    quantity: patch.quantity,
    price: patch.price,
    discount: patch.discount,
    productUrl:
      patch.productUrl ??
      `${(retailer?.websiteUrl ?? "").replace(/\/$/, "")}/urun/${product?.slug ?? ""}`,
    updatedAt: nowIso(),
  });
}

export function setRetailerStock(productId: string, retailerId: string, patch: StockPatch): void {
  mutate((db) => patchStock(db, productId, retailerId, patch));
}

/**
 * Bir saticinin birden cok urununu TEK seferde gunceller (toplu isaretleme,
 * CSV yukleme). Her satir icin ayri kayit yapmak, veritabanini satir sayisi
 * kadar kopyalayip yazdigi icin panelde takilmaya yol aciyordu.
 */
export function setRetailerStocks(
  retailerId: string,
  rows: { productId: string; patch: StockPatch }[],
): void {
  if (rows.length === 0) return;
  mutate((db) => rows.forEach((r) => patchStock(db, r.productId, retailerId, r.patch)));
}

/** Bir saticinin tum urunlerini toplu isaretle/temizle. */
export function bulkSetRetailerStock(
  retailerId: string,
  productIds: string[],
  inStock: boolean,
): void {
  setRetailerStocks(
    retailerId,
    productIds.map((productId) => ({ productId, patch: { inStock } })),
  );
}

/** Bir urunun en son stok guncelleme zamani. */
export function lastStockUpdate(
  productId: string,
  db: ZenweldDatabase = getSnapshot(),
): string | undefined {
  const times = db.retailerStock
    .filter((s) => s.productId === productId)
    .map((s) => s.updatedAt)
    .sort();
  return times[times.length - 1];
}

/* ------------------------------------------------------------------ */
/* Saticilar                                                           */
/* ------------------------------------------------------------------ */

export function saveRetailer(retailer: Retailer): void {
  mutate((db) => {
    const idx = db.retailers.findIndex((r) => r.id === retailer.id);
    if (idx >= 0) db.retailers[idx] = retailer;
    else db.retailers.unshift(retailer);
  });
}

export function deleteRetailer(id: string): void {
  mutate((db) => {
    db.retailers = db.retailers.filter((r) => r.id !== id);
    db.retailerStock = db.retailerStock.filter((s) => s.retailerId !== id);
  });
}
