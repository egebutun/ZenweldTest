import type { Metadata } from "next";
import { notFound } from "next/navigation";
import "@fontsource-variable/inter";
import "@fontsource/barlow-condensed/400.css";
import "@fontsource/barlow-condensed/600.css";
import "@fontsource/barlow-condensed/700.css";
import "../globals.css";

import { isLocale, locales, type Locale } from "@zenweld/i18n";
import { Providers } from "./providers";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { DemoRibbon } from "@/components/layout/DemoRibbon";

export const metadata: Metadata = {
  title: {
    default: "ZENWELD — Kaynak Teknolojileri",
    template: "%s | ZENWELD",
  },
  description:
    "Zenweld kaynak makineleri, plazma kesme sistemleri ve kaynak ekipmanları. Yetkili bayi ağı, kurumsal teklif ve teknik destek.",
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
      <body className="min-h-screen bg-white antialiased">
        <Providers locale={locale as Locale}>
          <DemoRibbon />
          <Header />
          <main className="min-h-[60vh]">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
