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
  const title = lang === "tr" ? "Blog" : "Blog";
  const description =
    lang === "tr"
      ? "Kaynak dünyasından haberler, teknik rehberler ve Zenweld ürün yazıları."
      : "News from the welding world, technical guides and Zenweld product articles.";

  return {
    title,
    description,
    alternates: languageAlternates("/blog", lang),
    openGraph: { title, description, url: `/${lang}/blog` },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
