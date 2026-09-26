import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import "@fontsource-variable/inter";
import "@fontsource/barlow-condensed/400.css";
import "@fontsource/barlow-condensed/600.css";
import "@fontsource/barlow-condensed/700.css";
import "../globals.css";

import { isLocale, locales, type Locale } from "@zenweld/i18n";
import {
  SITE_NAME,
  getSiteUrl,
  isNoIndex,
  languageAlternates,
  siteDescription,
} from "@/lib/seo";
import { Providers } from "./providers";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { DemoRibbon } from "@/components/layout/DemoRibbon";
import { WelcomeGate } from "@/components/layout/WelcomeGate";

/** Android Chrome ve iOS Safari tarayıcı çubuğunu marka rengine boyar. */
export const viewport: Viewport = {
  themeColor: "#b82429",
  width: "device-width",
  initialScale: 1,
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const lang = (isLocale(locale) ? locale : "tr") as Locale;
  const description = siteDescription(lang);
  const title =
    lang === "tr"
      ? "ZENWELD — Kaynak Makineleri ve Plazma Kesme Sistemleri"
      : "ZENWELD — Welding Machines and Plasma Cutting Systems";

  return {
    metadataBase: new URL(getSiteUrl()),
    title: { default: title, template: `%s | ${SITE_NAME}` },
    description,
    applicationName: SITE_NAME,
    alternates: languageAlternates("/", lang),
    robots: isNoIndex()
      ? { index: false, follow: false }
      : { index: true, follow: true },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: lang === "tr" ? "tr_TR" : "en_US",
      alternateLocale: lang === "tr" ? "en_US" : "tr_TR",
      title,
      description,
      url: `/${lang}`,
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
      title,
      description,
      images: ["/images/brand/og-cover.png"],
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <html lang={locale}>
      <body className="min-h-screen bg-white antialiased">
        <Providers locale={locale as Locale}>
          <DemoRibbon />
          <WelcomeGate />
          <Header />
          <main className="min-h-[60vh]">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
