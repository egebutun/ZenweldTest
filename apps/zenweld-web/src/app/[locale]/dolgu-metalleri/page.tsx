import type { Metadata } from "next";
import { isLocale, type Locale } from "@zenweld/i18n";
import { CategoryListing } from "@/components/product/CategoryListing";
import { languageAlternates } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const lang = (isLocale(locale) ? locale : "tr") as Locale;
  const title = lang === "tr" ? "Dolgu Metalleri" : "Filler Metals";
  const description =
    lang === "tr"
      ? "Zenweld dolgu metalleri ürünlerini inceleyin, size en yakın yetkili bayiden satın alın."
      : "Browse Zenweld filler metals, and buy from your nearest authorised dealer.";

  return {
    title,
    description,
    alternates: languageAlternates("/dolgu-metalleri", lang),
    openGraph: { title, description, url: `/${lang}/dolgu-metalleri` },
  };
}

export default function SectionPage() {
  return <CategoryListing section="dolgu-metalleri" />;
}
