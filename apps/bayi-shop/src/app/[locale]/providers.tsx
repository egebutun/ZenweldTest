"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@zenweld/auth";
import type { Locale } from "@zenweld/i18n";
import { LocaleProvider } from "@/lib/i18n-client";
import { CartProvider } from "@/lib/cart";
import { STORE } from "@/lib/store-config";

export function Providers({ locale, children }: { locale: Locale; children: ReactNode }) {
  return (
    <LocaleProvider locale={locale}>
      <AuthProvider>
        <CartProvider
          freeShippingOver={STORE.freeShippingOver}
          shippingFee={STORE.shippingFee}
        >
          {children}
        </CartProvider>
      </AuthProvider>
    </LocaleProvider>
  );
}
