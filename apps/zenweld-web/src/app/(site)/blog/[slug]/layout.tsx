import type { Metadata } from "next";
import { blogPosts } from "@zenweld/data";
import { SITE_NAME, absoluteUrl, canonical } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug);

  if (!post) return { title: "Yazı" };

  const title = post.title;
  const description = post.excerpt;

  return {
    title,
    description,
    alternates: canonical(`/blog/${post.slug}`),
    openGraph: {
      type: "article",
      siteName: SITE_NAME,
      title,
      description,
      url: absoluteUrl(`/blog/${post.slug}`),
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
