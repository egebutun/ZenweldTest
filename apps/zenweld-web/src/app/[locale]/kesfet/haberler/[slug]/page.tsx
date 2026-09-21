import type { Metadata } from "next";
import { news } from "@zenweld/data";
import { isLocale, type Locale } from "@zenweld/i18n";
import { NewsDetail } from "@/components/events/NewsDetail";
import { SITE_NAME, languageAlternates } from "@/lib/seo";

export function generateStaticParams() {
  return news.filter((n) => n.active).map((n) => ({ slug: n.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const lang = (isLocale(locale) ? locale : "tr") as Locale;
  const item = news.find((n) => n.slug === slug);

  if (!item) return { title: lang === "tr" ? "Haber" : "News" };

  const title = item.title[lang];
  const description = item.summary[lang];

  return {
    title,
    description,
    alternates: languageAlternates(`/kesfet/haberler/${item.slug}`, lang),
    openGraph: {
      type: "article",
      siteName: SITE_NAME,
      title,
      description,
      url: `/${lang}/kesfet/haberler/${item.slug}`,
      publishedTime: item.publishedAt,
      images: [{ url: item.coverUrl, alt: title }],
    },
  };
}

export default async function NewsDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  // Tohum verisinde olmayan slug'lar yonetim panelinden eklenmis olabilir;
  // bu kayitlar yalnizca tarayici deposunda tutulur, bulmayi istemciye birakiyoruz.
  const { slug } = await params;
  return <NewsDetail slug={slug} />;
}
