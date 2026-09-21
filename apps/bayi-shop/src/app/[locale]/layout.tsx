import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import "@fontsource-variable/inter";
import "@fontsource/barlow-condensed/400.css";
import "@fontsource/barlow-condensed/600.css";
import "@fontsource/barlow-condensed/700.css";
import "../globals.css";

import { isLocale, locales, type Locale } from "@zenweld/i18n";
import { Providers } from "./providers";
import { ShopHeader } from "@/components/ShopHeader";
import { ShopFooter } from "@/components/ShopFooter";
import { STORE } from "@/lib/store-config";
import { getSiteUrl, isNoIndex, languageAlternates } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const lang = isLocale(locale) ? locale : "tr";
  const title =
    lang === "tr"
      ? `${STORE.name} — Yetkili Zenweld Bayisi`
      : `${STORE.name} — Authorised Zenweld Dealer`;
  const description =
    lang === "tr"
      ? "Yetkili Zenweld bayisi. Kaynak makineleri, plazma kesme sistemleri ve kaynak ekipmanlarını online satın alın. Hızlı kargo, orijinal ürün garantisi."
      : "Authorised Zenweld dealer. Buy welding machines, plasma cutters and welding equipment online. Fast shipping, genuine product warranty.";

  return {
    metadataBase: new URL(getSiteUrl()),
    title: { default: title, template: `%s | ${STORE.name}` },
    description,
    alternates: languageAlternates("/", lang),
    robots: isNoIndex() ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: {
      type: "website",
      siteName: STORE.name,
      locale: lang === "tr" ? "tr_TR" : "en_US",
      title,
      description,
      url: `/${lang}`,
      images: [
        { url: "/images/products/zenweld-urun.png", width: 748, height: 1064, alt: STORE.name },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/images/products/zenweld-urun.png"],
    },
  };
}

/** Android Chrome ve iOS Safari tarayıcı çubuğunu marka rengine boyar. */
export const viewport: Viewport = {
  themeColor: "#b82429",
  width: "device-width",
  initialScale: 1,
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
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
      <body className="min-h-screen bg-white">
        <Providers locale={locale as Locale}>
          <ShopHeader />
          <main className="min-h-[60vh]">{children}</main>
          <ShopFooter />
        </Providers>
      </body>
    </html>
  );
}
