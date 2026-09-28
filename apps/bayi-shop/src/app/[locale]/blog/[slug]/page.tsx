"use client";

import { use, useEffect } from "react";
import { notFound, useRouter } from "next/navigation";
import { blogSlug, matchesBlogSlug } from "@zenweld/data";
import { useDatabase } from "@zenweld/store";
import { LocaleLink } from "@/components/LocaleLink";
import { ProductImage } from "@/components/ProductImage";
import { useHref, useLocale, useT, useText } from "@/lib/i18n-client";
import { formatDate } from "@/lib/format";

export default function ShopBlogPostPage({
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

  // Yayindan kaldirilan yazi magazada da gorunmez. Adres parcasi iki
  // dilde farklidir; obur dilin slug'i da kabul edilip adres kendi
  // diline cevrilir (dil degistirme butonu icin gerekli).
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
      <div className="relative bg-zw-ink">
        <ProductImage
          src={post.coverUrl}
          alt={text(post.title)}
          label={text(post.category)}
          className="absolute inset-0 h-full w-full object-cover opacity-35"
        />
        <div className="zw-container relative py-14 text-white">
          <h1 className="max-w-3xl font-display text-3xl font-bold uppercase leading-tight sm:text-4xl">
            {text(post.title)}
          </h1>
          <p className="mt-3 text-sm text-zw-grey-300">
            {text(post.category)} · {post.author} · {formatDate(post.publishedAt, locale)}
          </p>
        </div>
      </div>

      <div className="zw-container py-12">
        <div className="max-w-3xl space-y-4 text-zw-grey-700">
          <p className="text-lg font-medium text-zw-ink">{text(post.excerpt)}</p>
          <p className="leading-relaxed">{text(post.body)}</p>
          <p className="leading-relaxed">{text(post.body)}</p>
          <LocaleLink
            href="/blog"
            className="inline-block font-semibold text-zw-red-600 hover:underline"
          >
            ← {t.explore.blog}
          </LocaleLink>
        </div>
      </div>
    </>
  );
}
