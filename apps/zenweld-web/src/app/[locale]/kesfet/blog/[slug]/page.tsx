"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import { useDatabase } from "@zenweld/store";
import { PageHero, Prose } from "@/components/common/PageShell";
import { LocaleLink } from "@/components/common/LocaleLink";
import { useLocale, useText } from "@/lib/i18n-client";
import { formatDate } from "@/lib/format";

export default function BlogPostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { slug } = use(params);
  const locale = useLocale();
  const text = useText();
  const db = useDatabase();

  const post = db.blogPosts.find((p) => p.slug === slug);
  if (!post) notFound();

  return (
    <>
      <PageHero
        title={text(post.title)}
        subtitle={`${text(post.category)} · ${post.author} · ${formatDate(post.publishedAt, locale)}`}
        image={post.coverUrl}
      />
      <Prose>
        <p className="text-lg font-medium text-zw-ink">{text(post.excerpt)}</p>
        <p>{text(post.body)}</p>
        <p>{text(post.body)}</p>
        <LocaleLink
          href="/kesfet/blog"
          className="inline-block font-semibold text-zw-red-600 hover:underline"
        >
          ← {text(post.category)}
        </LocaleLink>
      </Prose>
    </>
  );
}
