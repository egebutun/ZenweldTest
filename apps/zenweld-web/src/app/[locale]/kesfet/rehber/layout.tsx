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
  const title = lang === "tr" ? "Ultimate Kaynak Rehberi" : "The Ultimate Welding Guide";
  const description =
    lang === "tr"
      ? "Ücretsiz dijital kaynak rehberini edinin veya basılı sürümü sipariş edin."
      : "Get the free digital welding guide or order the printed edition.";

  return {
    title,
    description,
    alternates: languageAlternates("/kesfet/rehber", lang),
    openGraph: { title, description, url: `/${lang}/kesfet/rehber` },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
