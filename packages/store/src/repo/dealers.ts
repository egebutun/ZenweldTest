"use client";

import type { Dealer, DealerStock, ZenweldDatabase } from "@zenweld/data";
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

export function getDealerStock(
  productId: string,
  dealerId: string,
  db: ZenweldDatabase = getSnapshot(),
): DealerStock | undefined {
  return db.dealerStock.find((s) => s.productId === productId && s.dealerId === dealerId);
}

export function setDealerStock(
  productId: string,
  dealerId: string,
  inStock: boolean,
  quantity?: number,
): void {
  mutate((db) => {
    const idx = db.dealerStock.findIndex(
      (s) => s.productId === productId && s.dealerId === dealerId,
    );
    if (idx >= 0) {
      db.dealerStock[idx] = {
        ...db.dealerStock[idx],
        inStock,
        quantity,
        updatedAt: nowIso(),
      };
    } else {
      db.dealerStock.push({ productId, dealerId, inStock, quantity, updatedAt: nowIso() });
    }
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
  });
}
