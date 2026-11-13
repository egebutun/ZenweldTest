"use client";

import { useMemo, useState } from "react";
import { Clock, MapPin } from "lucide-react";
import { listForceDealers, useDatabase } from "@zenweld/store";
import { DealerActions } from "@/components/dealers/DealerActions";
import { useT } from "@/lib/i18n-client";
import { TURKIYE_ALANI, TURKIYE_ILLERI, TURKIYE_VIEWBOX, turkiyeKonumu } from "@/lib/turkiye-haritasi";

/** Il adlarini karsilastirmak icin: "Hakkâri" ile "Hakkari", "İstanbul" ile "istanbul" ayni il. */
const ilAnahtari = (s: string) => s.trim().toLocaleLowerCase("tr").replace(/â/g, "a");

/**
 * FORCE BAYILERI HARITASI (Force sayfasinin kapanisi; KARARLAR K-115)
 *
 * Panelde "Force Bayi" isaretli ve aktif bayiler Turkiye haritasinda
 * gorunur: bayisi olan iller kirmizi tonla boyanir, her ile bir nokta
 * (bayilerinin ortalama konumunda; birden cok bayi varsa icinde sayisi).
 * Ayni ildeki bayiler birbirine cok yakin oldugu icin tek tek nokta
 * olmaz; ust uste binip dokunulamazlardi. Noktaya dokununca o il secilir
 * (tek bayisi varsa bayi de). Yanda il secimi ve bayi listesi: listedeki
 * bayiye dokununca adresi, calisma saatleri ve Ara / WhatsApp / Yol Tarifi
 * gorunur. Force bayisi yoksa bolum hic gorunmez. Force Bayi etiketi sitenin baska bir yerinde
 * gosterilmez. Kapanis bolumuyle birlikte yumusakca belirir (data-fx).
 */
