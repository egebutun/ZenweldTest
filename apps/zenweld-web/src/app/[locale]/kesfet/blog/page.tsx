"use client";

import { useDatabase } from "@zenweld/store";
import { LocaleLink } from "@/components/common/LocaleLink";
import { ProductImage } from "@/components/common/ProductImage";
import { PageHero } from "@/components/common/PageShell";
import { useLocale, useT, useText } from "@/lib/i18n-client";
import { formatDate } from "@/lib/format";

export default function BlogPage() {
  const t = useT();
  const locale = useLocale();
  const text = useText();
  const db = useDatabase();

  return (
    <>
      <PageHero title={t.explore.blog} subtitle={t.explore.blogDesc} />

      <div className="zw-container py-12">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {db.blogPosts.map((post) => (
            <LocaleLink
              key={post.id}
              href={`/kesfet/blog/${post.slug}`}
              className="group overflow-hidden rounded-[4px] border border-zw-grey-200"
            >
              <div className="aspect-[16/9] overflow-hidden bg-zw-grey-100">
                <ProductImage
                  src={post.coverUrl}
                  alt={text(post.title)}
                  label={text(post.category)}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="p-5">
                <div className="text-xs font-semibold uppercase tracking-wide text-zw-red-600">
                  {text(post.category)}
                </div>
                <h2 className="mt-2 font-display text-xl font-semibold leading-tight group-hover:text-zw-red-600">
                  {text(post.title)}
                </h2>
                <p className="mt-2 line-clamp-3 text-sm text-zw-grey-500">{text(post.excerpt)}</p>
                <div className="mt-3 text-xs text-zw-grey-400">
                  {post.author} · {formatDate(post.publishedAt, locale)}
                </div>
              </div>
            </LocaleLink>
          ))}
        </div>
      </div>
    </>
  );
}
