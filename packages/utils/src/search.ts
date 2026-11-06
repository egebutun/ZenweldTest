/**
 * PANEL LISTELERINDE ARAMA — iki modda ayni sonuc
 *
 * Aranan metin ve alanlar ayni bicime getirilir: Turkce kucuk harf ve
 * I / İ / ı / i ayni harf ("ISPARTA" "isparta" ve "ısparta" ile bulunur).
 * Veritabani modunda sunucu ayni kurali SQL'de uygular
 * (packages/db › panel-lists.ts › searchLike).
 */
export const searchFold = (text: string) =>
  text.toLocaleLowerCase("tr").replace(/ı/g, "i").replace(/\u0307/g, "");

/** Alanlardan biri aranan metni iceriyor mu (bos arama her seyi bulur). */
export function searchMatches(query: string, values: (string | undefined | null)[]): boolean {
  const q = searchFold(query.trim());
  return !q || values.some((v) => v && searchFold(v).includes(q));
}
