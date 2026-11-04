import { turkeyYear } from "./orders";
import type { PaymentPreference, ServiceReason } from "./types";

/**
 * FORM KURALLARI (site ve sunucu; Asama 5.3)
 *
 * Teklif, servis talebi ve garanti kaydinin tarayicida da sunucuda da ayni
 * olan kurallari. Veritabani modunda kaydi sunucu yapar ve bu kurallari
 * yeniden denetler.
 */

export const PAYMENT_PREFERENCES: PaymentPreference[] = ["vadeli", "cek", "havale", "belirsiz"];
/** Teklif Al'da vadeli odeme icin secilebilen gunler */
export const QUOTE_TERM_DAYS = [30, 45, 60, 90, 120];
export const SERVICE_REASONS: ServiceReason[] = ["kurulum", "bakim", "onarim", "egitim"];
export const SERVICE_COMPLAINT_MAX = 400;

/** Kayit numarasi onekleri: TKL-2026-0004, SRV-2026-0034 (yil Turkiye saatine gore). */
export const quoteCodePrefix = (at: Date) => `TKL-${turkeyYear(at)}-`;
export const serviceCodePrefix = (at: Date) => `SRV-${turkeyYear(at)}-`;
export const FORM_CODE_DIGITS = 4;

/** Seri numarasi bosluksuz basa/sona, buyuk harfle karsilastirilir ve saklanir. */
export const normalizeSerial = (serial: string) => serial.trim().toUpperCase();
export const isValidPostalCode = (value: string) => /^\d{5}$/.test(value);
/** Satici firmanin vergi no (10 hane) ya da sahis firmasinda T.C. kimlik no (11 hane) */
export const isValidSellerTaxNumber = (value: string) => /^\d{10,11}$/.test(value);

const TURKEY_OFFSET_MS = 3 * 60 * 60 * 1000;
const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Garanti bitis tarihi (YYYY-AA-GG): kayit gunu (Turkiye saati) + urunun
 * garanti suresi, uzatilmis garantide +12 ay. Formda satin alma tarihi
 * sorulmadigi icin sure kayit tarihinden baslar.
 */
export function warrantyExpiryDate(registeredAt: Date, months: number, extended: boolean): string {
  const local = new Date(registeredAt.getTime() + TURKEY_OFFSET_MS);
  const end = new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth() + months + (extended ? 12 : 0), local.getUTCDate()));
  return `${end.getUTCFullYear()}-${pad(end.getUTCMonth() + 1)}-${pad(end.getUTCDate())}`;
}
