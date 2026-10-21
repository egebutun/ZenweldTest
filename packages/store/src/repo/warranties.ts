"use client";

import type { WarrantyRecord, ZenweldDatabase } from "@zenweld/data";
import { getSnapshot, mutate, uid } from "../database";
import { nowIso } from "./shared";

/* ------------------------------------------------------------------ */
/* Garanti kayitlari                                                   */
/* ------------------------------------------------------------------ */

/** Seri numarasi bosluksuz ve buyuk harfle saklanir; karsilastirma da boyle yapilir. */
const normalizeSerial = (serial: string) => serial.trim().toUpperCase();

/**
 * Garanti kaydi. E-posta kucuk harfe cevrilir (Garantilerim uyenin e-postasiyla
 * eslesir). Ayni seri numarasi ikinci kez kaydedilemez: false doner.
 */
export function registerWarranty(
  record: Omit<WarrantyRecord, "id" | "registeredAt" | "expiresAt">,
): WarrantyRecord | false {
  if (findWarranty(record.serialNumber)) return false;
  const registeredAt = nowIso();
  const saved: WarrantyRecord = {
    ...record,
    serialNumber: normalizeSerial(record.serialNumber),
    email: record.email.trim().toLowerCase(),
    id: uid("w"),
    registeredAt,
    expiresAt: warrantyExpiry(registeredAt, record.productId, record.extended),
  };
  mutate((db) => {
    db.warranties.unshift(saved);
  });
  return saved;
}

/** Uyenin garantileri: kayittaki e-posta buyuk/kucuk harf farki gozetmeden eslesir. */
export function warrantiesForEmail(email: string, db: ZenweldDatabase = getSnapshot()): WarrantyRecord[] {
  const target = email.trim().toLowerCase();
  return db.warranties.filter((w) => w.email.trim().toLowerCase() === target);
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
  // Yerel tarih: toISOString() UTC verir, gece 00:00–03:00 kaydinda bir gun erken olurdu.
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${expires.getFullYear()}-${pad(expires.getMonth() + 1)}-${pad(expires.getDate())}`;
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
  const target = normalizeSerial(serialNumber);
  return db.warranties.find((w) => normalizeSerial(w.serialNumber) === target);
}
