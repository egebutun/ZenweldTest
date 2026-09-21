"use client";

import { useMemo, useState } from "react";
import { CalendarDays } from "lucide-react";
import { useDatabase } from "@zenweld/store";
import { Button, EmptyState, Select } from "@zenweld/ui";
import { EventCard } from "./EventCard";
import { useLocale, useT } from "@/lib/i18n-client";
import { countryName } from "@/lib/country";

type StatusFilter = "" | "upcoming" | "past";

/**
 * Etkinlik listesi.
 *
 * Tum etkinlikler tek bir izgarada listelenir; yaklasan/gecmis ayrimi
 * baslik yerine filtre olarak sunulur. Varsayilan siralama tarihe gore
 * yeniden eskiye dogrudur.
 */
export function EventList() {
  const t = useT();
  const locale = useLocale();
  const db = useDatabase();

  const [status, setStatus] = useState<StatusFilter>("");
  const [country, setCountry] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");

  const all = useMemo(() => db.events.filter((e) => e.active), [db]);

  const countries = useMemo(
    () =>
      Array.from(new Set(all.map((e) => e.country))).sort((a, b) =>
        countryName(a, locale).localeCompare(countryName(b, locale), locale),
      ),
    [all, locale],
  );

  const events = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return all
      .filter((e) => {
        if (country && e.country !== country) return false;
        if (status === "upcoming") return new Date(e.endDate) >= today;
        if (status === "past") return new Date(e.endDate) < today;
        return true;
      })
      .sort((a, b) =>
        sort === "newest"
          ? b.startDate.localeCompare(a.startDate)
          : a.startDate.localeCompare(b.startDate),
      );
  }, [all, country, status, sort]);

  const hasFilter = Boolean(status || country);
  const clearFilters = () => {
    setStatus("");
    setCountry("");
  };

  return (
    <div className="zw-container py-10">
      <h1 className="font-display text-4xl font-bold uppercase sm:text-5xl">
        {t.events.title}
      </h1>
      <p className="mt-3 max-w-3xl text-zw-grey-600">{t.events.subtitle}</p>

      {/* Filtreler */}
      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zw-grey-600">
            {t.events.status}
          </label>
          <Select value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)}>
            <option value="">{t.events.allStatus}</option>
            <option value="upcoming">{t.events.upcoming}</option>
            <option value="past">{t.events.past}</option>
          </Select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zw-grey-600">
            {t.events.country}
          </label>
          <Select value={country} onChange={(e) => setCountry(e.target.value)}>
            <option value="">{t.events.allCountries}</option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {countryName(c, locale)}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zw-grey-600">
            {t.events.sort}
          </label>
          <Select value={sort} onChange={(e) => setSort(e.target.value as "newest" | "oldest")}>
            <option value="newest">{t.events.sortNewest}</option>
            <option value="oldest">{t.events.sortOldest}</option>
          </Select>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <span className="rounded-[4px] bg-zw-grey-100 px-3 py-1.5 text-sm text-zw-grey-600">
          {t.events.count.replace("{count}", String(events.length))}
        </span>
        {hasFilter && (
          <button
            onClick={clearFilters}
            className="text-sm font-semibold uppercase text-zw-red-600 hover:underline"
          >
            {t.events.clear}
          </button>
        )}
      </div>

      {events.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            icon={<CalendarDays size={40} />}
            title={status === "upcoming" ? t.events.emptyUpcoming : t.events.empty}
            text={status === "upcoming" ? t.events.emptyUpcomingText : undefined}
            action={hasFilter ? <Button onClick={clearFilters}>{t.events.clear}</Button> : undefined}
          />
        </div>
      ) : (
        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {events.map((e) => (
            <EventCard key={e.id} event={e} />
          ))}
        </div>
      )}
    </div>
  );
}
