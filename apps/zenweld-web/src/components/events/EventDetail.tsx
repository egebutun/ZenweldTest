"use client";

import { useMemo } from "react";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, ExternalLink, MapPin } from "lucide-react";
import { useDatabase } from "@zenweld/store";
import { LocaleLink } from "@/components/common/LocaleLink";
import { ProductImage } from "@/components/common/ProductImage";
import { logoAlternates } from "@/lib/event-logo";
import { RichText } from "./RichText";
import { useLocale, useT, useText } from "@/lib/i18n-client";
import { formatDate } from "@/lib/format";
import { countryName } from "@/lib/country";

export function EventDetail({ slug }: { slug: string }) {
  const t = useT();
  const locale = useLocale();
  const text = useText();
  const db = useDatabase();

  const event = useMemo(() => db.events.find((e) => e.slug === slug), [db, slug]);

  if (!event) notFound();

  return (
    <>
      <div className="border-b border-zw-grey-200 bg-zw-grey-50">
        <div className="zw-container py-10">
          <LocaleLink
            href="/kesfet/etkinlikler"
            className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-zw-grey-600 hover:text-zw-red-600"
          >
            <ArrowLeft size={16} />
            {t.events.backToList}
          </LocaleLink>

          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-2xl">
              <h1 className="font-display text-4xl font-bold uppercase leading-tight sm:text-5xl">
                {event.title}
              </h1>
              <p className="mt-3 text-zw-grey-600">{text(event.summary)}</p>
            </div>
            <ProductImage
              src={event.logoUrl}
              alternates={logoAlternates(event.logoUrl)}
              alt={event.title}
              label={event.title}
              className="max-h-20 max-w-[240px] object-contain"
            />
          </div>
        </div>
      </div>

      <div className="zw-container py-10">
        <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
          <div>
            <RichText source={text(event.description)} className="max-w-3xl" />

            {event.images.length > 0 && (
              <div className="mt-10">
                <h2 className="mb-4 font-display text-2xl font-bold uppercase">
                  {t.events.gallery}
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {event.images.map((img, i) => (
                    <div
                      key={i}
                      className="aspect-[4/3] overflow-hidden rounded-[4px] bg-zw-grey-100"
                    >
                      <ProductImage
                        src={img}
                        alt={`${event.title} — ${i + 1}`}
                        label={event.title}
                        className="h-full w-full object-cover"
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
                  {formatDate(event.startDate, locale)} — {formatDate(event.endDate, locale)}
                </dd>
              </div>
              <div>
                <dt className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-zw-grey-500">
                  <MapPin size={14} />
                  {t.events.venue}
                </dt>
                <dd className="mt-1 font-semibold">{text(event.venue)}</dd>
                <dd className="text-zw-grey-500">
                  {event.city} · {countryName(event.country, locale)}
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
