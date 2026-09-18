export const locales = ["tr", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "tr";

export const localeNames: Record<Locale, string> = {
  tr: "Türkçe",
  en: "English",
};

import { internalizePath, localizePath } from "./pathnames";

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

/**
 * Dil degistirirken adresi de cevirir.
 * "/tr/urun/arc-200"      -> "/en/products/arc-200"
 * "/en/products/arc-200"  -> "/tr/urun/arc-200"
 */
export function switchLocaleInPath(pathname: string, next: Locale): string {
  const parts = pathname.split("/").filter(Boolean);
  const hasLocale = parts.length > 0 && isLocale(parts[0]);
  const rest = hasLocale ? parts.slice(1) : parts;
  const restPath = rest.length > 0 ? "/" + rest.join("/") : "";

  // Once ic rotaya cevir, sonra hedef dile
  const internal = internalizePath(restPath);
  return `/${next}${localizePath(internal, next)}`;
}
