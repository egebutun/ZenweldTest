"use client";

import { useMemo } from "react";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, ExternalLink, MapPin, Store } from "lucide-react";
import { useDatabase } from "@zenweld/store";
import { Badge } from "@zenweld/ui";
import { LocaleLink } from "@/components/common/LocaleLink";
import { ProductImage } from "@/components/common/ProductImage";
import { EventCard } from "./EventCard";
import { useLocale, useT, useText } from "@/lib/i18n-client";
import { formatDate } from "@/lib/format";

export function EventDetail({ slug }: { slug: string }) {
  const t = useT();
  const locale = useLocale();
  const text = useText();
  const db = useDatabase();

  const event = useMemo(() => db.events.find((e) => e.slug === slug), [db, slug]);

  const others = useMemo(
    () => db.events.filter((e) => e.active && e.slug !== slug).slice(0, 3),
    [db, slug],
  );

  if (!event) notFound();

  const typeLabel = {
    fuar: t.events.typeFuar,
    sponsorluk: t.events.typeSponsorluk,
    egitim: t.events.typeEgitim,
    etkinlik: t.events.typeEtkinlik,
  }[event.category];

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
              <Badge tone="grey">{typeLabel}</Badge>
              <h1 className="mt-3 font-display text-4xl font-bold uppercase leading-tight sm:text-5xl">
                {text(event.title)}
              </h1>
              <p className="mt-3 text-zw-grey-600">{text(event.summary)}</p>
            </div>
            <ProductImage
              src={event.logoUrl}
              alt={text(event.title)}
              label={text(event.title)}
              className="max-h-20 max-w-[240px] object-contain"
            />
          </div>
        </div>
      </div>

      <div className="zw-container py-10">
        <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
          <div>
            <div className="max-w-3xl space-y-4 text-[15px] leading-relaxed text-zw-grey-700">
              {text(event.description)
                .split("\n")
                .filter(Boolean)
                .map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
            </div>

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
                        alt={`${text(event.title)} — ${i + 1}`}
                        label={text(event.title)}
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
                  {event.city} · {event.country}
                </dd>
              </div>
              {event.booth && (
                <div>
                  <dt className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-zw-grey-500">
                    <Store size={14} />
                    {t.events.booth}
                  </dt>
                  <dd className="mt-1 font-semibold">{event.booth}</dd>
                </div>
              )}
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

        {others.length > 0 && (
          <div className="mt-14">
            <h2 className="mb-6 font-display text-2xl font-bold uppercase">
              {t.events.title}
            </h2>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {others.map((e) => (
                <EventCard key={e.id} event={e} />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
