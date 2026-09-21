import type { Locale } from "@zenweld/i18n";

/**
 * Etkinlik verisinde ülke adları Türkçe saklanır. İngilizce arayüzde
 * okunabilir olması için burada karşılıkları tutulur; eşleşme yoksa
 * kayıttaki değer olduğu gibi gösterilir.
 */
const EN_NAMES: Record<string, string> = {
  "Türkiye": "Türkiye",
  "Birleşik Arap Emirlikleri": "United Arab Emirates",
  "Suudi Arabistan": "Saudi Arabia",
  "Almanya": "Germany",
  "İtalya": "Italy",
  "Fransa": "France",
  "Rusya": "Russia",
  "Mısır": "Egypt",
  "Irak": "Iraq",
  "Azerbaycan": "Azerbaijan",
};

export function countryName(country: string, locale: Locale): string {
  if (locale === "tr") return country;
  return EN_NAMES[country] ?? country;
}
