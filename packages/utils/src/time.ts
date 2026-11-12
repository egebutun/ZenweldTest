/**
 * TARIH SIRALAMASI
 *
 * Kayit tarihleri farkli bicimlerde gelebilir: ornek veride Turkiye saatiyle
 * ("2026-11-13T00:33:00+03:00"), tarayicida ve veritabaninda UTC
 * ("2026-11-12T21:38:12.000Z"). Metin olarak karsilastirilinca ayni gunun
 * kayitlari yanlis siralanir (yeni bir kayit eski bir kaydin altina duser);
 * bu yuzden tarihler zamana cevrilerek karsilastirilir.
 */

/** Tarihin zamani (ms); okunamazsa NaN. */
const timeOf = (iso: string) => Date.parse(iso);

/** sort() icin: yeni tarih once. Okunamayan tarihler metin olarak karsilastirilir. */
export function newestFirst(a: string, b: string): number {
  const diff = timeOf(b) - timeOf(a);
  return Number.isNaN(diff) ? b.localeCompare(a) : diff;
}
