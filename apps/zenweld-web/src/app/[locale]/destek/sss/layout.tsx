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
  const title = lang === "tr" ? "Sık Sorulan Sorular" : "Frequently Asked Questions";
  const description =
    lang === "tr"
      ? "Zenweld ürünleri, garanti, sipariş ve teknik konularda sık sorulan sorular."
      : "Frequently asked questions about Zenweld products, warranty, orders and technical topics.";

  return {
    title,
    description,
    alternates: languageAlternates("/destek/sss", lang),
    openGraph: { title, description, url: `/${lang}/destek/sss` },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
