"use client";

import { useEffect, useRef, useState } from "react";
import { videoCoverFits, youtubeCovers } from "@zenweld/data";

/**
 * VIDEO KAPAGI (KARARLAR K-125; docs/IS-KURALLARI.md › 27)
 *
 * Panelde kapak secilmisse o gorsel; yoksa YouTube'un kapak resimleri en
 * iyiden baslayarak denenir (Shorts'un dik kapagi, yuksek cozunurluk,
 * her videoda bulunan): YouTube olmayan boyut icin kucuk gri bir resim
 * dondurur, o zaman siradakine gecilir. Ekrana gelince yuklenir. Resim
 * sayfa etkinlesmeden once yuklenmis ya da hata vermisse (tarayici o
 * olaylari kacirir) sonuc etkinlesince yeniden denetlenir.
 */
export function VideoCover({ youtubeId, cover, className = "" }: { youtubeId: string; cover?: string; className?: string }) {
  const candidates = cover ? [cover] : youtubeCovers(youtubeId);
  const [index, setIndex] = useState(0);
  const src = candidates[Math.min(index, candidates.length - 1)];
  const next = () => setIndex((i) => (i < candidates.length - 1 ? i + 1 : i));
  const img = useRef<HTMLImageElement>(null);
  const check = (el: HTMLImageElement) => {
    if (cover) return;
    if (el.naturalWidth === 0 || !videoCoverFits(src, el.naturalWidth, el.naturalHeight)) next();
  };

  useEffect(() => {
    const el = img.current;
    if (el?.complete) check(el);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- yalnizca resim degisince
  }, [src]);

  return (
    // eslint-disable-next-line @next/next/no-img-element -- dis adresten (YouTube) gelen kapak; boyut denetimi icin duz img
    <img
      key={src}
      src={src}
      alt=""
      loading="lazy"
      decoding="async"
      ref={img}
      onError={cover ? undefined : next}
      onLoad={(e) => check(e.currentTarget)}
      className={className}
    />
  );
}
