"use client";

import type { WarrantyRecord, ZenweldDatabase } from "@zenweld/data";
import { getSnapshot, mutate, uid } from "../database";
import { nowIso } from "./shared";

/* ------------------------------------------------------------------ */
/* Garanti kayitlari                                                   */
/* ------------------------------------------------------------------ */

export function registerWarranty(
  record: Omit<WarrantyRecord, "id" | "registeredAt" | "expiresAt">,
): void {
  const registeredAt = nowIso();
  mutate((db) => {
    db.warranties.unshift({
      ...record,
      id: uid("w"),
      registeredAt,
      expiresAt: warrantyExpiry(registeredAt, record.productId, record.extended, db),
    });
  });
}

/**
 * Garanti bitis tarihi (YYYY-AA-GG): kayit tarihi + urunun garanti
 * suresi, uzatilmis garantide +12 ay. (Formda satin alma tarihi
 * sorulmadigi icin sure kayit tarihinden baslar.)
 */
export function warrantyExpiry(
  startDate: string,
  productId: string,
  extended: boolean,
  db: ZenweldDatabase = getSnapshot(),
): string {
  const months = db.products.find((p) => p.id === productId)?.warrantyMonths ?? 24;
  const expires = new Date(startDate);
  expires.setMonth(expires.getMonth() + months + (extended ? 12 : 0));
  return expires.toISOString().slice(0, 10);
}

/** Yonetim panelinden garanti kaydini gunceller (musterinin Garantilerim sayfasina yansir). */
export function saveWarranty(record: WarrantyRecord): void {
  mutate((db) => {
    const idx = db.warranties.findIndex((w) => w.id === record.id);
    if (idx >= 0) db.warranties[idx] = record;
  });
}

export function deleteWarranty(id: string): void {
  mutate((db) => {
    db.warranties = db.warranties.filter((w) => w.id !== id);
  });
}

export function findWarranty(serialNumber: string, db: ZenweldDatabase = getSnapshot()) {
  return db.warranties.find(
    (w) => w.serialNumber.toLowerCase() === serialNumber.toLowerCase().trim(),
  );
}
