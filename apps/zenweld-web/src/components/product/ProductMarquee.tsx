"use client";

import { useEffect, useRef, useState } from "react";
import type { Product } from "@zenweld/data";
import { ProductCard } from "./ProductCard";

/**
 * KENDILIGINDEN KAYAN URUN SERIDI
 *
 * Anasayfadaki Hot Sale ve Yeni Gelenler bolumleri icin. Urunler 4x2
 * izgara yerine yana dogru yavasca kayan bir seritte gosterilir.
 *
 * Nasil calisir: liste iki kez basilir ve kapsayici her karede birkac
 * pikselin onda biri kadar kaydirilir. Ilk kopyanin sonuna gelindiginde
 * kaydirma basa alinir; kullanici kopyalar arasindaki geciszi fark etmez,
 * serit sonsuz donuyormus gibi gorunur.
 *
 * - Fareyle uzerine gelince durur, ziyaretci kartlari okuyabilir.
 * - Parmakla/fareyle elle de kaydirilabilir; birakildiginda devam eder.
 * - Isletim sisteminde "hareketi azalt" secili ise hic kaymaz.
 */
/** Seritteki en az kart sayisi (genis ekrani doldursun diye). */
const MIN_ITEMS = 8;

export function ProductMarquee({
  products,
  /** Saniyede kac piksel kaysin. */
  speed = 24,
}: {
  products: Product[];
  speed?: number;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || products.length === 0) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    let frame = 0;
    let last = performance.now();
    // Kendi kesirli sayacimizi tutuyoruz: tarayici scrollLeft'i tam sayiya
    // yuvarladigi icin karedeki 0.4 pikseli dogrudan yazarsak kayboluyor
    // ve serit hic ilerlemiyor.
    let offset = track.scrollLeft;
    // Seridin yarisi (ikinci kopyanin basi) yalnizca boyut degisince olculur;
    // her karede olcmek tarayiciyi sayfayi yeniden duzenlemeye zorluyordu
    // (docs/YAPILACAKLAR.md › Ölçüm (hız) 7).
    let half = track.scrollWidth / 2;
    const resize = new ResizeObserver(() => {
      half = track.scrollWidth / 2;
    });
    resize.observe(track);

    const step = (now: number) => {
      const delta = Math.min((now - last) / 1000, 0.05); // sekme arka plandaysa sicrama olmasin
      last = now;

      if (!paused) {
        offset += speed * delta;
        // Ikinci kopyanin basina gelindiyse basa sar; goz gecisi fark etmez.
        if (half > 0 && offset >= half) offset -= half;
        track.scrollLeft = offset;
      } else {
        // Elle kaydirildiysa sayaci gercek konumla esitle.
        offset = track.scrollLeft;
      }

      frame = requestAnimationFrame(step);
    };

    // Serit yalnizca ekrandayken (ya da ekrana yaklasinca) doner; gorunmezken
    // islemciyi yormaz.
    const visibility = new IntersectionObserver(
      ([entry]) => {
        cancelAnimationFrame(frame);
        frame = 0;
        if (entry.isIntersecting) {
          last = performance.now();
          offset = track.scrollLeft;
          frame = requestAnimationFrame(step);
        }
      },
      { rootMargin: "200px 0px" },
    );
    visibility.observe(track);
    return () => {
      cancelAnimationFrame(frame);
      visibility.disconnect();
      resize.disconnect();
    };
  }, [paused, speed, products.length]);

  if (products.length === 0) return null;

  // Kesintisiz donus icin liste iki kez basilir. Urun azsa (ornegin 4)
  // once seridi dolduracak kadar tekrarlanir; yoksa serit sona gelince
  // basa sicrar.
  const base = Array.from({ length: Math.ceil(MIN_ITEMS / products.length) }, () => products).flat();
  const loop = [...base, ...base];

  return (
    <div
      ref={trackRef}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
      // scroll-smooth KULLANILMAZ: her karedeki kucuk kaydirmayi
      // animasyona cevirip seridi yerinde kilitliyor.
      className="zw-no-scrollbar flex gap-4 overflow-x-auto pb-1"
      style={{ scrollbarWidth: "none" }}
    >
      {loop.map((product, i) => (
        <div key={`${product.id}-${i}`} className="w-[230px] shrink-0 sm:w-[250px]">
          <ProductCard product={product} compact />
        </div>
      ))}
    </div>
  );
}
