import type { BlogPost } from "./types";

/**
 * DILE GORE ADRES PARCASI (SLUG)
 *
 * Blog yazilarinin adresi iki dilde farklidir; Ingilizce sayfada
 * Turkce slug gormek hem okunaksiz hem de SEO acisindan zayiftir:
 *
 *   /tr/kesfet/blog/mig-kaynaginda-gaz-secimi
 *   /en/explore/blog/choosing-the-right-gas-for-mig-welding
 *
 * Ingilizce slug bos birakilmissa (baslik cevrilmemisse) Turkcesi
 * kullanilir — adres yine calisir, yalnizca cevrilmemis olur.
 */
export function blogSlug(post: BlogPost, locale: "tr" | "en"): string {
  return locale === "en" ? post.slugEn?.trim() || post.slug : post.slug;
}

/** Verilen adres parcasi bu yaziya ait mi? (iki dil de kabul edilir) */
export function matchesBlogSlug(post: BlogPost, slug: string): boolean {
  return post.slug === slug || post.slugEn === slug;
}
