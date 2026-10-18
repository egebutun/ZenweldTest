"use client";

import type { ReactNode } from "react";
import type { UserRole } from "@zenweld/data";
import { AuthProvider } from "@zenweld/auth";
import { CartProvider } from "@/lib/cart";
import { QuoteListProvider } from "@/lib/quote-list";

/**
 * Ana siteye giris yapabilecek roller: bireysel ve kurumsal musteriler.
 * Yoneticiler yalnizca yonetim panelinden (/yonetim) giris yapar.
 */
const SITE_ROLES: UserRole[] = ["individual", "business"];

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider roles={SITE_ROLES}>
      <CartProvider>
        <QuoteListProvider>{children}</QuoteListProvider>
      </CartProvider>
    </AuthProvider>
  );
}
