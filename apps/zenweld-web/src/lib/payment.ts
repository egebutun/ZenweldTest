/**
 * ODEME FORMU YARDIMCILARI (DEMO)
 *
 * Kart numarasi yalnizca bicim olarak dogrulanir; hicbir yere gonderilmez
 * ve kaydedilmez (sipariste yalnizca son 4 hane tutulur).
 *
 * Backend geldiginde: kart programi ve gecerli taksit oranlari odeme
 * kurulusunun (iyzico / PayTR / banka sanal POS) BIN sorgusundan gelir,
 * odeme 3D Secure ile kurulusun sayfasinda onaylanir. Buradaki BIN ->
 * program eslemesi yalnizca sunum icindir.
 */

import { CARD_PROGRAMS, type CardProgram } from "@zenweld/data";

export const digitsOnly = (value: string) => value.replace(/\D/g, "");

/** Kart numarasinin Luhn kontrolu. */
export function isValidCardNumber(value: string): boolean {
  const digits = digitsOnly(value);
  if (digits.length < 15 || digits.length > 19) return false;
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let d = Number(digits[digits.length - 1 - i]);
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return sum % 10 === 0;
}

export function cardBrand(value: string): string | undefined {
  const d = digitsOnly(value);
  if (/^4/.test(d)) return "Visa";
  if (/^(5[1-5]|2[2-7])/.test(d)) return "Mastercard";
  if (/^9792/.test(d)) return "Troy";
  if (/^3[47]/.test(d)) return "American Express";
  return undefined;
}

/** DEMO: kartin ilk 6 hanesinden sabit bir program secer. */
export function cardProgram(value: string): CardProgram | undefined {
  const bin = digitsOnly(value).slice(0, 6);
  if (bin.length < 6) return undefined;
  const sum = [...bin].reduce((s, c) => s + Number(c), 0);
  return CARD_PROGRAMS[sum % CARD_PROGRAMS.length];
}

/** "1234567812345678" -> "1234 5678 1234 5678" */
export function formatCardNumber(value: string): string {
  return digitsOnly(value).slice(0, 19).replace(/(\d{4})(?=\d)/g, "$1 ");
}

/** "1228" -> "12/28" */
export function formatExpiry(value: string): string {
  const d = digitsOnly(value).slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}

export function isValidExpiry(value: string, now = new Date()): boolean {
  const m = value.match(/^(\d{2})\/(\d{2})$/);
  if (!m) return false;
  const month = Number(m[1]);
  const year = 2000 + Number(m[2]);
  if (month < 1 || month > 12) return false;
  // Kart, son kullanma ayinin sonuna kadar gecerlidir.
  return new Date(year, month, 1) > now;
}

/** T.C. kimlik numarasi algoritma kontrolu (11 hane, sondan iki hane kontrol). */
export function isValidTcKimlikNo(value: string): boolean {
  if (!/^[1-9]\d{10}$/.test(value)) return false;
  const d = [...value].map(Number);
  const odd = d[0] + d[2] + d[4] + d[6] + d[8];
  const even = d[1] + d[3] + d[5] + d[7];
  const d10 = (((odd * 7 - even) % 10) + 10) % 10;
  const d11 = d.slice(0, 10).reduce((s, n) => s + n, 0) % 10;
  return d[9] === d10 && d[10] === d11;
}

export const isValidTaxNumber = (value: string) => /^\d{10}$/.test(value);
