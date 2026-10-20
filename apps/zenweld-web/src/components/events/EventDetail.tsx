"use client";

import { useMemo } from "react";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, ExternalLink, MapPin } from "lucide-react";
import { findEventBySlug, findMovedEvent, useDatabase } from "@zenweld/store";
import Link from "next/link";
import { ProductImage, RichText } from "@zenweld/ui";
import { EventLogo } from "./EventLogo";
import { useT } from "@/lib/i18n-client";
import { formatDate } from "@zenweld/utils";
import { eventSeo } from "@/lib/seo";
import { useMovedRedirect, useSeoTitle } from "@/lib/page-seo-client";

export function EventDetail({ slug }: { slug: string }) {
  const t = useT();
  const db = useDatabase();

  const event = useMemo(() => findEventBySlug(slug, db), [db, slug]);
  const moved = useMemo(() => (event ? undefined : findMovedEvent(slug, db)), [event, slug, db]);
  useMovedRedirect(moved && `/etkinlikler/${moved.slug}`);
  useSeoTitle(event && eventSeo(event).title);

  if (!event) {
    if (moved) return null;
    notFound();
  }

  return (
    <>
      <div className="border-b border-zw-grey-200 bg-zw-grey-50">
        <div className="zw-container py-10">
          <Link
            href="/etkinlikler"
            className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-zw-grey-600 hover:text-zw-red-600"
          >
            <ArrowLeft size={16} />
            {t.events.backToList}
          </Link>

          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-2xl">
              {/* Ozel isim: CSS uppercase Turkce yerelde i harfini İ'ye cevirdigi
                  icin (RIYADH -> RİYADH) baslik oldugu gibi gosterilir. */}
              <h1 className="font-display text-4xl font-bold leading-tight sm:text-5xl">
                {event.title}
              </h1>
              <p className="mt-3 text-zw-grey-600">{event.summary}</p>
            </div>
            {/* Kutu logonun etrafini sarar (fit="hug"): yanlarda artik
                bos beyaz alan kalmiyor. Yukseklik sabit oldugu icin butun
                etkinliklerde ayni cizgide duruyor. */}
            <EventLogo
              src={event.logoUrl}
              title={event.title}
              maxWidth={320}
              maxHeight={120}
              targetArea={20_000}
              fit="hug"
              className="rounded-[4px] border border-zw-grey-200 bg-white"
            />
          </div>
        </div>
      </div>

      <div className="zw-container py-10">
        <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
          <div>
            <RichText source={event.description} className="max-w-3xl" />

            {event.images.length > 0 && (
              <div className="mt-10">
                <h2 className="mb-4 font-display text-2xl font-bold uppercase">
                  {t.events.gallery}
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {event.images.map((img, i) => (
                    <div
                      key={i}
                      className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-[4px] bg-zw-grey-100"
                    >
                      <ProductImage
                        src={img}
                        alt={`${event.title} — ${i + 1}`}
                        label={event.title}
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <aside className="h-fit rounded-[4px] border border-zw-grey-200 p-5">
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-zw-grey-500">
                  <CalendarDays size={14} />
                  {t.events.dates}
                </dt>
                <dd className="mt-1 font-semibold">
                  {formatDate(event.startDate)} — {formatDate(event.endDate)}
                </dd>
              </div>
              <div>
                <dt className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-zw-grey-500">
                  <MapPin size={14} />
                  {t.events.venue}
                </dt>
                <dd className="mt-1 font-semibold">{event.venue}</dd>
                <dd className="text-zw-grey-500">
                  {event.city} · {event.country}
                </dd>
              </div>
              {event.websiteUrl && (
                <a
                  href={event.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 font-semibold text-zw-red-600 hover:underline"
                >
                  <ExternalLink size={15} />
                  {t.events.website}
                </a>
              )}
            </dl>
          </aside>
        </div>
      </div>
    </>
  );
}
