import type { Metadata } from "next";
import { news } from "@zenweld/data";
import { isLocale, type Locale } from "@zenweld/i18n";
import { JsonLd } from "@/components/common/JsonLd";
import { NewsDetail } from "@/components/events/NewsDetail";
import { SITE_NAME, absoluteUrl, languageAlternates } from "@/lib/seo";

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
  const { locale, slug } = await params;
  const lang = (isLocale(locale) ? locale : "tr") as Locale;
  const item = news.find((n) => n.slug === slug);

  if (!item) return <NewsDetail slug={slug} />;

  // Etkinliklerde Event yapisal verisi vardi, haberlerde yoktu. NewsArticle
  // sayesinde haberler Google Haber/arama sonuclarinda tarih ve yayinciyla
  // birlikte gosterilebiliyor.
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "NewsArticle",
          headline: item.title[lang],
          description: item.summary[lang],
          datePublished: item.publishedAt,
          dateModified: item.publishedAt,
          inLanguage: lang === "tr" ? "tr-TR" : "en-US",
          image: item.coverUrl ? [absoluteUrl(item.coverUrl)] : undefined,
          mainEntityOfPage: {
            "@type": "WebPage",
            "@id": absoluteUrl(`/${lang}/kesfet/haberler/${item.slug}`),
          },
          author: { "@type": "Organization", name: SITE_NAME },
          publisher: {
            "@type": "Organization",
            name: SITE_NAME,
            logo: {
              "@type": "ImageObject",
              url: absoluteUrl("/images/brand/zenweld-logo.png"),
            },
          },
        }}
      />
      <NewsDetail slug={slug} />
    </>
  );
}
