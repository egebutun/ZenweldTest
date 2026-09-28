import type { Product } from "./types";

/**
 * FIYAT VE KAMPANYA KURALLARI — TEK KAYNAK
 *
 * Urunde her zaman NORMAL fiyat saklanir (priceExVat). Kampanya varsa
 * (product.discount) indirim yalnizca gecerlilik suresi icinde uygulanir;
 * baslangic/bitis tarihleri geldiginde fiyat KENDILIGINDEN degisir, urunu
 * elle duzenlemeye gerek kalmaz.
 *
 * Musteriye gosterilen her fiyat salePriceExVat() uzerinden gecmelidir.
 * product.priceExVat dogrudan gosterilirse kampanya gozden kacar.
 *
 * "at" parametresi: fiyatin hangi an icin hesaplanacagi. Istemci
 * bilesenleri useNow() ile verir (bkz. packages/store/src/hooks.ts) —
 * boylece sunucuda uretilen sayfa ile tarayicinin ilk cizimi ayni anda
 * hesaplanir ve React "hydration" hatasi olusmaz.
 */

/**
 * FLAS INDIRIM ESIGI
 *
 * Bu yuzdeye ve ustune cikan indirimler urun kartinda "Flas Indirim"
 * etiketi ve alevli cerceveyle gosterilir. Esigi degistirmek icin
 * yalnizca bu sayiyi degistirin (orn. 30).
 */
export const FLASH_DISCOUNT_THRESHOLD = 25;

/** Panelde girilebilecek indirim orani sinirlari. */
export const MIN_DISCOUNT_PERCENT = 1;
export const MAX_DISCOUNT_PERCENT = 90;

export type CampaignStatus = "none" | "scheduled" | "active" | "ended";

/** Kampanyanin verilen andaki durumu. */
export function campaignStatus(product: Product, at: Date = new Date()): CampaignStatus {
  const d = product.discount;
  if (!d || !(d.percent > 0)) return "none";
  const now = at.getTime();
  if (d.startsAt && now < new Date(d.startsAt).getTime()) return "scheduled";
  if (d.endsAt && now > new Date(d.endsAt).getTime()) return "ended";
  return "active";
}

/** Kampanya su an gecerli mi? */
export function isDiscountActive(product: Product, at?: Date): boolean {
  return campaignStatus(product, at) === "active";
}

/** Gecerli indirim yuzdesi; kampanya yoksa ya da suresi disindaysa 0. */
export function discountPercent(product: Product, at?: Date): number {
  return isDiscountActive(product, at) ? product.discount!.percent : 0;
}

/**
 * Indirimi bir fiyata uygular (tam liraya yuvarlanir).
 * Secenekli urunlerde secenegin fiyatina da ayni oran uygulanir.
 */
export function applyDiscount(priceExVat: number, percent: number): number {
  if (!(percent > 0)) return priceExVat;
  return Math.round(priceExVat * (1 - percent / 100));
}

/** Musterinin odeyecegi fiyat (KDV haric). */
export function salePriceExVat(product: Product, at?: Date): number {
  return applyDiscount(product.priceExVat, discountPercent(product, at));
}

/** Indirim esigi asildi mi? (flas indirim gorunumu) */
export function isFlashDeal(product: Product, at?: Date): boolean {
  return discountPercent(product, at) >= FLASH_DISCOUNT_THRESHOLD;
}

/**
 * Kampanyada mi? Anasayfadaki "Hot Sale" bolumu bunu kullanir; kampanya
 * baslayinca urun bolume kendiliginden girer, bitince cikar.
 */
export function isOnSale(product: Product, at?: Date): boolean {
  return isDiscountActive(product, at);
}
