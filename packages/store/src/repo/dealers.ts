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
    removeStockOfSource(db, "dealer", id);
  });
}
