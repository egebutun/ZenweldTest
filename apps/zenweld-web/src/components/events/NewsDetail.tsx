"use client";

import { useEffect, useMemo } from "react";
import { notFound, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { matchesNewsSlug, newsSlug } from "@zenweld/data";
import { useDatabase } from "@zenweld/store";
import { LocaleLink } from "@/components/common/LocaleLink";
import { ProductImage } from "@/components/common/ProductImage";
import { RichText } from "./RichText";
import { useHref, useLocale, useT, useText } from "@/lib/i18n-client";
import { formatDate } from "@/lib/format";

export function NewsDetail({ slug }: { slug: string }) {
  const t = useT();
  const locale = useLocale();
  const text = useText();
  const db = useDatabase();
  const router = useRouter();
  const href = useHref();

  // Adres parcasi iki dilde farklidir; dil degistirilince gelen "obur
  // dilin" slug'i da kabul edilir, sonra adres kendi diline cevrilir.
  const item = useMemo(() => db.news.find((n) => matchesNewsSlug(n, slug)), [db, slug]);
  const others = useMemo(
    () => db.news.filter((n) => n.active && !matchesNewsSlug(n, slug)).slice(0, 3),
    [db, slug],
  );
  const canonicalSlug = item ? newsSlug(item, locale) : "";

  useEffect(() => {
    if (item && canonicalSlug && canonicalSlug !== slug) {
      router.replace(href(`/haberler/${canonicalSlug}`));
    }
  }, [item, canonicalSlug, slug, router, href]);

  if (!item) notFound();

  return (
    <article className="zw-container py-10">
      <LocaleLink
        href="/haberler"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-zw-grey-600 hover:text-zw-red-600"
      >
        <ArrowLeft size={16} />
        {t.news.backToList}
      </LocaleLink>

      <div className="max-w-3xl">
        <div className="flex items-center gap-3">
          <span className="text-sm text-zw-grey-500">
            {formatDate(item.publishedAt, locale)}
          </span>
        </div>
        <h1 className="mt-3 font-display text-4xl font-bold uppercase leading-tight sm:text-5xl">
          {text(item.title)}
        </h1>
        <p className="mt-4 text-lg text-zw-grey-600">{text(item.summary)}</p>
      </div>

      {/* Sabit en-boy orani yok: afis, yatay fotograf, dikey fotograf —
          hepsi kendi oraninda tam gorunur. Onceden 21/9 kutuya object-cover
          ile basiliyordu ve afislerin alt/ust kismi (tarih, telefon, adres)
          kirpiliyordu. */}
      <div className="mt-8 max-w-4xl overflow-hidden rounded-[4px] bg-zw-grey-100">
        <ProductImage
          src={item.coverUrl}
          alt={text(item.title)}
          label={text(item.title)}
          className="h-auto w-full"
        />
      </div>

      <RichText source={text(item.body)} className="mt-8 max-w-3xl" />

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
                  alt={`${text(item.title)} — ${i + 1}`}
                  label={text(item.title)}
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
              <LocaleLink
                key={n.id}
                href={`/haberler/${newsSlug(n, locale)}`}
                className="group overflow-hidden rounded-[4px] border border-zw-grey-200"
              >
                <div className="flex aspect-[16/9] items-center justify-center overflow-hidden bg-zw-grey-100">
                  <ProductImage
                    src={n.coverUrl}
                    alt={text(n.title)}
                    label={text(n.title)}
                    className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
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
