"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import {
  defaultLocale,
  getDictionary,
  interpolate,
  localizePath,
  type Dictionary,
  type Locale,
} from "@zenweld/i18n";
import type { I18nText } from "@zenweld/data";

interface LocaleContextValue {
  locale: Locale;
  dict: Dictionary;
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: defaultLocale,
  dict: getDictionary(defaultLocale),
});

export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  const value = useMemo(() => ({ locale, dict: getDictionary(locale) }), [locale]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): Locale {
  return useContext(LocaleContext).locale;
}

/** Sozluk erisimi: const t = useT(); t.product.whereToBuy */
export function useT(): Dictionary {
  return useContext(LocaleContext).dict;
}

/** Cift dilli veri alanini secili dile gore dondurur. */
export function useText() {
  const locale = useLocale();
  return (value: I18nText | undefined) => (value ? value[locale] : "");
}

/** Sablonlu metin: tr("{count} bayi bulundu", { count: 12 }) */
export function useFormatMessage() {
  return (template: string, values: Record<string, string | number>) =>
    interpolate(template, values);
}

/**
 * Locale on ekli, dile cevrilmis link uretir.
 *   href("/urun/arc-200")  ->  "/tr/urun/arc-200"      (TR)
 *   href("/urun/arc-200")  ->  "/en/products/arc-200"  (EN)
 *
 * Bilesenlerde her zaman Turkce ic rota yazilir; cevirme burada olur.
 */
export function useHref() {
  const locale = useLocale();
  return (path: string) => {
    if (path.startsWith("http") || path.startsWith("#") || path.startsWith("mailto:")) {
      return path;
    }
    const clean = path.startsWith("/") ? path : `/${path}`;
    return `/${locale}${localizePath(clean, locale)}`;
  };
}

export function localeHref(locale: Locale, path: string): string {
  if (path.startsWith("http") || path.startsWith("#")) return path;
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `/${locale}${localizePath(clean, locale)}`;
}
