"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@zenweld/auth";

/**
 * Panel oturumu ana siteden AYRI tutulur (kendi anahtari) ve yalnizca
 * yonetici hesaplari giris yapabilir. Ana siteye giris yapmis bir musteri
 * paneli acarsa giris ekranini gorur.
 */
export const ADMIN_SESSION_KEY = "zenweld.admin.session.v1";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider sessionKey={ADMIN_SESSION_KEY} roles={["admin"]}>
      {children}
    </AuthProvider>
  );
}
