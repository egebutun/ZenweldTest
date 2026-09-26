"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  Building2,
  Clock,
  ExternalLink,
  LocateFixed,
  MapPin,
  MessageCircle,
  Phone,
  Wrench,
} from "lucide-react";
import type { Dealer } from "@zenweld/data";
import { dealersWithProduct, listDealers, useDatabase } from "@zenweld/store";
import { Badge, Button, Checkbox, Select, Skeleton } from "@zenweld/ui";
import { useLocale, useT, useText } from "@/lib/i18n-client";
import { CITY_CENTERS, haversineKm } from "@/lib/geo";

const DealerMap = dynamic(() => import("./DealerMap").then((m) => m.DealerMap), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full" />,
});

interface DealerWithDistance extends Dealer {
  distanceKm?: number;
  hasProduct?: boolean;
}

/**
 * Bir noktanin iletisim eylemleri: Ara / WhatsApp / Yol Tarifi.
 *
 * Hem listedeki kartta hem anasayfada haritanin altindaki secili nokta
 * kartinda kullanilir; ayni kodun iki kopyasi durmasin.
 */
function DealerActions({ dealer, t }: { dealer: Dealer; t: ReturnType<typeof useT> }) {
  const stop = (e: React.MouseEvent) => e.stopPropagation();
  const cls =
    "inline-flex items-center gap-1.5 rounded-[3px] border border-zw-grey-300 px-2.5 py-1.5 text-xs font-semibold hover:border-zw-ink";

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <a href={`tel:${dealer.phone.replace(/\s/g, "")}`} onClick={stop} className={cls}>
        <Phone size={13} /> {t.dealers.call}
      </a>
      {dealer.whatsapp && (
        <a
          href={`https://wa.me/${dealer.whatsapp.replace(/\D/g, "")}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={stop}
          className={cls}
        >
          <MessageCircle size={13} /> {t.dealers.whatsapp}
        </a>
      )}
      <a
        href={`https://www.google.com/maps/dir/?api=1&destination=${dealer.lat},${dealer.lng}`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={stop}
        className={cls}
      >
        <ExternalLink size={13} /> {t.dealers.directions}
      </a>
    </div>
  );
}

export function DealerFinder({
  productId,
  productName,
  compact = false,
  /** "home": anasayfada baslik ve liste olmadan yalnizca filtreler + harita. */
  variant = "full",
}: {
  productId?: string;
  productName?: string;
  compact?: boolean;
  variant?: "full" | "home";
}) {
  const t = useT();
  const locale = useLocale();
  const text = useText();
  const db = useDatabase();

  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState(false);
  const [city, setCity] = useState("");
  const [wantSeller, setWantSeller] = useState(false);
  const [wantService, setWantService] = useState(false);
  const [onlyInStock, setOnlyInStock] = useState(Boolean(productId));
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const stockedDealerIds = useMemo(
    () => (productId ? dealersWithProduct(productId, db) : new Set<string>()),
    [productId, db],
  );

  const cities = useMemo(
    () => Array.from(new Set(listDealers(db).map((d) => d.city))).sort((a, b) => a.localeCompare(b, "tr")),
    [db],
  );

  const dealers = useMemo<DealerWithDistance[]>(() => {
    let list: DealerWithDistance[] = listDealers(db).map((d) => ({
      ...d,
      hasProduct: productId ? stockedDealerIds.has(d.id) : undefined,
    }));

    if (productId && onlyInStock) list = list.filter((d) => d.hasProduct);
    if (city) list = list.filter((d) => d.city === city);
    // Iki bagimsiz onay kutusu. Hicbiri secili degilse ya da ikisi de
    // seciliyse butun noktalar listelenir.
    //
    // "Yetkili Satici" isaretlendiginde yetkili servisler disarida kalir:
    // 30 noktanin 30'unda satici rozeti var, dislama olmasa bu secim
    // listeyi hic degistirmezdi. Boylece 20 satici + 10 servis = 30.
    if (wantSeller !== wantService) {
      list = wantService
        ? list.filter((d) => d.badges.includes("yetkili-servis"))
        : list.filter(
            (d) => d.badges.includes("yetkili-satici") && !d.badges.includes("yetkili-servis"),
          );
    }

    const origin = position ?? (city ? CITY_CENTERS[city] : undefined);
    if (origin) {
      list = list
        .map((d) => ({ ...d, distanceKm: haversineKm(origin, { lat: d.lat, lng: d.lng }) }))
        .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
    } else {
      list = list.sort((a, b) => a.city.localeCompare(b.city, "tr"));
    }

    return list;
  }, [db, productId, onlyInStock, city, wantSeller, wantService, position, stockedDealerIds]);

  const selected = dealers.find((d) => d.id === selectedId) ?? null;

  const locate = () => {
    if (!navigator.geolocation) {
      setGeoError(true);
      return;
    }
    setLocating(true);
    setGeoError(false);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setCity("");
        setLocating(false);
      },
      () => {
        setGeoError(true);
        setLocating(false);
      },
      { timeout: 8000 },
    );
  };

  const badgeLabel = (b: Dealer["badges"][number]) =>
    b === "yetkili-servis"
      ? t.dealers.badgeService
      : b === "showroom"
        ? t.dealers.badgeShowroom
        : t.dealers.badgeSeller;

  return (
    <div className={compact ? "" : "zw-container zw-section"}>
      {!compact && (
        <div className="mb-8 max-w-3xl">
          <h1 className="font-display text-4xl font-bold uppercase sm:text-5xl">
            {t.dealers.title}
          </h1>
          <p className="mt-3 text-zw-grey-600">{t.dealers.subtitle}</p>
        </div>
      )}

      {productId && productName && (
        <div className="mb-5 rounded-[4px] border border-zw-grey-200 bg-zw-grey-50 px-4 py-3 text-sm">
          <span className="text-zw-grey-600">
            {locale === "tr" ? "Aranan ürün:" : "Product:"}{" "}
          </span>
          <strong>{productName}</strong>
        </div>
      )}

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zw-grey-600">
            {t.dealers.selectCity}
          </label>
          <Select
            value={city}
            onChange={(e) => {
              setCity(e.target.value);
              setPosition(null);
            }}
          >
            <option value="">{t.dealers.allCities}</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex-1">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zw-grey-600">
            {t.dealers.filterType}
          </span>
          <div className="flex h-11 items-center gap-5">
            <Checkbox
              label={t.dealers.onlySellers}
              checked={wantSeller}
              onChange={(e) => setWantSeller(e.target.checked)}
            />
            <Checkbox
              label={t.dealers.onlyServices}
              checked={wantService}
              onChange={(e) => setWantService(e.target.checked)}
            />
          </div>
        </div>
        <Button
          variant="dark"
          onClick={locate}
          disabled={locating}
          leftIcon={<LocateFixed size={18} />}
        >
          {locating ? t.dealers.locating : t.dealers.useLocation}
        </Button>
      </div>

      {geoError && (
        <p className="mb-4 rounded-[4px] border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
          {t.dealers.locationDenied}
        </p>
      )}

      {productId && (
        <div className="mb-5">
          <Checkbox
            label={t.dealers.onlyInStock}
            checked={onlyInStock}
            onChange={(e) => setOnlyInStock(e.target.checked)}
          />
        </div>
      )}

      {variant === "home" ? (
        <>
          <div className="mb-3 text-sm font-semibold text-zw-grey-600">
            {t.dealers.resultCount.replace("{count}", String(dealers.length))}
          </div>
          <div className="overflow-hidden rounded-[4px] border border-zw-grey-200">
            <DealerMap
              dealers={dealers}
              selectedId={selectedId}
              onSelect={setSelectedId}
              userPosition={position}
              className="h-[380px] w-full lg:h-[440px]"
            />
          </div>

          {/* Haritada bir isaretciye tiklanildiginda noktanin bilgileri ve
              Ara / WhatsApp / Yol Tarifi baglantilari burada acilir.
              Onceden anasayfada yalnizca harita vardi, secilen noktaya
              ulasmanin bir yolu yoktu. */}
          {selected ? (
            <div className="mt-4 rounded-[4px] border border-zw-red-600 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-display text-lg font-semibold leading-tight">
                    {selected.name}
                  </h3>
                  <p className="mt-1 flex items-start gap-1.5 text-sm text-zw-grey-600">
                    <MapPin size={15} className="mt-0.5 shrink-0" />
                    {selected.address}
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-zw-grey-600">
                    <Clock size={15} className="shrink-0" />
                    {text(selected.workingHours)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {selected.badges.map((b) => (
                    <Badge key={b} tone={b === "yetkili-servis" ? "dark" : "grey"}>
                      {b === "yetkili-servis" ? <Wrench size={11} /> : <Building2 size={11} />}
                      {badgeLabel(b)}
                    </Badge>
                  ))}
                </div>
              </div>
              <DealerActions dealer={selected} t={t} />
            </div>
          ) : (
            <p className="mt-4 rounded-[4px] border border-dashed border-zw-grey-300 px-4 py-5 text-center text-sm text-zw-grey-500">
              {t.dealers.selectHint}
            </p>
          )}
        </>
      ) : (
      <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
        <div>
          <div className="mb-3 text-sm font-semibold text-zw-grey-600">
            {t.dealers.resultCount.replace("{count}", String(dealers.length))}
          </div>
          <div className="max-h-[560px] space-y-3 overflow-y-auto pr-1">
            {dealers.map((dealer) => (
              <button
                key={dealer.id}
                onClick={() => setSelectedId(dealer.id)}
                className={`block w-full rounded-[4px] border p-4 text-left transition-colors ${
                  selectedId === dealer.id
                    ? "border-zw-red-600 bg-zw-red-50"
                    : "border-zw-grey-200 bg-white hover:border-zw-grey-400"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-display text-lg font-semibold leading-tight">
                    {dealer.name}
                  </h3>
                  {dealer.distanceKm != null && (
                    <span className="shrink-0 rounded-[3px] bg-zw-ink px-2 py-0.5 text-xs font-bold text-white">
                      {dealer.distanceKm.toFixed(0)} {t.common.km}
                    </span>
                  )}
                </div>

                <p className="mt-1 flex items-start gap-1.5 text-sm text-zw-grey-600">
                  <MapPin size={15} className="mt-0.5 shrink-0" />
                  {dealer.address}
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-zw-grey-600">
                  <Clock size={15} className="shrink-0" />
                  {text(dealer.workingHours)}
                </p>

                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {dealer.badges.map((b) => (
                    <Badge key={b} tone={b === "yetkili-servis" ? "dark" : "grey"}>
                      {b === "yetkili-servis" ? <Wrench size={11} /> : <Building2 size={11} />}
                      {badgeLabel(b)}
                    </Badge>
                  ))}
                  {productId && dealer.hasProduct && (
                    <Badge tone="green">{t.product.inStock}</Badge>
                  )}
                  {dealer.retailerId && (
                    <Badge tone="outline">{t.dealers.hasOnlineStore}</Badge>
                  )}
                </div>

                <DealerActions dealer={dealer} t={t} />
              </button>
            ))}

            {dealers.length === 0 && (
              <p className="rounded-[4px] border border-dashed border-zw-grey-300 px-4 py-10 text-center text-sm text-zw-grey-500">
                {t.common.noResults}
              </p>
            )}
          </div>
        </div>

        <div className="min-h-[420px] overflow-hidden rounded-[4px] border border-zw-grey-200 lg:min-h-[560px]">
          <DealerMap
            dealers={dealers}
            selectedId={selectedId}
            onSelect={setSelectedId}
            userPosition={position}
            className="h-[420px] w-full lg:h-[560px]"
          />
        </div>
      </div>

      )}

      <p className="mt-3 text-xs text-zw-grey-500">{t.dealers.mapHint}</p>
    </div>
  );
}
