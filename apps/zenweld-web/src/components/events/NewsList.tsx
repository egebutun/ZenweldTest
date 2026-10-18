"use client";

import { useMemo } from "react";
import { ArrowRight } from "lucide-react";
import { listNews, useDatabase } from "@zenweld/store";
import { EmptyState, ProductImage } from "@zenweld/ui";
import Link from "next/link";
import { PageHero } from "@/components/common/PageShell";
import { useT } from "@/lib/i18n-client";
import { formatDate } from "@zenweld/utils";

export function NewsList() {
  const t = useT();
  const db = useDatabase();

  const items = useMemo(() => listNews(db), [db]);

  const [lead, ...rest] = items;

  return (
    <>
      <PageHero title={t.news.title} subtitle={t.news.subtitle} />

      <div className="zw-container py-12">
        {items.length === 0 && <EmptyState title={t.news.empty} />}

        {lead && (
          <Link
            href={`/haberler/${lead.slug}`}
            className="group grid gap-6 overflow-hidden rounded-[4px] border border-zw-grey-200 md:grid-cols-2"
          >
            <div className="flex aspect-[16/10] items-center justify-center overflow-hidden bg-zw-grey-100">
              <ProductImage
                src={lead.coverUrl}
                alt={lead.title}
                label={lead.title}
                className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <div className="flex flex-col justify-center p-6 md:pr-10">
              <div className="flex items-center gap-3">
                <span className="text-xs text-zw-grey-500">
                  {formatDate(lead.publishedAt)}
                </span>
              </div>
              <h2 className="mt-3 font-display text-3xl font-bold uppercase leading-tight group-hover:text-zw-red-600">
                {lead.title}
              </h2>
              <p className="mt-3 text-zw-grey-600">{lead.summary}</p>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold uppercase text-zw-red-600">
                {t.news.readMore}
                <ArrowRight size={16} />
              </span>
            </div>
          </Link>
        )}

        {rest.length > 0 && (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((item) => (
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
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-zw-grey-400">
                      {formatDate(item.publishedAt)}
                    </span>
                  </div>
                  <h3 className="mt-2 font-display text-xl font-semibold leading-tight group-hover:text-zw-red-600">
                    {item.title}
                  </h3>
                  <p className="mt-2 line-clamp-3 text-sm text-zw-grey-500">
                    {item.summary}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
