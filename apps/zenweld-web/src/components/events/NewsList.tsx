"use client";

import { useMemo } from "react";
import { listNews, useDatabase } from "@zenweld/store";
import { EmptyState, ProductImage } from "@zenweld/ui";
import Link from "next/link";
import { PageHero } from "@/components/common/PageShell";
import { useT } from "@/lib/i18n-client";
import { formatDate } from "@zenweld/utils";

/**
 * Haberler sayfasi: Blog ile ayni kart duzeni, hepsi ayni boyutta (manset yok).
 * Haber gorselleri afis ve genis fotograflar oldugu icin kirpilmaz.
 */
export function NewsList() {
  const t = useT();
  const db = useDatabase();

  const items = useMemo(() => listNews(db), [db]);

  return (
    <>
      <PageHero title={t.news.title} subtitle={t.news.subtitle} />

      <div className="zw-container py-12">
        {items.length === 0 && <EmptyState title={t.news.empty} />}

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/haberler/${item.slug}`}
              className="group overflow-hidden rounded-[4px] border border-zw-grey-200"
            >
              <div className="flex aspect-[16/9] items-center justify-center overflow-hidden bg-zw-grey-100">
                <ProductImage
                  src={item.coverUrl}
                  alt={item.title}
                  label={item.title}
                  className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="p-5">
                <h2 className="font-display text-xl font-semibold leading-tight group-hover:text-zw-red-600">
                  {item.title}
                </h2>
                <p className="mt-2 line-clamp-3 text-sm text-zw-grey-500">{item.summary}</p>
                <div className="mt-3 text-xs text-zw-grey-400">{formatDate(item.publishedAt)}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
