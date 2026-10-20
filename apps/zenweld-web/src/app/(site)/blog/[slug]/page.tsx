"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import { findBlogPostBySlug, findMovedBlogPost, useDatabase } from "@zenweld/store";
import { PageHero } from "@/components/common/PageShell";
import { RichText } from "@zenweld/ui";
import Link from "next/link";
import { useT } from "@/lib/i18n-client";
import { formatDate } from "@zenweld/utils";
import { blogPostSeo } from "@/lib/seo";
import { useMovedRedirect, useSeoTitle } from "@/lib/page-seo-client";

export default function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const t = useT();
  const db = useDatabase();

  // Yayindan kaldirilan yazi sitede gorunmez.
  const post = findBlogPostBySlug(slug, db);
  const moved = post ? undefined : findMovedBlogPost(slug, db);
  useMovedRedirect(moved, "/blog");
  useSeoTitle(post && blogPostSeo(post).title);

  if (!post) {
    if (moved) return null;
    notFound();
  }

  return (
    <>
      <PageHero
        title={post.title}
        subtitle={`${post.category} · ${post.author} · ${formatDate(post.publishedAt)}`}
        image={post.coverUrl}
      />
      <div className="zw-container py-12">
        <p className="max-w-3xl text-lg font-medium text-zw-ink">{post.excerpt}</p>
        {/* Yonetim panelinde girilen bicimlendirme (## ara baslik, - madde,
            **kalin**) haberlerdekiyle ayni sekilde uygulanir. */}
        <RichText source={post.body} className="mt-6 max-w-3xl" />
        <Link
          href="/blog"
          className="mt-8 inline-block font-semibold text-zw-red-600 hover:underline"
        >
          ← {t.explore.blog}
        </Link>
      </div>
    </>
  );
}
