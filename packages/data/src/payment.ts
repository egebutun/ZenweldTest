import { CARD_PROGRAMS, type CardProgram } from "./checkout";

/**
 * ODEME VE FATURA BILGISI KURALLARI (site ve sunucu)
 *
 * Kart numarasinin tamami hicbir yere gonderilmez ve saklanmaz; sunucuya
 * yalnizca ilk 6 hane (kart programi ve taksit icin) ve son 4 hane gider
 * (Asama 5.2). Kart programi bugun ilk 6 haneden sabit bir esleme ile
 * bulunur (DEMO); odeme kurulusu baglaninca kurulusun BIN sorgusundan
 * gelir.
 */

export const digitsOnly = (value: string) => value.replace(/\D/g, "");

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
