import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "@fontsource/barlow-condensed/400.css";
import "@fontsource/barlow-condensed/600.css";
import "@fontsource/barlow-condensed/700.css";
import "../globals.css";

import { SITE_DESCRIPTION, SITE_NAME, absoluteUrl, canonical, getSiteUrl, isNoIndex } from "@/lib/seo";
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

const TITLE = "ZENWELD — Kaynak Makineleri ve Plazma Kesme Sistemleri";

export function generateMetadata(): Metadata {
  return {
    metadataBase: new URL(getSiteUrl()),
    title: { default: TITLE, template: `%s | ${SITE_NAME}` },
    description: SITE_DESCRIPTION,
    applicationName: SITE_NAME,
    alternates: canonical("/"),
    robots: isNoIndex()
      ? { index: false, follow: false }
      : { index: true, follow: true },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: "tr_TR",
      title: TITLE,
      description: SITE_DESCRIPTION,
      url: absoluteUrl("/"),
      // Paylasim karti: 1200x630 markali gorsel. Onceden dikey bir urun
      // fotografi vardi; WhatsApp/LinkedIn bu olcuyu kirptigi icin marka
      // gorunmuyordu. Kart scripts/make-brand-images.mjs ile uretilir.
      images: [
        {
          url: "/images/brand/og-cover.png",
          width: 1200,
          height: 630,
          alt: SITE_NAME,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: TITLE,
      description: SITE_DESCRIPTION,
      images: ["/images/brand/og-cover.png"],
    },
  };
}

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className="min-h-screen bg-white antialiased">
        <Providers>
          <WelcomeGate />
          <Header />
          <main className="min-h-[60vh]">{children}</main>
          <Footer />
          <CookieBanner />
        </Providers>
      </body>
    </html>
  );
}
