"use client";

import { use, useEffect } from "react";
import { notFound, useRouter } from "next/navigation";
import { blogSlug, matchesBlogSlug } from "@zenweld/data";
import { useDatabase } from "@zenweld/store";
import { PageHero } from "@/components/common/PageShell";
import { RichText } from "@/components/events/RichText";
import { LocaleLink } from "@/components/common/LocaleLink";
import { useHref, useLocale, useT, useText } from "@/lib/i18n-client";
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
  const router = useRouter();
  const href = useHref();

  // Yayindan kaldirilan yazi sitede gorunmez. Adres parcasi iki dilde
  // farklidir; dil degistirilince gelen "obur dilin" slug'i da kabul
  // edilir, sonra adres kendi diline cevrilir.
  const post = db.blogPosts.find((p) => matchesBlogSlug(p, slug) && p.active !== false);
  const canonicalSlug = post ? blogSlug(post, locale) : "";

  useEffect(() => {
    if (post && canonicalSlug && canonicalSlug !== slug) {
      router.replace(href(`/blog/${canonicalSlug}`));
    }
  }, [post, canonicalSlug, slug, router, href]);

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
          href="/blog"
          className="mt-8 inline-block font-semibold text-zw-red-600 hover:underline"
        >
          ← {t.explore.blog}
        </LocaleLink>
      </div>
    </>
  );
}
