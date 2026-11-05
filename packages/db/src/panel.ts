import { randomBytes } from "node:crypto";

/**
 * PANEL YAZMALARININ ORTAK PARCALARI (veritabani modu; Asama 5, KARARLAR K-99)
 *
 * Panelin her alani (admin-sales.ts, admin-requests.ts...) ayni kurallarla
 * yazar:
 * - Yazan fonksiyon bir islem (transaction) icinde cagrilir; kayit satiri
 *   kilitlenir (FOR UPDATE).
 * - Istek, ekranin gordugu son degisiklik anini (updatedAt) tasir. Kayit o
 *   andan sonra degismisse (baska yonetici, musteri ya da sistem)
 *   kaydedilmez: "Bu kayit siz actiktan sonra degisti; sayfayi yenileyin."
 * - Basarili yazma kaydin yeni son degisiklik anini dondurur; ekran sayfa
 *   yenilenmeden yaptigi ikinci kayitta bunu gonderir (kendi degisikligi
 *   "baskasinin degisikligi" sayilmaz).
 * - Ayni islemde audit_log'a yazilir (audit.ts).
 */

export interface PanelFailure {
  ok: false;
  status: 400 | 404 | 409;
  error: string;
}

export type PanelResult<T extends object = object> = ({ ok: true } & T) | PanelFailure;

/** Basarili yazmanin yaniti: kaydin yeni son degisiklik ani (silmede yok). */
export type Saved = { updatedAt?: string };

export const fail = (status: PanelFailure["status"], error: string): PanelFailure => ({ ok: false, status, error });

export const isFailure = (value: object): value is PanelFailure => "ok" in value && value.ok === false;

/** Tarayicidan gelen metin: kirpilir, en fazla maxLength karakter. */
export const text = (value: unknown, maxLength = 200) => (typeof value === "string" ? value.trim().slice(0, maxLength) : "");

export const newId = (prefix: string) => `${prefix}-${randomBytes(8).toString("hex")}`;

/** Kayit yoksa 404; ekran acildiktan sonra degismisse 409. */
export function checkRow<T extends { updatedAt: Date }>(
  row: T | undefined,
  input: Record<string, unknown>,
  notFound: string,
  stale: string,
): T | PanelFailure {
  if (!row) return fail(404, notFound);
  if (row.updatedAt.toISOString() !== input.updatedAt) return fail(409, stale);
  return row;
}

/** Yazildi: yeni son degisiklik ani. */
export const saved = (at: Date) => ({ ok: true as const, updatedAt: at.toISOString() });

/** Degisen bir sey yok; kayit yazilmadi. */
export const unchanged = (row: { updatedAt: Date }) => ({ ok: true as const, updatedAt: row.updatedAt.toISOString() });
