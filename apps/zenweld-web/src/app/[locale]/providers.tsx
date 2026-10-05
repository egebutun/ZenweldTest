"use client";

import type { ReactNode } from "react";
import type { UserRole } from "@zenweld/data";
import { AuthProvider } from "@zenweld/auth";
import type { Locale } from "@zenweld/i18n";
import { LocaleProvider } from "@/lib/i18n-client";
import { QuoteListProvider } from "@/lib/quote-list";

/**
 * Ana siteye giris yapabilecek roller: bireysel ve kurumsal musteriler.
 *   - Yoneticiler yalnizca ayri yonetim panelinden (/yonetim) giris yapar.
 *   - Bayiler ana sitenin musterisi degildir; kendi e-ticaret
 *     magazalarini bayi sitesinin panelinden (/yonetim) yonetir. Zenweld
 *     ile bayiler arasindaki isler ileride ayri bir B2B uygulamasinda.
 *   - Bayi magazalarinin uyeleri (User.storeId) ana siteye giris yapamaz.
 */
const SITE_ROLES: UserRole[] = ["individual", "business"];

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
