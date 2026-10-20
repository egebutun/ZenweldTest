"use client";

import type { Dealer, ZenweldDatabase } from "@zenweld/data";
import { getSnapshot, mutate } from "../database";
import { removeStockOfSource } from "./stock";

/* ------------------------------------------------------------------ */
/* Bayiler                                                             */
/* ------------------------------------------------------------------ */

export function listDealers(db: ZenweldDatabase = getSnapshot()): Dealer[] {
  return db.dealers.filter((d) => d.active);
}

/**
 * Bayiyi kaydeder. Secilen online magaza baska bir bayiye bagliysa
 * kaydetmez ve false doner: bir magaza yalnizca bir bayiye baglanabilir
 * (DB: dealers.retailer_id UNIQUE).
 */
export function saveDealer(dealer: Dealer): boolean {
  const taken = getSnapshot().dealers.some((d) => d.retailerId && d.retailerId === dealer.retailerId && d.id !== dealer.id);
  if (taken) return false;
  mutate((db) => {
    const idx = db.dealers.findIndex((d) => d.id === dealer.id);
    if (idx >= 0) db.dealers[idx] = dealer;
    else db.dealers.unshift(dealer);
  });
  return true;
}

export function deleteDealer(id: string): void {
  mutate((db) => {
    db.dealers = db.dealers.filter((d) => d.id !== id);
    removeStockOfSource(db, "dealer", id);
  });
}
