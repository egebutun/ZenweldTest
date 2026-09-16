"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@zenweld/auth";
import type { Locale } from "@zenweld/i18n";
import { LocaleProvider } from "@/lib/i18n-client";
import { QuoteListProvider } from "@/lib/quote-list";

export function Providers({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  return (
    <LocaleProvider locale={locale}>
      <AuthProvider>
        <QuoteListProvider>{children}</QuoteListProvider>
      </AuthProvider>
    </LocaleProvider>
  );
}
