import type { Metadata } from "next";
import { isLocale, type Locale } from "@zenweld/i18n";
import { SimpleContentPage } from "@/components/common/PageShell";
import { placeholderPageMetadata } from "@/lib/seo";

const TITLE = { tr: "İade ve Değişim", en: "Returns and Exchanges" };
const DESCRIPTION = {
  tr: "Zenweld ürünlerinde iade ve değişim koşulları.",
  en: "Return and exchange conditions for Zenweld products.",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const lang = (isLocale(locale) ? locale : "tr") as Locale;
  // Sayfa metni hala yer tutucu; gercek metin gelene kadar aramaya kapali.
  return placeholderPageMetadata({
    path: "/yasal/iade",
    locale: lang,
    title: TITLE,
    description: DESCRIPTION,
  });
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const lang = (isLocale(locale) ? locale : "tr") as Locale;
  return <SimpleContentPage title={TITLE[lang]} />;
}
