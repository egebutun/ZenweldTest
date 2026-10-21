import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "@fontsource/barlow-condensed/400.css";
import "@fontsource/barlow-condensed/600.css";
import "@fontsource/barlow-condensed/700.css";
import "../globals.css";

import { SITE_DESCRIPTION, SITE_NAME, getSiteUrl, isNoIndex, socialMetadata } from "@/lib/seo";
import { HOME_TITLE } from "@/lib/page-meta";
import { StaticPageSeoTitle } from "@/lib/page-seo-client";
import { Providers } from "./providers";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { WelcomeGate } from "@/components/layout/WelcomeGate";
import { CookieBanner } from "@/components/layout/CookieBanner";

/** Android Chrome ve iOS Safari tarayıcı çubuğunu marka rengine boyar. */
export const viewport: Viewport = {
  themeColor: "#b82429",
  width: "device-width",
  initialScale: 1,
};

export function generateMetadata(): Metadata {
  return {
    metadataBase: new URL(getSiteUrl()),
    title: { default: HOME_TITLE, template: `%s | ${SITE_NAME}` },
    description: SITE_DESCRIPTION,
    applicationName: SITE_NAME,
    // Asil adres (canonical) burada verilmez: verilseydi kendi adresini
    // bildirmeyen her sayfa "asil adresim ana sayfa" demis olurdu. Ana
    // sayfanin adresi (site)/page.tsx'te.
    robots: isNoIndex()
      ? { index: false, follow: false }
      : { index: true, follow: true },
    ...socialMetadata({ title: HOME_TITLE, description: SITE_DESCRIPTION, path: "/" }),
  };
}

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className="min-h-screen bg-white antialiased">
        <Providers>
          <WelcomeGate />
          <StaticPageSeoTitle />
          <Header />
          {/* Indirimli kartlarin alev susu bilerek kart disina tasar; ekranin
              kenarindaki kartta sayfayi yana kaydirmasin diye yatayda kirpilir.
              (clip, hidden'dan farkli olarak yapiskan basligi bozmaz.) */}
          <main className="min-h-[60vh] overflow-x-clip">{children}</main>
          <Footer />
          <CookieBanner />
        </Providers>
      </body>
    </html>
  );
}
