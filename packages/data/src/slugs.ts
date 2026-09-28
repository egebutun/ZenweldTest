import type { BlogPost, NewsItem } from "./types";

/**
 * DILE GORE ADRES PARCASI (SLUG)
 *
 * Basligi cevrilen icerikte (blog yazisi, haber) adres de cevrilir;
 * Ingilizce sayfada Turkce slug gormek hem okunaksiz hem de SEO
 * acisindan zayiftir:
 *
 *   /tr/kesfet/blog/mig-kaynaginda-gaz-secimi
 *   /en/explore/blog/choosing-the-right-gas-for-mig-welding
 *
 * ETKINLIKLER HARIC: fuar/etkinlik adlari ozel isimdir (WIN EURASIA,
 * IMATECH), iki dilde de ayni yazilir — adresleri de tek kalir.
 *
 * Ingilizce slug bos birakilmissa (baslik cevrilmemisse) Turkcesi
 * kullanilir; adres yine calisir, yalnizca cevrilmemis olur.
 */
export interface LocaleSlugged {
  slug: string;
  slugEn?: string;
}

export function localeSlug(item: LocaleSlugged, locale: "tr" | "en"): string {
  return locale === "en" ? item.slugEn?.trim() || item.slug : item.slug;
}

/** Verilen adres parcasi bu kayda ait mi? (iki dil de kabul edilir) */
export function matchesLocaleSlug(item: LocaleSlugged, slug: string): boolean {
  return item.slug === slug || item.slugEn === slug;
}

/* Okunurlugu artiran kisayollar */
export const blogSlug = (post: BlogPost, locale: "tr" | "en") => localeSlug(post, locale);
export const matchesBlogSlug = (post: BlogPost, slug: string) => matchesLocaleSlug(post, slug);
export const newsSlug = (item: NewsItem, locale: "tr" | "en") => localeSlug(item, locale);
export const matchesNewsSlug = (item: NewsItem, slug: string) => matchesLocaleSlug(item, slug);
