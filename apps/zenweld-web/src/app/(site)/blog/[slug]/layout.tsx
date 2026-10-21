import type { Metadata } from "next";
import { blogPosts } from "@zenweld/data";
import { SITE_NAME, absoluteUrl, blogPostSeo, canonical, seoMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.active !== false && p.slug === slug);

  if (!post) return { title: "Yazı" };

  // Panelin SEO sekmesi; bos alanlarda yazinin basligi ve ozeti.
  const seo = blogPostSeo(post);
  const title = seo.title;
  const description = seo.description;

  return {
    ...seoMetadata(seo),
    alternates: canonical(`/blog/${post.slug}`),
    openGraph: {
      type: "article",
      siteName: SITE_NAME,
      title,
      description,
      url: absoluteUrl(`/blog/${post.slug}`),
      publishedTime: post.publishedAt,
      authors: [post.author],
      images: [{ url: post.coverUrl, alt: post.title }],
    },
    twitter: { card: "summary_large_image", title, description, images: [post.coverUrl] },
    // Blog yazilari aramaya acik ve site haritasinda. Ornek yazilarin
    // govdesi hala yer tutucu (Lorem ipsum): site zenweld.com'da yayina
    // girmeden once gercek metinler yazilmali (docs/YAPILACAKLAR.md).
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
