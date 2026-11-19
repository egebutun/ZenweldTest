"use client";

import { POSTS_PER_PAGE, pageCount, pageItems } from "@zenweld/data";
import { listBlogPosts, useDatabase } from "@zenweld/store";
import Link from "next/link";
import { ProductImage } from "@zenweld/ui";
import { PageHero } from "@/components/common/PageShell";
import { EmptyPage, Pager } from "@/components/common/Pager";
import { useT } from "@/lib/i18n-client";
import { formatDate } from "@zenweld/utils";

/** Blog yazilari; sayfa basina 12, sonraki sayfalar /blog/sayfa/<n> (K-124). */
export function BlogList({ page = 1 }: { page?: number }) {
  const t = useT();
  const db = useDatabase();
  const all = listBlogPosts(db);
  const posts = pageItems(all, page, POSTS_PER_PAGE);

  return (
    <>
      <PageHero title={t.explore.blog} subtitle={t.explore.blogDesc} />

      <div className="zw-container py-12">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group overflow-hidden rounded-[4px] border border-zw-grey-200"
            >
              <div className="aspect-[16/9] overflow-hidden bg-zw-grey-100">
                <ProductImage
                  src={post.coverUrl}
                  alt={post.title}
                  label={post.category}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="p-5">
                <div className="text-xs font-semibold uppercase tracking-wide text-zw-red-600">
                  {post.category}
                </div>
                <h2 className="mt-2 font-display text-xl font-semibold leading-tight group-hover:text-zw-red-600">
                  {post.title}
                </h2>
                <p className="mt-2 line-clamp-3 text-sm text-zw-grey-500">{post.excerpt}</p>
                <div className="mt-3 text-xs text-zw-grey-400">
                  {post.author} · {formatDate(post.publishedAt)}
                </div>
              </div>
            </Link>
          ))}
        </div>
        {page > 1 && posts.length === 0 && <EmptyPage basePath="/blog" />}
        <Pager page={page} pageCount={pageCount(all.length, POSTS_PER_PAGE)} basePath="/blog" />
      </div>
    </>
  );
}
