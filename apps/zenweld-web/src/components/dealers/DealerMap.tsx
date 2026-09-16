"use client";

import { useEffect, useRef } from "react";
import type { Dealer } from "@zenweld/data";
import "leaflet/dist/leaflet.css";
import { TURKEY_CENTER } from "@/lib/geo";

/**
 * Leaflet + OpenStreetMap haritasi.
 *
 * API anahtari gerektirmez. Leaflet yalnizca tarayicida yuklenir (dinamik
 * import), varsayilan isaretci gorselleri yerine SVG divIcon kullanilir —
 * boylece bundler'da kirik ikon sorunu olusmaz.
 */
export function DealerMap({
  dealers,
  selectedId,
  onSelect,
  userPosition,
  className = "",
}: {
  dealers: Dealer[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  userPosition?: { lat: number; lng: number } | null;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const layerRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const LRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current || mapRef.current) return;
      LRef.current = L;

      const map = L.map(containerRef.current, {
        center: [TURKEY_CENTER.lat, TURKEY_CENTER.lng],
        zoom: 5,
        scrollWheelZoom: false,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map);

      layerRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;
      // Ilk cizim
      draw();
    })();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function draw() {
    const L = LRef.current;
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!L || !map || !layer) return;

    layer.clearLayers();

    const pin = (color: string, active: boolean) =>
      L.divIcon({
        className: "",
        html: `<div style="transform:translate(-50%,-100%);">
          <svg width="${active ? 34 : 28}" height="${active ? 46 : 38}" viewBox="0 0 24 32">
            <path d="M12 0C5.4 0 0 5.4 0 12c0 8.4 12 20 12 20s12-11.6 12-20c0-6.6-5.4-12-12-12z" fill="${color}"/>
            <circle cx="12" cy="12" r="4.5" fill="#fff"/>
          </svg>
        </div>`,
        iconSize: [0, 0],
      });

    const bounds: [number, number][] = [];

    dealers.forEach((d) => {
      const active = d.id === selectedId;
      const marker = L.marker([d.lat, d.lng], {
        icon: pin(active ? "#141619" : "#d62027", active),
        zIndexOffset: active ? 1000 : 0,
      });
      marker.bindTooltip(`<strong>${d.name}</strong><br/>${d.district} / ${d.city}`, {
        direction: "top",
        offset: [0, -34],
      });
      marker.on("click", () => onSelect?.(d.id));
      marker.addTo(layer);
      bounds.push([d.lat, d.lng]);
    });

    if (userPosition) {
      L.circleMarker([userPosition.lat, userPosition.lng], {
        radius: 8,
        color: "#1d4ed8",
        fillColor: "#3b82f6",
        fillOpacity: 0.9,
        weight: 3,
      })
        .bindTooltip("Konumunuz", { direction: "top" })
        .addTo(layer);
      bounds.push([userPosition.lat, userPosition.lng]);
    }

    if (bounds.length > 1) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 11 });
    } else if (bounds.length === 1) {
      map.setView(bounds[0], 11);
    }
  }

  useEffect(() => {
    draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dealers, selectedId, userPosition]);

  useEffect(() => {
    if (!selectedId || !mapRef.current) return;
    const dealer = dealers.find((d) => d.id === selectedId);
    if (dealer) mapRef.current.setView([dealer.lat, dealer.lng], 12, { animate: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  return <div ref={containerRef} className={className} />;
}
