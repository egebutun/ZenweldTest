"use client";

import type { Dealer, ZenweldDatabase } from "@zenweld/data";
import { getSnapshot, mutate } from "../database";

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
  });
}
