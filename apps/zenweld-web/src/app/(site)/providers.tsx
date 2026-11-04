"use client";

import type { ReactNode } from "react";
import type { UserRole } from "@zenweld/data";
import { AuthProvider } from "@zenweld/auth";
import { CatalogProvider, type CatalogData } from "@zenweld/store";
import { CartProvider } from "@/lib/cart";
import { FavouritesProvider } from "@/lib/favourites";
import { QuoteListProvider } from "@/lib/quote-list";

/**
 * Ana siteye giris yapabilecek roller: bireysel ve kurumsal musteriler.
 * Yoneticiler yalnizca yonetim panelinden (/yonetim) giris yapar.
 */
const SITE_ROLES: UserRole[] = ["individual", "business"];

/**
 * catalog: veri kaynagi veritabaniysa sunucuda okunan katalog (KARARLAR
 * K-88); demo modunda null, site tarayicidaki veriyle calisir.
 */
export function Providers({ catalog, children }: { catalog: CatalogData | null; children: ReactNode }) {
  return (
    <CatalogProvider catalog={catalog}>
      <AuthProvider roles={SITE_ROLES}>
        <CartProvider>
          <FavouritesProvider>
            <QuoteListProvider>{children}</QuoteListProvider>
          </FavouritesProvider>
        </CartProvider>
      </AuthProvider>
    </CatalogProvider>
  );
}
