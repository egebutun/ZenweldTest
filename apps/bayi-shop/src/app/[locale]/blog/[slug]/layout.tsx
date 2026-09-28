import type { Metadata } from "next";
import { blogPosts, blogSlug, matchesBlogSlug } from "@zenweld/data";
import { isLocale, type Locale } from "@zenweld/i18n";
import { languageAlternatesFor, ogUrl } from "@/lib/seo";
import { STORE } from "@/lib/store-config";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const lang = (isLocale(locale) ? locale : "tr") as Locale;
  const post = blogPosts.find((p) => matchesBlogSlug(p, slug));

  if (!post) return { title: lang === "tr" ? "Yazı" : "Article" };

  const title = post.title[lang];
  const description = post.excerpt[lang];

  return {
    title,
    description,
    alternates: languageAlternatesFor((l) => `/blog/${blogSlug(post, l)}`, lang),
    openGraph: {
      type: "article",
      siteName: STORE.name,
      title,
      description,
      url: ogUrl(`/blog/${blogSlug(post, lang)}`, lang),
      publishedTime: post.publishedAt,
      authors: [post.author],
      images: [{ url: post.coverUrl, alt: title }],
    },
    twitter: { card: "summary_large_image", title, description, images: [post.coverUrl] },
    // Blog govdeleri hala yer tutucu (Lorem ipsum). Gercek yazilar
    // yazilana kadar aramaya kapali — ana sitedeki kuralin aynisi.
    robots: { index: false, follow: true },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
