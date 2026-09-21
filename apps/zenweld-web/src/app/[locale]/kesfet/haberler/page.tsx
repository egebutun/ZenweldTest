import type { Metadata } from "next";
import { isLocale, type Locale } from "@zenweld/i18n";
import { NewsList } from "@/components/events/NewsList";
import { SITE_NAME, languageAlternates } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const lang = (isLocale(locale) ? locale : "tr") as Locale;
  const title = lang === "tr" ? "Haberler" : "News";
  const description =
    lang === "tr"
      ? "Zenweld'den son gelişmeler, duyurular ve basın açıklamaları."
      : "Latest developments, announcements and press releases from Zenweld.";

  return {
    title: { default: title, template: `%s | ${SITE_NAME}` },
    description,
    alternates: languageAlternates("/kesfet/haberler", lang),
    openGraph: { title, description, url: `/${lang}/kesfet/haberler` },
  };
}

export default function NewsPage() {
  return <NewsList />;
}
