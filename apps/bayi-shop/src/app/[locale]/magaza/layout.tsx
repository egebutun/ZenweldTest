import type { Metadata } from "next";
import { isLocale, type Locale } from "@zenweld/i18n";
import { languageAlternates } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const lang = (isLocale(locale) ? locale : "tr") as Locale;
  const title = lang === "tr" ? "Tüm Ürünler" : "All Products";
  const description =
    lang === "tr"
      ? "ZENWELD-BAYİ-A stoğundaki tüm Zenweld kaynak makineleri, plazma kesme sistemleri ve ekipmanları."
      : "Every Zenweld welding machine, plasma cutter and accessory in ZENWELD-BAYİ-A stock.";

  return {
    title,
    description,
    alternates: languageAlternates("/magaza", lang),
    openGraph: { title, description, url: `/${lang}/magaza` },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
