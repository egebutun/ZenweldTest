import type { Product } from "@zenweld/data";

/**
 * FLAS INDIRIM ESIGI
 *
 * Bu yuzdeye ve ustune cikan indirimler urun kartinda "Flas Indirim"
 * etiketi ve alevli cerceveyle gosterilir. Tek yerden degistirilir;
 * yeni eklenen urunler icin ayrica bir sey yapmaya gerek yok, indirim
 * orani fiyattan hesaplandigi icin kural kendiliginden isler.
 *
 * Esigi degistirmek icin yalnizca bu sayiyi degistirin (orn. 30).
 */
export const FLASH_DISCOUNT_THRESHOLD = 25;

/** Liste fiyatina gore indirim yuzdesi; indirim yoksa 0. */
export function discountPercent(product: Product): number {
  const list = product.listPriceExVat;
  if (!list || list <= product.priceExVat) return 0;
  return Math.round(((list - product.priceExVat) / list) * 100);
}

/** Indirim esigi asti mi? */
export function isFlashDeal(product: Product): boolean {
  return discountPercent(product) >= FLASH_DISCOUNT_THRESHOLD;
}
