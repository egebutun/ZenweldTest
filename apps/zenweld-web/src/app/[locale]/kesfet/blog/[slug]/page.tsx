"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import { useDatabase } from "@zenweld/store";
import { PageHero } from "@/components/common/PageShell";
import { RichText } from "@/components/events/RichText";
import { LocaleLink } from "@/components/common/LocaleLink";
import { useLocale, useT, useText } from "@/lib/i18n-client";
import { formatDate } from "@/lib/format";

export default function BlogPostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { slug } = use(params);
  const t = useT();
  const locale = useLocale();
  const text = useText();
  const db = useDatabase();

  // Yayindan kaldirilan yazi sitede gorunmez.
  const post = db.blogPosts.find((p) => p.slug === slug && p.active !== false);
  if (!post) notFound();

  return (
    <>
      <PageHero
        title={text(post.title)}
        subtitle={`${text(post.category)} · ${post.author} · ${formatDate(post.publishedAt, locale)}`}
        image={post.coverUrl}
      />
      <div className="zw-container py-12">
        <p className="max-w-3xl text-lg font-medium text-zw-ink">{text(post.excerpt)}</p>
        {/* Yonetim panelinde girilen bicimlendirme (## ara baslik, - madde,
            **kalin**) haberlerdekiyle ayni sekilde uygulanir. */}
        <RichText source={text(post.body)} className="mt-6 max-w-3xl" />
        <LocaleLink
          href="/kesfet/blog"
          className="mt-8 inline-block font-semibold text-zw-red-600 hover:underline"
        >
          ← {t.explore.blog}
        </LocaleLink>
      </div>
    </>
  );
}
