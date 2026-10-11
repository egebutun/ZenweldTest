"use client";

import type { Dealer, ZenweldDatabase } from "@zenweld/data";
import { getSnapshot, mutate } from "../database";
import { nowIso } from "./shared";

/* ------------------------------------------------------------------ */
/* Bayiler                                                             */
/* ------------------------------------------------------------------ */

export function listDealers(db: ZenweldDatabase = getSnapshot()): Dealer[] {
  return db.dealers.filter((d) => d.active);
}

/**
 * Urunu stokta tutan bayiler.
 *
 * variantId verilirse yalnizca o secenegi bulunduranlar dondurulur;
 * secenek belirtilmemis kayitlar (variantId bos) her zaman sayilir,
 * cunku onlar urunun tum secenekleri icin gecerlidir.
 */
export function dealersWithProduct(
  productId: string,
  db: ZenweldDatabase = getSnapshot(),
  variantId?: string,
): Set<string> {
  return new Set(
    db.dealerStock
      .filter(
        (s) =>
          s.productId === productId &&
          s.inStock &&
          (!variantId || !s.variantId || s.variantId === variantId),
      )
      .map((s) => s.dealerId),
  );
}

/**
 * Bayi stok kaydini (Stok Matrisi > Fiziksel Bayiler) ayarlar. Secenekli
 * urunlerde her secenek ayri satirdir; variantId bos ise urunun tumu.
 */
export function setDealerStock(
  dealerId: string,
  rows: { productId: string; variantId?: string }[],
  inStock: boolean,
): void {
  if (rows.length === 0) return;
  mutate((db) => {
    const at = nowIso();
    rows.forEach(({ productId, variantId }) => {
      const row = db.dealerStock.find(
        (s) => s.dealerId === dealerId && s.productId === productId && s.variantId === variantId,
      );
      if (row) Object.assign(row, { inStock, updatedAt: at });
      else db.dealerStock.push({ productId, dealerId, variantId, inStock, updatedAt: at });
    });
  });
}

export function saveDealer(dealer: Dealer): void {
  mutate((db) => {
    const idx = db.dealers.findIndex((d) => d.id === dealer.id);
    if (idx >= 0) db.dealers[idx] = dealer;
    else db.dealers.unshift(dealer);
  });
}

export function deleteDealer(id: string): void {
  mutate((db) => {
    db.dealers = db.dealers.filter((d) => d.id !== id);
    db.dealerStock = db.dealerStock.filter((s) => s.dealerId !== id);
  });
}
