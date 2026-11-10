"use client";

import { useEffect, useRef, useState } from "react";
import type { HomeHeroSettings } from "@zenweld/data";
import { HomeHero } from "@/components/home/HomeHero";
import { HERO_PREVIEW } from "@/lib/hero-preview";

/**
 * PANEL › ANASAYFA TANITIM › ONIZLEME
 *
 * Panel bu sayfayi kendi icinde, masaustu ya da telefon genisligindeki bir
 * cercevede acar (next.config: bu adres yalnizca ayni sitenin icinde
 * cerceveye girebilir). Kaydedilmemis taslak panelden mesajla gelir;
 * yalnizca ayni siteden ve cerceveyi acan pencereden gelen mesaj okunur.
 * Sayfa hicbir kayit okumaz ve yazmaz.
 */
export default function HeroPreviewPage() {
  const [view, setView] = useState<{ hero: HomeHeroSettings; active: number } | null>(null);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== window.parent) return;
      const data = e.data as { type?: string; hero?: HomeHeroSettings; active?: number };
      if (data?.type !== HERO_PREVIEW.draft || !data.hero || !Array.isArray(data.hero.slides)) return;
      setView({ hero: data.hero, active: typeof data.active === "number" ? data.active : 0 });
    };
    window.addEventListener("message", onMessage);
    window.parent.postMessage({ type: HERO_PREVIEW.ready }, window.location.origin);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  // Tanitim alaninin yuksekligi panele bildirilir (cerceve ona gore kirpilir).
  const shown = view !== null;
  useEffect(() => {
    const el = box.current;
    if (!el || !shown) return;
    const report = () => window.parent.postMessage({ type: HERO_PREVIEW.size, height: el.offsetHeight }, window.location.origin);
    const observer = new ResizeObserver(report);
    observer.observe(el);
    report();
    return () => observer.disconnect();
  }, [shown]);

  return (
    <div ref={box}>
      {view && (
        <HomeHero
          key={view.active}
          slides={view.hero.slides}
          intervalSeconds={view.hero.intervalSeconds}
          startAt={view.active}
          autoplay={false}
        />
      )}
    </div>
  );
}
