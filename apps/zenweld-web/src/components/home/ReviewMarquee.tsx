"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Quote } from "lucide-react";
import type { ProductReview } from "@zenweld/data";
import { featuredReviews, useDatabase } from "@zenweld/store";
import { SectionHeading, StarRating } from "@zenweld/ui";
import { useT } from "@/lib/i18n-client";

/**
 * ANASAYFADAKI KAYAN YORUM SERIDI
 *
 * Yonetim panelinde isaretlenmis (featured) en fazla 10 yorumu yavasca
 * yana kaydirir. Urun seridiyle ayni mantik: liste iki kez basilir,
 * kapsayici her karede birkac piksel kaydirilir, sonuna gelince basa
 * sarilir. Fareyle uzerine gelince durur.
 */
export function ReviewMarquee({ site = "zenweld" }: { site?: ProductReview["site"] }) {
  const t = useT();
  const db = useDatabase();
  const items = useMemo(() => featuredReviews(site, db), [site, db]);

  const trackRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || items.length === 0) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    let last = performance.now();
    let offset = track.scrollLeft;

    const step = (now: number) => {
      const delta = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (!paused) {
        offset += 22 * delta;
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
  }, [paused, items.length]);

  if (items.length === 0) return null;

  const loop = [...items, ...items];

  return (
    <section className="bg-zw-grey-50">
      <div className="zw-container zw-section">
        <SectionHeading title={t.reviews.homeTitle} subtitle={t.reviews.homeSubtitle} />

        <div
          ref={trackRef}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onTouchStart={() => setPaused(true)}
          onTouchEnd={() => setPaused(false)}
          className="zw-no-scrollbar flex gap-4 overflow-x-auto pb-1"
          style={{ scrollbarWidth: "none" }}
        >
          {loop.map((r, i) => (
            <figure
              key={`${r.id}-${i}`}
              className="flex w-[300px] shrink-0 flex-col rounded-[6px] border border-zw-grey-200 bg-white p-5"
            >
              <Quote size={20} className="text-zw-red-600" />
              <StarRating value={r.rating} size={15} />
              {r.title && <h3 className="mt-2 font-semibold text-zw-ink">{r.title}</h3>}
              <blockquote className="mt-1.5 line-clamp-5 text-sm leading-relaxed text-zw-grey-700">
                {r.body}
              </blockquote>
              <figcaption className="mt-auto pt-3 text-xs font-semibold uppercase tracking-wide text-zw-grey-500">
                {r.authorName}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
