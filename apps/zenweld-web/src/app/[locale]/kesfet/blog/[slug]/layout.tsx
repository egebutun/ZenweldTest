import type { Metadata } from "next";
import { blogPosts } from "@zenweld/data";
import { isLocale, type Locale } from "@zenweld/i18n";
import { SITE_NAME, languageAlternates } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const lang = (isLocale(locale) ? locale : "tr") as Locale;
  const post = blogPosts.find((p) => p.slug === slug);

  if (!post) return { title: lang === "tr" ? "Yazı" : "Article" };

  const title = post.title[lang];
  const description = post.excerpt[lang];

  return {
    title,
    description,
    alternates: languageAlternates(`/kesfet/blog/${post.slug}`, lang),
    openGraph: {
      type: "article",
      siteName: SITE_NAME,
      title,
      description,
      url: `/${lang}/kesfet/blog/${post.slug}`,
      publishedTime: post.publishedAt,
      authors: [post.author],
      images: [{ url: post.coverUrl, alt: title }],
    },
    twitter: { card: "summary_large_image", title, description, images: [post.coverUrl] },
    // Blog govdeleri hala yer tutucu (Lorem ipsum). Gercek yazilar
    // yazilana kadar aramaya kapali; aksi halde Google bu metinleri
    // Zenweld'in gercek icerigi sanip indeksler.
    robots: { index: false, follow: true },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
