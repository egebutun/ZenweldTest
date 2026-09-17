import type { Metadata } from "next";
import { isLocale, type Locale } from "@zenweld/i18n";
import { DealerFinder } from "@/components/dealers/DealerFinder";
import { languageAlternates } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const lang = (isLocale(locale) ? locale : "tr") as Locale;
  const title = lang === "tr" ? "Nereden Alabilirim — Bayi Bul" : "Where To Buy — Find a Dealer";
  const description =
    lang === "tr"
      ? "Size en yakın Zenweld yetkili bayisini haritada bulun; ürünleri yerinde inceleyin ve satın alın."
      : "Find your nearest authorised Zenweld dealer on the map, see the products in person and buy on the spot.";

  return {
    title,
    description,
    alternates: languageAlternates("/nereden-alabilirim", lang),
    openGraph: { title, description, url: `/${lang}/nereden-alabilirim` },
  };
}

export default function WhereToBuyPage() {
  return <DealerFinder />;
}
