"use client";

import { useMemo } from "react";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { findNewsBySlug, listNews, useDatabase } from "@zenweld/store";
import Link from "next/link";
import { ProductImage, RichText } from "@zenweld/ui";
import { useT } from "@/lib/i18n-client";
import { formatDate } from "@zenweld/utils";

export function NewsDetail({ slug }: { slug: string }) {
  const t = useT();
  const db = useDatabase();

  const item = useMemo(() => findNewsBySlug(slug, db), [db, slug]);
  const others = useMemo(
    () => listNews(db).filter((n) => n.id !== item?.id).slice(0, 3),
    [db, item],
  );
  if (!item) notFound();

  return (
    <article className="zw-container py-10">
      <Link
        href="/haberler"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-zw-grey-600 hover:text-zw-red-600"
      >
        <ArrowLeft size={16} />
        {t.news.backToList}
      </Link>

      <div className="max-w-3xl">
        <div className="flex items-center gap-3">
          <span className="text-sm text-zw-grey-500">
            {formatDate(item.publishedAt)}
          </span>
        </div>
        <h1 className="mt-3 font-display text-4xl font-bold uppercase leading-tight sm:text-5xl">
          {item.title}
        </h1>
        <p className="mt-4 text-lg text-zw-grey-600">{item.summary}</p>
      </div>

      {/* Sabit en-boy orani yok: afis, yatay fotograf, dikey fotograf —
          hepsi kendi oraninda tam gorunur. Onceden 21/9 kutuya object-cover
          ile basiliyordu ve afislerin alt/ust kismi (tarih, telefon, adres)
          kirpiliyordu. */}
      <div className="mt-8 max-w-4xl overflow-hidden rounded-[4px] bg-zw-grey-100">
        <ProductImage
          src={item.coverUrl}
          alt={item.title}
          label={item.title}
          className="h-auto w-full"
        />
      </div>

      <RichText source={item.body} className="mt-8 max-w-3xl" />

      {/* Fotograf galerisi — etkinlik detay sayfasindakiyle ayni duzen. */}
      {item.images.length > 0 && (
        <div className="mt-10 max-w-4xl">
          <h2 className="mb-4 font-display text-2xl font-bold uppercase">
            {t.events.gallery}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {item.images.map((img, i) => (
              <div
                key={i}
                className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-[4px] bg-zw-grey-100"
              >
                <ProductImage
                  src={img}
                  alt={`${item.title} — ${i + 1}`}
                  label={item.title}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {others.length > 0 && (
        <div className="mt-14">
          <h2 className="mb-6 font-display text-2xl font-bold uppercase">{t.news.related}</h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {others.map((n) => (
              <Link
                key={n.id}
                href={`/haberler/${n.slug}`}
                className="group overflow-hidden rounded-[4px] border border-zw-grey-200"
              >
                <div className="flex aspect-[16/9] items-center justify-center overflow-hidden bg-zw-grey-100">
                  <ProductImage
                    src={n.coverUrl}
                    alt={n.title}
                    label={n.title}
                    className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-display text-lg font-semibold leading-tight group-hover:text-zw-red-600">
                    {n.title}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
