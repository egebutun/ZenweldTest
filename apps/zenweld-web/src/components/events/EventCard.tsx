"use client";

import { MapPin } from "lucide-react";
import type { ZenweldEvent } from "@zenweld/data";
import { Badge } from "@zenweld/ui";
import { LocaleLink } from "@/components/common/LocaleLink";
import { ProductImage } from "@/components/common/ProductImage";
import { useLocale, useT, useText } from "@/lib/i18n-client";

/** Tarih bloğu: yıl üstte, ay ortada, gün aralığı altta. */
function DateBlock({ event, locale }: { event: ZenweldEvent; locale: "tr" | "en" }) {
  const start = new Date(event.startDate);
  const end = new Date(event.endDate);

  const month = new Intl.DateTimeFormat(locale === "tr" ? "tr-TR" : "en-GB", {
    month: "long",
  }).format(start);

  const sameMonth = start.getMonth() === end.getMonth();
  const days = sameMonth
    ? `${start.getDate()} - ${end.getDate()}`
    : `${start.getDate()}.${start.getMonth() + 1} - ${end.getDate()}.${end.getMonth() + 1}`;

  return (
    <div className="flex h-[92px] w-[120px] shrink-0 flex-col items-center justify-center rounded-[4px] bg-zw-ink px-3 text-white">
      <span className="font-display text-lg font-bold leading-none">
        {start.getFullYear()}
      </span>
      <span className="mt-0.5 text-[13px] capitalize leading-none text-zw-grey-300">
        {month}
      </span>
      <span className="mt-1.5 font-display text-xl font-bold leading-none">{days}</span>
    </div>
  );
}

export function EventCard({ event }: { event: ZenweldEvent }) {
  const t = useT();
  const locale = useLocale();
  const text = useText();

  const now = new Date();
  const start = new Date(event.startDate);
  const end = new Date(event.endDate);
  const isNow = now >= start && now <= end;
  const daysLeft = Math.ceil((start.getTime() - now.getTime()) / 86_400_000);

  return (
    <div className="flex h-full flex-col rounded-[4px] border border-zw-grey-200 bg-white p-5 transition-shadow hover:shadow-lg">
      {/* Üst şerit: tarih bloğu + etkinlik logosu */}
      <div className="flex items-start justify-between gap-4">
        <DateBlock event={event} locale={locale} />
        <div className="flex h-[92px] flex-1 items-center justify-end">
          <ProductImage
            src={event.logoUrl}
            alt={text(event.title)}
            label={text(event.title)}
            className="max-h-[68px] max-w-[190px] object-contain"
          />
        </div>
      </div>

      {(isNow || (daysLeft > 0 && daysLeft <= 60)) && (
        <div className="mt-4">
          <Badge tone={isNow ? "red" : "green"}>
            {isNow
              ? t.events.happeningNow
              : t.events.daysLeft.replace("{days}", String(daysLeft))}
          </Badge>
        </div>
      )}

      <h3 className="mt-4 font-display text-xl font-semibold leading-tight text-zw-ink">
        {text(event.title)}
      </h3>

      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-zw-grey-600">
        {text(event.summary)}
      </p>

      {/* Alt şerit: Detaylar butonu + konum */}
      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-5">
        <LocaleLink
          href={`/kesfet/etkinlikler/${event.slug}`}
          className="rounded-[4px] bg-zw-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-zw-red-700"
        >
          {t.events.details}
        </LocaleLink>
        <span className="flex items-center gap-1.5 text-sm text-zw-grey-600">
          <MapPin size={15} className="shrink-0 text-zw-grey-500" />
          {text(event.venue)}
        </span>
      </div>
    </div>
  );
}
