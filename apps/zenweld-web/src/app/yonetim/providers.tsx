"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@zenweld/auth";

/**
 * Panel oturumu ana siteden AYRI tutulur (kendi anahtari ya da cerezi) ve
 * yalnizca yonetici hesaplari giris yapabilir. Ana siteye giris yapmis bir
 * musteri paneli acarsa giris ekranini gorur.
 *
 * sessionApi: veritabani modunda panel oturumunun sunucudaki ucu (Asama
 * 4.3); yoksa demo, oturum tarayicida.
 */
const ADMIN_SESSION_KEY = "zenweld.admin.session.v1";

export function Providers({ children, sessionApi }: { children: ReactNode; sessionApi?: string }) {
  return (
    <AuthProvider sessionKey={ADMIN_SESSION_KEY} roles={["admin"]} api={sessionApi}>
      {children}
    </AuthProvider>
  );
}