export function ForceDealerMap() {
  const t = useT();
  const f = t.forcePage;
  const db = useDatabase();
  const [city, setCity] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const dealers = useMemo(
    () =>
      listForceDealers(db).sort(
        (a, b) => a.city.localeCompare(b.city, "tr") || a.name.localeCompare(b.name, "tr"),
      ),
    [db],
  );
  // Il basina bir nokta: bayilerin ortalama konumu.
  const groups = useMemo(() => {
    const byCity = new Map<string, typeof dealers>();
    for (const d of dealers) byCity.set(d.city, [...(byCity.get(d.city) ?? []), d]);
    return [...byCity.entries()].map(([name, list]) => {
      const lat = list.reduce((sum, d) => sum + d.lat, 0) / list.length;
      const lng = list.reduce((sum, d) => sum + d.lng, 0) / list.length;
      return { city: name, dealers: list, ...turkiyeKonumu(lat, lng) };
    });
  }, [dealers]);
  const dealerCities = useMemo(() => new Set(groups.map((g) => ilAnahtari(g.city))), [groups]);

  if (dealers.length === 0) return null;

  const shown = city ? dealers.filter((d) => d.city === city) : dealers;
  const selected = dealers.find((d) => d.id === selectedId) ?? null;
  const cityKey = city ? ilAnahtari(city) : "";

  // Il secilince liste daralir; ilin tek bayisi varsa bilgileri hemen acilir.
  const pickCity = (value: string) => {
    setCity(value);
    const inCity = dealers.filter((d) => d.city === value);
    if (inCity.length === 1) setSelectedId(inCity[0].id);
    else if (value && selected?.city !== value) setSelectedId(null);
  };

  return (
    <div
      id="force-bayileri"
      data-fx="up"
      style={{ "--d": "350ms" } as React.CSSProperties}
      className="mt-14 w-full max-w-6xl scroll-mt-[72px] text-left md:mt-20"
    >
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-b border-white/10 pb-4">
        <div>
          <h3 className="font-display text-3xl font-bold uppercase leading-none md:text-4xl">{f.mapTitle}</h3>
          <p className="mt-2 max-w-xl text-sm text-white/60">{f.ctaText}</p>
        </div>
        <p className="text-sm font-semibold text-white/70">
          {f.mapCount.replace("{count}", String(dealers.length)).replace("{cities}", String(groups.length))}
        </p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* Harita: il sinirlari, bayisi olan iller tonlu; il noktalari dokunulabilir dugme */}
        <div className="flex flex-col justify-center rounded-[6px] border border-white/10 bg-white/[0.03] p-3 sm:p-5">
          <div className="relative" style={{ aspectRatio: `${TURKIYE_ALANI.width} / ${TURKIYE_ALANI.height}` }}>
            <svg viewBox={TURKIYE_VIEWBOX} role="img" aria-label={f.mapLabel} className="absolute inset-0 h-full w-full">
              {TURKIYE_ILLERI.map((il) => {
                const key = ilAnahtari(il.name);
                const has = dealerCities.has(key);
                const active = cityKey === key;
                return (
                  <path
                    key={il.name}
                    d={il.path}
                    fill={active ? "rgb(200 30 40 / 0.75)" : has ? "rgb(200 30 40 / 0.32)" : "rgb(255 255 255 / 0.05)"}
                    stroke="rgb(255 255 255 / 0.22)"
                    strokeWidth={0.7}
                    strokeLinejoin="round"
                  >
                    <title>{il.name}</title>
                  </path>
                );
              })}
            </svg>
            {groups.map((g) => {
              const on = g.city === city;
              const many = g.dealers.length > 1;
              return (
                <button
                  key={g.city}
                  type="button"
                  data-force-city={g.city}
                  onClick={() => pickCity(on ? "" : g.city)}
                  aria-label={f.mapMarker.replace("{city}", g.city).replace("{count}", String(g.dealers.length))}
                  aria-pressed={on}
                  title={g.city}
                  className={`group absolute flex h-4 w-4 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full md:h-5 md:w-5 ${
                    on ? "z-30" : many ? "z-20" : "z-10"
                  } ${city && !on ? "opacity-40" : ""}`}
                  style={{ left: `${g.left}%`, top: `${g.top}%` }}
                >
                  <span
                    className={`flex shrink-0 items-center justify-center rounded-full font-bold leading-none transition-transform group-hover:scale-125 ${
                      many ? "h-3.5 w-3.5 border text-[8px] md:h-[18px] md:w-[18px] md:border-2 md:text-[10px]" : "h-2 w-2 border md:h-2.5 md:w-2.5 md:border-2"
                    } ${on ? "border-zw-red-600 bg-white text-zw-red-600" : "border-white bg-zw-red-600 text-white"}`}
                  >
                    {many && g.dealers.length}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Il secimi, secili bayi ve liste */}
        <div className="flex min-w-0 flex-col gap-4">
          <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-white/55">
            {f.mapCity}
            <select
              value={city}
              onChange={(e) => pickCity(e.target.value)}
              className="mt-2 block h-11 w-full rounded-[4px] border border-white/20 bg-[#15181c] px-3 text-sm font-normal normal-case tracking-normal text-white focus:border-white focus:outline-none"
            >
              <option value="">{f.mapAllCities}</option>
              {groups.map((g) => (
                <option key={g.city} value={g.city}>
                  {g.city} ({g.dealers.length})
                </option>
              ))}
            </select>
          </label>

          {selected ? (
            <div className="rounded-[6px] border border-zw-red-600/60 bg-white/[0.06] p-4" aria-live="polite">
              <p className="font-display text-xl font-bold leading-tight">{selected.name}</p>
              <p className="mt-2 flex items-start gap-2 text-sm text-white/70">
                <MapPin size={15} className="mt-0.5 shrink-0 text-zw-red-500" />
                {selected.address}
              </p>
              {selected.workingHours && (
                <p className="mt-1.5 flex items-center gap-2 text-sm text-white/70">
                  <Clock size={15} className="shrink-0 text-zw-red-500" />
                  {selected.workingHours}
                </p>
              )}
              <DealerActions dealer={selected} dark />
            </div>
          ) : (
            <p className="rounded-[6px] border border-dashed border-white/15 px-4 py-3 text-sm text-white/55">{f.mapHint}</p>
          )}

          <ul className="max-h-[320px] overflow-y-auto overscroll-contain rounded-[6px] border border-white/10 lg:max-h-[300px]">
            {shown.map((d) => {
              const on = d.id === selectedId;
              return (
                <li key={d.id} className="border-b border-white/10 last:border-b-0">
                  <button
                    type="button"
                    data-force-dealer={d.id}
                    onClick={() => setSelectedId(on ? null : d.id)}
                    aria-pressed={on}
                    className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors ${
                      on ? "bg-zw-red-600/25" : "hover:bg-white/[0.06]"
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">{d.name}</span>
                      <span className="block text-xs text-white/50">
                        {d.district} / {d.city}
                      </span>
                    </span>
                    <span aria-hidden="true" className={`h-2 w-2 shrink-0 rounded-full ${on ? "bg-white" : "bg-zw-red-500"}`} />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
