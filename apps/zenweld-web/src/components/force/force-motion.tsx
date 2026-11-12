"use client";

import { useEffect, useRef } from "react";

/**
 * FORCE SAYFASI HAREKETLERI
 *
 * Kaydirmaya bagli efektler CSS degiskenleriyle calisir; React yeniden
 * cizilmez. Hareket azaltma tercihinde hicbiri calismaz, sayfa sabit ve
 * tamamen gorunur kalir (globals.css › Force sayfasi).
 */

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Bolumun ekrandan gecisini yazar: --p 0 (alttan girerken) → 1 (ustten
 * cikarken); --exit 0 (bolumun basi ekranin ustunde) → 1 (bolum tamamen
 * yukarida).
 */
export function useScrollProgress<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || reducedMotion()) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const clamp = (n: number) => Math.min(1, Math.max(0, n));
      el.style.setProperty("--p", clamp((vh - r.top) / (vh + r.height)).toFixed(4));
      el.style.setProperty("--exit", clamp(-r.top / r.height).toFixed(4));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);
  return ref;
}

/**
 * Ekrana girince bir kez data-shown="true" yazar; icindeki [data-fx]
 * ogeleri sirayla belirir (--d gecikmesiyle).
 */
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reducedMotion() || !("IntersectionObserver" in window)) {
      el.dataset.shown = "true";
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        el.dataset.shown = "true";
        observer.disconnect();
      },
      // Uzun bolumler (tablo) de ust kenari ekranin alt %15'ine girince belirir.
      { threshold: 0, rootMargin: "0px 0px -15% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
}

/** Ekrana girince 0'dan degerine sayar ("3,56" gibi ondalikli degerler dahil). */
export function CountUp({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    const target = Number(value.replace(",", "."));
    if (!el || !Number.isFinite(target) || reducedMotion() || !("IntersectionObserver" in window)) return;
    const decimals = value.split(",")[1]?.length ?? 0;
    const format = (n: number) => n.toFixed(decimals).replace(".", ",");
    let frame = 0;
    el.textContent = format(0);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const k = Math.min(1, (now - start) / 1400);
          el.textContent = format(target * (1 - Math.pow(1 - k, 3)));
          if (k < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.6 },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      el.textContent = value;
    };
  }, [value]);
  return <span ref={ref}>{value}</span>;
}

/** Kivilcimlar: [sol %, ust %, gecikme sn, sure sn, yatay kayma px] */
const SPARKS: [number, number, number, number, number][] = [
  [18, 88, 0, 3.4, -30], [27, 92, 1.2, 4.1, 24], [36, 86, 2.3, 3.2, -14], [44, 94, 0.6, 3.8, 40],
  [52, 90, 1.8, 3.1, -36], [58, 95, 2.9, 4.4, 18], [64, 87, 0.3, 3.6, -22], [71, 93, 1.5, 3.3, 30],
  [79, 89, 2.6, 4.0, -26], [33, 96, 3.3, 3.5, 12], [49, 85, 3.9, 3.9, -18], [67, 91, 4.4, 3.2, 34],
];

export function Sparks({ count = SPARKS.length }: { count?: number }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      {SPARKS.slice(0, count).map(([x, y, delay, duration, dx], i) => (
        <span
          key={i}
          className="zw-ember absolute"
          style={
            {
              left: `${x}%`,
              top: `${y}%`,
              animationDelay: `${delay}s`,
              animationDuration: `${duration}s`,
              "--dx": `${dx}px`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
