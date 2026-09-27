"use client";

import { useEffect, useRef, useState } from "react";
import type { Product, RetailerStock } from "@zenweld/data";
import { ShopProductCard } from "./ShopProductCard";

/**
 * KENDILIGINDEN KAYAN URUN SERIDI (magaza)
 *
 * Ana sitedeki serdin aynisi: Hot Sale ve Yeni Gelenler bolumleri 4x2
 * izgara yerine yana dogru yavasca kayan bir seritte gosterilir.
 *
 * Nasil calisir: liste iki kez basilir ve kapsayici her karede birkac
 * pikselin onda biri kadar kaydirilir. Ilk kopyanin sonuna gelindiginde
 * kaydirma basa alinir; ziyaretci gecisi fark etmez.
 *
 * - Fareyle uzerine gelince durur.
 * - Parmakla/fareyle elle de kaydirilabilir.
 * - "Hareketi azalt" secili isletim sistemlerinde hic kaymaz.
 */
export function ShopProductMarquee({
  items,
  /** Saniyede kac piksel kaysin. */
  speed = 24,
}: {
  items: { product: Product; stock?: RetailerStock }[];
  speed?: number;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  /**
   * Urunler ekrani doldurmuyorsa serit kaydirilmaz ve liste iki kez
   * BASILMAZ: az sayida urunde ikinci kopya yan yana gelip ayni urun
   * iki kere gorunuyordu. Magazanin stogu ana siteden dar oldugu icin
   * bu durum burada siklikla olusuyor.
   */
  const [scrolls, setScrolls] = useState(false);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const decide = () => setScrolls(items.length * 266 > track.clientWidth + 16);
    decide();
    window.addEventListener("resize", decide);
    return () => window.removeEventListener("resize", decide);
  }, [items.length]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || !scrolls || items.length === 0) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    let last = performance.now();
    // Kesirli sayac: tarayici scrollLeft'i tam sayiya yuvarladigi icin
    // karedeki 0.4 pikseli dogrudan yazarsak serit hic ilerlemez.
    let offset = track.scrollLeft;

    const step = (now: number) => {
      const delta = Math.min((now - last) / 1000, 0.05);
      last = now;

      if (!paused) {
        offset += speed * delta;
        const half = track.scrollWidth / 2;
        if (half > 0 && offset >= half) offset -= half;
        track.scrollLeft = offset;
      } else {
        offset = track.scrollLeft;
      }

      frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [paused, speed, scrolls, items.length]);

  if (items.length === 0) return null;

  // Kesintisiz donus icin liste iki kez basilir — yalnizca kaydigi zaman.
  const loop = scrolls ? [...items, ...items] : items;

  return (
    <div
      ref={trackRef}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
      // scroll-smooth KULLANILMAZ: her karedeki kucuk kaydirmayi
      // animasyona cevirip seridi yerinde kilitler.
      className="zw-no-scrollbar flex gap-4 overflow-x-auto pb-1"
      style={{ scrollbarWidth: "none" }}
    >
      {loop.map(({ product, stock }, i) => (
        <div key={`${product.id}-${i}`} className="w-[230px] shrink-0 sm:w-[250px]">
          <ShopProductCard product={product} stock={stock} compact />
        </div>
      ))}
    </div>
  );
}
