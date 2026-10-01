"use client";

import type { ReactNode } from "react";
import type { UserRole } from "@zenweld/data";
import { AuthProvider } from "@zenweld/auth";
import type { Locale } from "@zenweld/i18n";
import { LocaleProvider } from "@/lib/i18n-client";
import { QuoteListProvider } from "@/lib/quote-list";

/**
 * Ana siteye giris yapabilecek roller. Yonetici hesaplari burada GECERSIZ;
 * yoneticiler yalnizca ayri yonetim panelinden (/yonetim) giris yapar.
 */
const SITE_ROLES: UserRole[] = ["individual", "business", "dealer"];

export function Providers({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  return (
    <LocaleProvider locale={locale}>
      <AuthProvider roles={SITE_ROLES}>
        <QuoteListProvider>{children}</QuoteListProvider>
      </AuthProvider>
    </LocaleProvider>
  );
}
