import type { Metadata } from "next";
import { news } from "@zenweld/data";
import { JsonLd } from "@/components/common/JsonLd";
import { NewsDetail } from "@/components/events/NewsDetail";
import { SITE_NAME, absoluteUrl, canonical } from "@/lib/seo";

export function generateStaticParams() {
  return news.filter((n) => n.active).map((n) => ({ slug: n.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const item = news.find((n) => n.slug === slug);

  if (!item) return { title: "Haber" };

  const title = item.title;
  const description = item.summary;

  return {
    title,
    description,
    alternates: canonical(`/haberler/${item.slug}`),
    openGraph: {
      type: "article",
      siteName: SITE_NAME,
      title,
      description,
      url: absoluteUrl(`/haberler/${item.slug}`),
      publishedTime: item.publishedAt,
      images: [{ url: item.coverUrl, alt: title }],
    },
  };
}

export default async function NewsDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  // Tohum verisinde olmayan slug'lar yonetim panelinden eklenmis olabilir;
  // bu kayitlar yalnizca tarayici deposunda tutulur, bulmayi istemciye birakiyoruz.
  const { slug } = await params;
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
          headline: item.title,
          description: item.summary,
          datePublished: item.publishedAt,
          dateModified: item.publishedAt,
          inLanguage: "tr-TR",
          image: item.coverUrl ? [absoluteUrl(item.coverUrl)] : undefined,
          mainEntityOfPage: {
            "@type": "WebPage",
            "@id": absoluteUrl(`/haberler/${item.slug}`),
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
