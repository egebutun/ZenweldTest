import type { Metadata } from "next";
import { PageData } from "@/components/common/PageData";
import { getBlogPostPageData, getServerContent } from "@/lib/server/content";
import { JsonLd } from "@/components/common/JsonLd";
import { OG_COVER, SITE_NAME, absoluteUrl, blogPostSeo, blogPostingJsonLd, canonical, seoMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = (await getServerContent()).blogPosts.find((p) => p.active !== false && p.slug === slug);

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
      // Kapak yoksa markali paylasim karti.
      images: [post.coverUrl ? { url: post.coverUrl, alt: post.title } : OG_COVER],
    },
    twitter: { card: "summary_large_image", title, description, images: [post.coverUrl || OG_COVER.url] },
    // Blog yazilari aramaya acik ve site haritasinda. Ornek yazilarin
    // govdesi hala yer tutucu (Lorem ipsum): site zenweld.com'da yayina
    // girmeden once gercek metinler yazilmali (docs/YAPILACAKLAR.md).
  };
}

/**
 * Yazinin yapisal verisi (BlogPosting) ve veritabani modunda yazinin
 * govdesi (yalnizca bu sayfaya gider; demo modunda null).
 */
export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = (await getServerContent()).blogPosts.find((p) => p.active !== false && p.slug === slug);
  return (
    <>
      {post && <JsonLd data={blogPostingJsonLd(post)} />}
      <PageData data={await getBlogPostPageData(slug)}>{children}</PageData>
    </>
  );
}
