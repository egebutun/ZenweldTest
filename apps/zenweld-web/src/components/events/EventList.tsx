"use client";

import { useMemo, useState } from "react";
import { CalendarDays } from "lucide-react";
import type { EventCategory } from "@zenweld/data";
import { useDatabase } from "@zenweld/store";
import { Button, EmptyState, Select } from "@zenweld/ui";
import { EventCard } from "./EventCard";
import { useLocale, useT } from "@/lib/i18n-client";

/**
 * Etkinlik listesi.
 *
 * Yaklasan ve gecmis etkinlikler ayri bolumlerde gosterilir; yaklasanlar
 * en yakin tarih once, gecmisler en yeni once siralanir. Filtreler: yil,
 * sehir, tur ve siralama yonu.
 */
export function EventList() {
  const t = useT();
  const locale = useLocale();
  const db = useDatabase();

  const [year, setYear] = useState("");
  const [city, setCity] = useState("");
  const [type, setType] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");

  const all = useMemo(() => db.events.filter((e) => e.active), [db]);

  const years = useMemo(
    () =>
      Array.from(new Set(all.map((e) => new Date(e.startDate).getFullYear())))
        .sort((a, b) => b - a)
        .map(String),
    [all],
  );

  const cities = useMemo(
    () => Array.from(new Set(all.map((e) => e.city))).sort((a, b) => a.localeCompare(b, "tr")),
    [all],
  );

  const typeLabel: Record<EventCategory, string> = {
    fuar: t.events.typeFuar,
    sponsorluk: t.events.typeSponsorluk,
    egitim: t.events.typeEgitim,
    etkinlik: t.events.typeEtkinlik,
  };

  const filtered = useMemo(() => {
    return all.filter((e) => {
      if (year && String(new Date(e.startDate).getFullYear()) !== year) return false;
      if (city && e.city !== city) return false;
      if (type && e.category !== type) return false;
      return true;
    });
  }, [all, year, city, type]);

  const { upcoming, past } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const up = filtered
      .filter((e) => new Date(e.endDate) >= today)
      .sort((a, b) => a.startDate.localeCompare(b.startDate)); // en yakın önce

    const pa = filtered
      .filter((e) => new Date(e.endDate) < today)
      .sort((a, b) =>
        sort === "newest"
          ? b.startDate.localeCompare(a.startDate)
          : a.startDate.localeCompare(b.startDate),
      );

    return { upcoming: up, past: pa };
  }, [filtered, sort]);

  const hasFilter = Boolean(year || city || type);

  return (
    <div className="zw-container py-10">
      <h1 className="font-display text-4xl font-bold uppercase sm:text-5xl">
        {t.events.title}
      </h1>
      <p className="mt-3 max-w-3xl text-zw-grey-600">{t.events.subtitle}</p>

      {/* Filtreler */}
      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zw-grey-600">
            {t.events.year}
          </label>
          <Select value={year} onChange={(e) => setYear(e.target.value)}>
            <option value="">{t.events.allYears}</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zw-grey-600">
            {t.events.city}
          </label>
          <Select value={city} onChange={(e) => setCity(e.target.value)}>
            <option value="">{t.events.allCities}</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zw-grey-600">
            {t.events.type}
          </label>
          <Select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">{t.events.allTypes}</option>
            {(Object.keys(typeLabel) as EventCategory[]).map((k) => (
              <option key={k} value={k}>
                {typeLabel[k]}
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
          {t.events.count.replace("{count}", String(filtered.length))}
        </span>
        {hasFilter && (
          <button
            onClick={() => {
              setYear("");
              setCity("");
              setType("");
            }}
            className="text-sm font-semibold uppercase text-zw-red-600 hover:underline"
          >
            {t.events.clear}
          </button>
        )}
      </div>

      {filtered.length === 0 && (
        <div className="mt-10">
          <EmptyState
            icon={<CalendarDays size={40} />}
            title={t.events.empty}
            action={
              hasFilter ? (
                <Button
                  onClick={() => {
                    setYear("");
                    setCity("");
                    setType("");
                  }}
                >
                  {t.events.clear}
                </Button>
              ) : undefined
            }
          />
        </div>
      )}

      {upcoming.length > 0 && (
        <Section title={t.events.upcoming}>
          <Grid>
            {upcoming.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </Grid>
        </Section>
      )}

      {past.length > 0 && (
        <Section title={t.events.past}>
          <Grid>
            {past.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </Grid>
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-12">
      <div className="mb-6 flex items-center gap-4">
        <h2 className="shrink-0 font-display text-xl font-bold text-zw-ink">{title}</h2>
        <span className="h-px flex-1 bg-zw-grey-200" />
      </div>
      {children}
    </section>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{children}</div>
  );
}
