"use client";

import type { Retailer } from "@zenweld/data";
import { mutate } from "../database";
import { removeStockOfSource } from "./stock";

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
    removeStockOfSource(db, "retailer", id);
    // Bu magazaya bagli bayilerin baglantisi kalkar.
    db.dealers.forEach((d) => {
      if (d.retailerId === id) delete d.retailerId;
    });
  });
}
