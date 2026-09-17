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
  const title = lang === "tr" ? "Aksesuarlar" : "Accessories";
  const description =
    lang === "tr"
      ? "Zenweld aksesuarlar ürünlerini inceleyin, size en yakın yetkili bayiden satın alın."
      : "Browse Zenweld accessories, and buy from your nearest authorised dealer.";

  return {
    title,
    description,
    alternates: languageAlternates("/aksesuarlar", lang),
    openGraph: { title, description, url: `/${lang}/aksesuarlar` },
  };
}

export default function SectionPage() {
  return <CategoryListing section="aksesuarlar" />;
}
