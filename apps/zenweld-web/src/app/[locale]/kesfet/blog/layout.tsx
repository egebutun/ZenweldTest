import type { Metadata } from "next";
import { isLocale, type Locale } from "@zenweld/i18n";
import { SITE_NAME, languageAlternates } from "@/lib/seo";

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
      ? "Kaynak dünyasından haberler, teknik rehberler ve uzman ipuçları."
      : "News, technical guides and expert tips from the world of welding.";

  return {
    title: { default: title, template: `%s | ${SITE_NAME}` },
    description,
    alternates: languageAlternates("/kesfet/blog", lang),
    openGraph: { title, description, url: `/${lang}/kesfet/blog` },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
