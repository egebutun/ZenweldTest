import type { ZenweldDatabase } from "@zenweld/data";

export const nowIso = () => new Date().toISOString();

/**
 * KAYIT NUMARASI: "TKL-2026-" + 0049
 *
 * Yilin simdiye kadar verilmis en buyuk numarasinin bir fazlasi; her yil
 * 1'den baslar. Son verilen numara db.recordCounters'ta tutulur: en son
 * kayit silinse de numarasi yeniden verilmez. `db` mutate() taslagidir.
 */
export function nextCode(db: ZenweldDatabase, codes: string[], prefix: string, digits: number): string {
  const last = codes
    .filter((c) => c.startsWith(prefix))
    .reduce((max, c) => Math.max(max, Number(c.slice(prefix.length)) || 0), db.recordCounters[prefix] ?? 0);
  db.recordCounters[prefix] = last + 1;
  return `${prefix}${String(last + 1).padStart(digits, "0")}`;
}

interface Addressable {
  id: string;
  slug: string;
  previousSlugs?: string[];
}

/**
 * LINK DEGISINCE YONLENDIRME (urun, blog, haber, etkinlik)
 *
 * Kaydedilen kaydin adresi degistiyse eski adres previousSlugs'a eklenir;
 * sitedeki sayfa eski adresle gelen ziyaretciyi yeni adrese yonlendirir.
 * Baska bir kayit bu eski adresi alirsa o yonlendirme kalkar. `rows`
 * mutate() taslagidir; diger kayitlar yerinde guncellenir.
 *
 * Eski adresler kayitli halden alinir: formdaki taslak, ayni ekranda ikinci
 * kez link degistirilince eski kalmis olabilir.
 */
export function withPreviousSlugs<T extends Addressable>(rows: T[], item: T): T {
  const stored = rows.find((r) => r.id === item.id);
  const previous = [...new Set([...(stored?.previousSlugs ?? []), ...(stored ? [stored.slug] : [])])].filter(
    (s) => s !== item.slug,
  );
  rows.forEach((r) => {
    if (r.id !== item.id && r.previousSlugs?.includes(item.slug)) {
      r.previousSlugs = r.previousSlugs.filter((s) => s !== item.slug);
    }
  });
  return { ...item, previousSlugs: previous.length ? previous : undefined };
}

/** Eski adresi `slug` olan kayit (yeni adresine yonlendirmek icin). */
export function findMoved<T extends Addressable>(rows: T[], slug: string): T | undefined {
  return rows.find((r) => r.previousSlugs?.includes(slug));
}
