"use client";

import { useMemo } from "react";
import { ArrowRight } from "lucide-react";
import { useDatabase } from "@zenweld/store";
import { Badge, EmptyState } from "@zenweld/ui";
import { LocaleLink } from "@/components/common/LocaleLink";
import { ProductImage } from "@/components/common/ProductImage";
import { PageHero } from "@/components/common/PageShell";
import { useLocale, useT, useText } from "@/lib/i18n-client";
import { formatDate } from "@/lib/format";

export function NewsList() {
  const t = useT();
  const locale = useLocale();
  const text = useText();
  const db = useDatabase();

  const items = useMemo(
    () =>
      db.news
        .filter((n) => n.active)
        .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)),
    [db],
  );

  const [lead, ...rest] = items;

  return (
    <>
      <PageHero title={t.news.title} subtitle={t.news.subtitle} />

      <div className="zw-container py-12">
        {items.length === 0 && <EmptyState title={t.news.empty} />}

        {lead && (
          <LocaleLink
            href={`/kesfet/haberler/${lead.slug}`}
            className="group grid gap-6 overflow-hidden rounded-[4px] border border-zw-grey-200 md:grid-cols-2"
          >
            <div className="aspect-[16/10] overflow-hidden bg-zw-grey-100">
              <ProductImage
                src={lead.coverUrl}
                alt={text(lead.title)}
                label={text(lead.category)}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <div className="flex flex-col justify-center p-6 md:pr-10">
              <div className="flex items-center gap-3">
                <Badge tone="red">{text(lead.category)}</Badge>
                <span className="text-xs text-zw-grey-500">
                  {formatDate(lead.publishedAt, locale)}
                </span>
              </div>
              <h2 className="mt-3 font-display text-3xl font-bold uppercase leading-tight group-hover:text-zw-red-600">
                {text(lead.title)}
              </h2>
              <p className="mt-3 text-zw-grey-600">{text(lead.summary)}</p>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold uppercase text-zw-red-600">
                {t.news.readMore}
                <ArrowRight size={16} />
              </span>
            </div>
          </LocaleLink>
        )}

        {rest.length > 0 && (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((item) => (
              <LocaleLink
                key={item.id}
                href={`/kesfet/haberler/${item.slug}`}
                className="group overflow-hidden rounded-[4px] border border-zw-grey-200"
              >
                <div className="aspect-[16/9] overflow-hidden bg-zw-grey-100">
                  <ProductImage
                    src={item.coverUrl}
                    alt={text(item.title)}
                    label={text(item.category)}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold uppercase tracking-wide text-zw-red-600">
                      {text(item.category)}
                    </span>
                    <span className="text-xs text-zw-grey-400">
                      {formatDate(item.publishedAt, locale)}
                    </span>
                  </div>
                  <h3 className="mt-2 font-display text-xl font-semibold leading-tight group-hover:text-zw-red-600">
                    {text(item.title)}
                  </h3>
                  <p className="mt-2 line-clamp-3 text-sm text-zw-grey-500">
                    {text(item.summary)}
                  </p>
                </div>
              </LocaleLink>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
