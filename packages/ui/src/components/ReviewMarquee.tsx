"use client";

import { useEffect, useRef, useState } from "react";
import { Quote } from "lucide-react";
import { SectionHeading } from "./Misc";
import { StarRating } from "./StarRating";

export interface MarqueeReview {
  id: string;
  rating: number;
  title?: string;
  body: string;
  authorName: string;
  productName?: string;
}

/** Kart genisligi + aradaki bosluk (px). Halka hesabi bu adima dayanir. */
const CARD_WIDTH = 300;
const GAP = 16;
const STEP = CARD_WIDTH + GAP;
/** Saniyedeki kaydirma hizi (px). */
const SPEED = 22;

/**
 * KAYAN YORUM SERIDI (halka duzeni)
 *
 * ONEMLI: Liste IKI KEZ BASILMAZ. Onceki surumde sonsuz kaydirma icin
 * kartlar iki kez yazdiriliyordu; 10 yorum ekranda 20 kart gibi
 * gorunuyordu. Bunun yerine her kart mutlak konumlandirilip her karede
 * kendi x'i modulo ile hesaplaniyor: soldan cikan kart sagdan geri
 * girer. Boylece DOM'da her yorum YALNIZCA BIR KEZ bulunur.
 *
 * Yorumlar ekrani doldurmuyorsa (orn. 3 yorumlu bayi magazasi) halka
 * donmez — kaydirilacak bir sey yoktur, kartlar sabit satirda durur.
 * Hareketi azaltma tercihi acik olan cihazlarda da ayni sekilde.
 */
export function ReviewMarquee({
  items,
  title,
  subtitle,
  eyebrow,
  tone = "light",
}: {
  items: MarqueeReview[];
  title: string;
  subtitle?: string;
  eyebrow?: string;
  tone?: "light" | "grey";
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLElement | null)[]>([]);
  const pausedRef = useRef(false);
  /** Sunucuda ve ilk karede sabit satir; olcum sonrasi gerekiyorsa halkaya gecilir. */
  const [ring, setRing] = useState(false);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setRing(false);
      return;
    }
    const decide = () => setRing(STEP * items.length > wrap.clientWidth + GAP);
    decide();
    window.addEventListener("resize", decide);
    return () => window.removeEventListener("resize", decide);
  }, [items.length]);

  useEffect(() => {
    if (!ring || items.length === 0) return;

    const total = STEP * items.length;
    let offset = 0;
    let last = performance.now();
    let frame = 0;

    // Kart konumu [-STEP, total-STEP) araliginda tutulur: bir kart sol
    // kenardan tamamen kayip ciktiktan SONRA halkanin sonuna atlar.
    // Aksi halde x=0'da aniden kaybolur ve solda bosluk olusurdu.
    const place = () => {
      cardsRef.current.forEach((el, i) => {
        if (!el) return;
        const x = ((((i * STEP - offset) % total) + total) % total) - STEP;
        el.style.transform = `translateX(${x}px)`;
      });
    };

    const tick = (now: number) => {
      const delta = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (!pausedRef.current) offset = (offset + SPEED * delta) % total;
      place();
      frame = requestAnimationFrame(tick);
    };

    place();
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [items.length, ring]);

  if (items.length === 0) return null;

  return (
    <section className={tone === "grey" ? "bg-zw-grey-50" : "bg-white"}>
      <div className="zw-container zw-section">
        <SectionHeading eyebrow={eyebrow} title={title} subtitle={subtitle} />

        <div
          ref={wrapRef}
          onMouseEnter={() => {
            pausedRef.current = true;
          }}
          onMouseLeave={() => {
            pausedRef.current = false;
          }}
          onTouchStart={() => {
            pausedRef.current = true;
          }}
          onTouchEnd={() => {
            pausedRef.current = false;
          }}
          className={
            ring
              ? "relative h-[248px] overflow-hidden"
              : "zw-no-scrollbar flex gap-4 overflow-x-auto pb-1"
          }
          style={ring ? undefined : { scrollbarWidth: "none" }}
        >
          {items.map((r, i) => (
            <figure
              key={r.id}
              ref={(el) => {
                cardsRef.current[i] = el;
              }}
              className={`flex w-[300px] shrink-0 flex-col rounded-[6px] border border-zw-grey-200 bg-white p-5 ${
                ring ? "absolute left-0 top-0 h-full will-change-transform" : ""
              }`}
            >
              <Quote size={20} className="text-zw-red-600" />
              <StarRating value={r.rating} size={15} />
              {r.title && <h3 className="mt-2 font-semibold text-zw-ink">{r.title}</h3>}
              <blockquote className="mt-1.5 line-clamp-4 text-sm leading-relaxed text-zw-grey-700">
                {r.body}
              </blockquote>
              <figcaption className="mt-auto pt-3 text-xs font-semibold uppercase tracking-wide text-zw-grey-500">
                {r.authorName}
                {r.productName && (
                  <span className="block normal-case tracking-normal text-zw-grey-400">
                    {r.productName}
                  </span>
                )}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
