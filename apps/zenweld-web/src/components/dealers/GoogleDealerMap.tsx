"use client";

import { useEffect, useRef } from "react";
import type { Dealer } from "@zenweld/data";
import { TURKEY_CENTER } from "@/lib/geo";

/**
 * GOOGLE HARITALAR — bayi ve servis haritasi
 *
 * Google Maps JavaScript API ile calisir; anahtar Vercel'de
 * NEXT_PUBLIC_GOOGLE_MAPS_API_KEY olarak tanimlanir. Anahtar yoksa,
 * gecersizse ya da Google yuklenemezse DealerMap otomatik olarak
 * OpenStreetMap haritasina doner (onFail).
 *
 * Isaretciler "Advanced Marker" ile cizilir; bunun icin bir Harita
 * Kimligi (Map ID) gerekir: NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID. Tanimli
 * degilse Google'in deneme kimligi (DEMO_MAP_ID) kullanilir.
 */

const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID";
const READY_CALLBACK = "__zwGoogleMapsReady";
const AUTH_FAILURE_EVENT = "zw-google-maps-auth-failure";

// Google'in global nesnesi icin tip paketi eklemiyoruz (bagimlilik olmasin).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

let loading: Promise<Any> | null = null;

/** Google Maps betigini sayfaya bir kez ekler. */
function loadGoogleMaps(apiKey: string): Promise<Any> {
  const w = window as Any;
  if (w.google?.maps?.importLibrary) return Promise.resolve(w.google);
  if (loading) return loading;

  loading = new Promise((resolve, reject) => {
    w[READY_CALLBACK] = () => resolve(w.google);
    // Anahtar gecersiz / alan adi yetkisiz ise Google bu fonksiyonu cagirir.
    w.gm_authFailure = () => window.dispatchEvent(new Event(AUTH_FAILURE_EVENT));

    const lang = document.documentElement.lang === "en" ? "en" : "tr";
    const script = document.createElement("script");
    script.src =
      `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}` +
      `&v=weekly&loading=async&language=${lang}&region=TR&callback=${READY_CALLBACK}`;
    script.async = true;
    script.onerror = () => {
      loading = null;
      reject(new Error("Google Haritalar yüklenemedi"));
    };
    document.head.appendChild(script);
  });
  return loading;
}

export function GoogleDealerMap({
  apiKey,
  dealers,
  selectedId,
  onSelect,
  userPosition,
  onFail,
  className = "",
}: {
  apiKey: string;
  dealers: Dealer[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  userPosition?: { lat: number; lng: number } | null;
  /** Google yuklenemezse cagrilir; ust bilesen yedek haritaya gecer. */
  onFail: () => void;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Any>(null);
  const libsRef = useRef<Any>(null);
  const markersRef = useRef<Any[]>([]);
  // Son degerler: Google betigi gec yuklendiginde ve isaretci tiklamalarinda
  // ilk cizimdeki eski degerler degil, guncel filtre ve secim kullanilsin.
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const stateRef = useRef({ dealers, selectedId, userPosition });
  stateRef.current = { dealers, selectedId, userPosition };

  useEffect(() => {
    let cancelled = false;
    const failed = () => !cancelled && onFail();
    window.addEventListener(AUTH_FAILURE_EVENT, failed);

    (async () => {
      try {
        const google = await loadGoogleMaps(apiKey);
        const { Map } = await google.maps.importLibrary("maps");
        const { AdvancedMarkerElement, PinElement } = await google.maps.importLibrary("marker");
        if (cancelled || !containerRef.current || mapRef.current) return;

        libsRef.current = { google, AdvancedMarkerElement, PinElement };
        mapRef.current = new Map(containerRef.current, {
          center: TURKEY_CENTER,
          zoom: 5,
          mapId: MAP_ID,
          // Sayfa kaydirilirken harita kaymasin (Ctrl / iki parmakla yakinlasir).
          gestureHandling: "cooperative",
          streetViewControl: false,
          mapTypeControl: false,
          clickableIcons: false,
        });
        draw();
      } catch {
        failed();
      }
    })();

    return () => {
      cancelled = true;
      window.removeEventListener(AUTH_FAILURE_EVENT, failed);
      markersRef.current.forEach((m) => (m.map = null));
      markersRef.current = [];
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey]);

  function draw() {
    const map = mapRef.current;
    const libs = libsRef.current;
    if (!map || !libs) return;
    const { google, AdvancedMarkerElement, PinElement } = libs;
    const { dealers, selectedId, userPosition } = stateRef.current;

    markersRef.current.forEach((m) => (m.map = null));
    markersRef.current = [];
    const bounds = new google.maps.LatLngBounds();

    dealers.forEach((d) => {
      const active = d.id === selectedId;
      const pin = new PinElement({
        background: active ? "#141619" : "#b82429",
        borderColor: "#ffffff",
        glyphColor: "#ffffff",
        scale: active ? 1.25 : 1,
      });
      const marker = new AdvancedMarkerElement({
        map,
        position: { lat: d.lat, lng: d.lng },
        title: `${d.name} — ${d.district} / ${d.city}`,
        content: pin.element ?? pin,
        zIndex: active ? 1000 : 0,
      });
      marker.addListener("click", () => onSelectRef.current?.(d.id));
      markersRef.current.push(marker);
      bounds.extend({ lat: d.lat, lng: d.lng });
    });

    if (userPosition) {
      const dot = document.createElement("div");
      dot.style.cssText =
        "width:16px;height:16px;border-radius:50%;background:#3b82f6;border:3px solid #1d4ed8;box-shadow:0 0 0 4px rgba(59,130,246,.25)";
      markersRef.current.push(
        new AdvancedMarkerElement({ map, position: userPosition, title: "Konumunuz", content: dot }),
      );
      bounds.extend(userPosition);
    }

    const count = dealers.length + (userPosition ? 1 : 0);
    if (count > 1) {
      map.fitBounds(bounds, 40);
      // Tek sehirde birkac bayi varsa fazla yakinlasmasin.
      google.maps.event.addListenerOnce(map, "idle", () => {
        if (map.getZoom() > 11) map.setZoom(11);
      });
    } else if (count === 1) {
      map.setCenter(bounds.getCenter());
      map.setZoom(11);
    }
  }

  useEffect(() => {
    draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dealers, selectedId, userPosition]);

  useEffect(() => {
    const map = mapRef.current;
    const dealer = dealers.find((d) => d.id === selectedId);
    if (!map || !dealer) return;
    map.panTo({ lat: dealer.lat, lng: dealer.lng });
    map.setZoom(12);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  return <div ref={containerRef} className={className} />;
}
