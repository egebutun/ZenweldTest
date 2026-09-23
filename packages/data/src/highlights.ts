import type { Locale, Product } from "./types";

/** Yer tutucu metinleri ayirt etmek icin kullanilan lorem ipsum kaliplari. */
const LOREM = /\b(lorem|ipsum|dolor sit amet|consectetur|adipiscing|eiusmod|tempor|incididunt)\b/i;

/**
 * Urun kartlarinda gosterilecek one cikan ozellikleri dondurur.
 *
 * Yonetim panelinde girilen sirayi korur; ilk `limit` tanesi alinir.
 * Yer tutucu (lorem ipsum) metinler elenir, hic gercek ozellik yoksa
 * kisa aciklamaya dusulur.
 */
export function productHighlights(product: Product, locale: Locale, limit = 3): string[] {
  const real = product.highlights
    .map((h) => h[locale])
    .filter((h) => h && !LOREM.test(h));
  if (real.length > 0) return real.slice(0, limit);

  const short = product.shortDescription[locale];
  return short && !LOREM.test(short) ? [short] : [];
}
