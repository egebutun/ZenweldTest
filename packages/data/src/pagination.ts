/**
 * LISTELERIN SAYFALANMASI (docs/IS-KURALLARI.md › 26; KARARLAR K-124)
 *
 * Kategori urun listesi sayfa basina 24, blog, haber ve etkinlik listesi
 * 12 kayit gosterir. Sinir asilmazsa liste tek sayfadir. 1. sayfa listenin
 * kendi adresindedir; sonrakiler "<liste>/sayfa/<n>" (arama sonuclari
 * Google'a kapali oldugu icin "?sayfa=<n>").
 */

export const PRODUCTS_PER_PAGE = 24;
export const POSTS_PER_PAGE = 12;

/** Sayfa sayisi; bos liste de 1 sayfadir. */
export function pageCount(total: number, perPage: number): number {
  return Math.max(1, Math.ceil(total / perPage));
}

/** Listenin istenen sayfasi; sayfa sinirin disindaysa bos liste. */
export function pageItems<T>(items: readonly T[], page: number, perPage: number): T[] {
  if (!Number.isInteger(page) || page < 1) return [];
  return items.slice((page - 1) * perPage, page * perPage);
}

/** Adresteki sayfa numarasi ("2" -> 2); 1-9999 arasi tam sayi degilse null. */
export function parsePageNumber(value: string | undefined | null): number | null {
  if (!value || !/^[1-9][0-9]{0,3}$/.test(value)) return null;
  return Number(value);
}

/** Sayfanin adresi: 1. sayfa listenin adresi, sonrakiler "<liste>/sayfa/<n>". */
export function pagePath(basePath: string, page: number): string {
  return page <= 1 ? basePath : `${basePath.replace(/\/$/, "")}/sayfa/${page}`;
}

/**
 * Sayfa basligi: 2. sayfadan itibaren " — Sayfa <n>" eklenir (ayni baslikta
 * iki sayfa olmasin); "| ZENWELD" eki sonda kalir.
 */
export function pagedTitle(title: string, page: number): string {
  if (page <= 1) return title;
  const at = title.lastIndexOf(" | ");
  return at === -1 ? `${title} — Sayfa ${page}` : `${title.slice(0, at)} — Sayfa ${page}${title.slice(at)}`;
}
