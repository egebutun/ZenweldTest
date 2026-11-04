"use client";

import type { ReactNode } from "react";
import type { UserRole } from "@zenweld/data";
import { AuthProvider } from "@zenweld/auth";
import { ServerDataProvider, type ServerData } from "@zenweld/store";
import { CartProvider } from "@/lib/cart";
import { FavouritesProvider } from "@/lib/favourites";
import { QuoteListProvider } from "@/lib/quote-list";

/**
 * Ana siteye giris yapabilecek roller: bireysel ve kurumsal musteriler.
 * Yoneticiler yalnizca yonetim panelinden (/yonetim) giris yapar.
 */
const SITE_ROLES: UserRole[] = ["individual", "business"];

/**
 * data: veri kaynagi veritabaniysa sunucuda okunan katalog (KARARLAR
 * K-88); demo modunda null, site tarayicidaki veriyle calisir.
 */
export function Providers({ data, children }: { data: ServerData | null; children: ReactNode }) {
  return (
    <ServerDataProvider data={data}>
      <AuthProvider roles={SITE_ROLES}>
        <CartProvider>
          <FavouritesProvider>
            <QuoteListProvider>{children}</QuoteListProvider>
          </FavouritesProvider>
        </CartProvider>
      </AuthProvider>
    </ServerDataProvider>
  );
}
