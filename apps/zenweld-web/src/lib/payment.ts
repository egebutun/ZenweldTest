/**
 * ODEME FORMU YARDIMCILARI (DEMO)
 *
 * Kart numarasi yalnizca bicim olarak dogrulanir ve kaydedilmez
 * (sipariste yalnizca son 4 hane tutulur). Veritabani modunda sunucuya
 * yalnizca ilk 6 ve son 4 hane gider (Asama 5.2).
 *
 * Backend geldiginde: kart programi ve gecerli taksit oranlari odeme
 * kurulusunun (iyzico / PayTR / banka sanal POS) BIN sorgusundan gelir,
 * odeme 3D Secure ile kurulusun sayfasinda onaylanir. Buradaki BIN ->
 * program eslemesi yalnizca sunum icindir.
 */

import { digitsOnly } from "@zenweld/data";

// Sunucu da kullandigi icin packages/data/src/payment.ts'te; buradan da alinabilir.
export { cardBrand, cardProgram, digitsOnly, isValidTaxNumber, isValidTcKimlikNo } from "@zenweld/data";

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
