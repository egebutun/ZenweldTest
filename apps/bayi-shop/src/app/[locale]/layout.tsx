import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: {
    default: `${STORE.name} — Yetkili Zenweld Bayisi`,
    template: `%s | ${STORE.name}`,
  },
  description:
    "Yetkili Zenweld bayisi. Kaynak makineleri, plazma kesme sistemleri ve kaynak ekipmanlarını online satın alın.",
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
