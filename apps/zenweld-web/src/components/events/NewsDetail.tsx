"use client";

import { useMemo } from "react";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useDatabase } from "@zenweld/store";
import { Badge } from "@zenweld/ui";
import { LocaleLink } from "@/components/common/LocaleLink";
import { ProductImage } from "@/components/common/ProductImage";
import { RichText } from "./RichText";
import { useLocale, useT, useText } from "@/lib/i18n-client";
import { formatDate } from "@/lib/format";

export function NewsDetail({ slug }: { slug: string }) {
  const t = useT();
  const locale = useLocale();
  const text = useText();
  const db = useDatabase();

  const item = useMemo(() => db.news.find((n) => n.slug === slug), [db, slug]);
  const others = useMemo(
    () => db.news.filter((n) => n.active && n.slug !== slug).slice(0, 3),
    [db, slug],
  );

  if (!item) notFound();

  return (
    <article className="zw-container py-10">
      <LocaleLink
        href="/kesfet/haberler"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-zw-grey-600 hover:text-zw-red-600"
      >
        <ArrowLeft size={16} />
        {t.news.backToList}
      </LocaleLink>

      <div className="max-w-3xl">
        <div className="flex items-center gap-3">
          <Badge tone="red">{text(item.category)}</Badge>
          <span className="text-sm text-zw-grey-500">
            {formatDate(item.publishedAt, locale)}
          </span>
        </div>
        <h1 className="mt-3 font-display text-4xl font-bold uppercase leading-tight sm:text-5xl">
          {text(item.title)}
        </h1>
        <p className="mt-4 text-lg text-zw-grey-600">{text(item.summary)}</p>
      </div>

      <div className="mt-8 aspect-[21/9] max-w-4xl overflow-hidden rounded-[4px] bg-zw-grey-100">
        <ProductImage
          src={item.coverUrl}
          alt={text(item.title)}
          label={text(item.category)}
          className="h-full w-full object-cover"
        />
      </div>

      <RichText source={text(item.body)} className="mt-8 max-w-3xl" />

      {others.length > 0 && (
        <div className="mt-14">
          <h2 className="mb-6 font-display text-2xl font-bold uppercase">{t.news.related}</h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {others.map((n) => (
              <LocaleLink
                key={n.id}
                href={`/kesfet/haberler/${n.slug}`}
                className="group overflow-hidden rounded-[4px] border border-zw-grey-200"
              >
                <div className="aspect-[16/9] overflow-hidden bg-zw-grey-100">
                  <ProductImage
                    src={n.coverUrl}
                    alt={text(n.title)}
                    label={text(n.category)}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-display text-lg font-semibold leading-tight group-hover:text-zw-red-600">
                    {text(n.title)}
                  </h3>
                </div>
              </LocaleLink>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
