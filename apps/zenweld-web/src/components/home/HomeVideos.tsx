"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { visibleHomeVideos, youtubeEmbed, youtubeThumbnail } from "@zenweld/data";
import { getHomeVideos, useDatabase } from "@zenweld/store";
import { ProductImage } from "@zenweld/ui";
import { useT } from "@/lib/i18n-client";

/** Kartlar arasi bosluk (px). */
const GAP = 16;

/**
 * Aktif karta gore kartin yeri: -2 … 2 (liste dairesel; uctaki kart
 * ortadakinin oteki yanina gecer).
 */
function offsetOf(index: number, active: number, count: number): number {
  if (count < 3) return index - active;
  const d = (((index - active) % count) + count) % count;
  return d > count / 2 ? d - count : d;
}

/**
 * ANASAYFA › VIDEOLAR (KARARLAR K-125)
 *
 * Bayi bulucunun altindaki "Gerçek İşler, Gerçek Kaynak" bolumu: dik
 * (Shorts) videolar yan yana kayar; ortadaki kart buyuk ve renkli,
 * yanlardakiler soluk. Altta videodaki urunun adi (tiklaninca urun
 * sayfasi), noktalar ve oklar. Telefonda parmakla kaydirilir.
 *
 * Hiz ve gizlilik: sayfa acilirken yalnizca kapak resmi yuklenir (YouTube
 * oynaticisi yuklenmez); oynatici, ziyaretci Oynat'a basinca cerezsiz
 * YouTube adresinden (youtube-nocookie.com) acilir. Baska videoya
 * gecilince oynatici kapanir.
 *
 * Baslik ve videolar panelden yonetilir (Anasayfa Videoları;
 * settings.homeVideos). Yayinda video yoksa bolum gorunmez.
 */
export function HomeVideos() {
  const t = useT();
  const db = useDatabase();
  const settings = getHomeVideos(db);
  const items = visibleHomeVideos(settings, db.products);
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState<string | null>(null);
  const touchX = useRef<number | null>(null);

  if (items.length === 0) return null;
  const count = items.length;
  const current = Math.min(active, count - 1);
  const go = (index: number) => {
    setActive(((index % count) + count) % count);
    setPlaying(null);
  };

  return (
    <section className="bg-white" aria-labelledby="ana-sayfa-videolar">
      <div className="zw-container zw-section">
        <h2
          id="ana-sayfa-videolar"
          className="mb-8 text-center font-display text-4xl font-bold uppercase leading-[0.95] text-zw-ink sm:mb-10 sm:text-5xl"
        >
          {settings.title}
        </h2>

        <div
          role="region"
          aria-roledescription="carousel"
          aria-label={t.home.videos.label}
          className="relative overflow-hidden [--w:220px] sm:[--w:250px] lg:[--w:280px]"
          // Altta urun satiri olan video varsa onun yeri de ayrilir.
          style={{ height: `calc(var(--w) * 16 / 9 + ${items.some((x) => x.product) ? 104 : 32}px)` }}
          onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touchX.current === null) return;
            const dx = e.changedTouches[0].clientX - touchX.current;
            touchX.current = null;
            if (Math.abs(dx) > 40) go(current + (dx < 0 ? 1 : -1));
          }}
        >
          {items.map(({ video, product }, i) => {
            const d = offsetOf(i, current, count);
            const center = d === 0;
            const far = Math.abs(d) > 2;
            const cover = video.cover || youtubeThumbnail(video.youtubeId);
            return (
              <div
                key={video.id}
                aria-hidden={far}
                className={`absolute left-1/2 top-0 w-[var(--w)] transition-[transform,opacity,filter] duration-500 ease-out ${
                  far ? "pointer-events-none opacity-0" : center ? "z-20" : "z-10 opacity-55 grayscale"
                } ${Math.abs(d) === 2 ? "max-sm:opacity-0" : ""}`}
                style={{
                  transform: `translateX(calc(-50% + ${d} * (var(--w) + ${GAP}px))) scale(${center ? 1 : 0.88})`,
                  transformOrigin: "center top",
                }}
              >
                <div className="relative aspect-[9/16] overflow-hidden rounded-[6px] bg-zw-ink shadow-[0_18px_40px_-18px_rgba(0,0,0,0.55)]">
                  {center && playing === video.id ? (
                    <iframe
                      src={youtubeEmbed(video.youtubeId)}
                      title={product?.name ?? `${i + 1}. video`}
                      allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                      allowFullScreen
                      className="absolute inset-0 h-full w-full"
                    />
                  ) : (
                    <button
                      type="button"
                      tabIndex={Math.abs(d) <= 2 ? 0 : -1}
                      aria-label={center ? t.home.videos.playVideo(i + 1) : t.home.videos.showVideo(i + 1)}
                      onClick={() => (center ? setPlaying(video.id) : go(i))}
                      className="group absolute inset-0 h-full w-full zw-focus"
                    >
                      {/* Kapak: YouTube'un kapak resmi ya da panelde secilen gorsel; ekrana gelince yuklenir. */}
                      <ProductImage src={cover} alt="" label="" className="h-full w-full object-cover" />
                      <span className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
                      <span
                        className={`absolute flex items-center justify-center rounded-full bg-zw-red-600 text-white shadow-lg transition-transform group-hover:scale-105 ${
                          center ? "bottom-1/2 left-1/2 h-16 w-16 -translate-x-1/2 translate-y-1/2" : "bottom-4 right-4 h-11 w-11"
                        }`}
                      >
                        <Play size={center ? 28 : 20} fill="currentColor" className="ml-0.5" aria-hidden="true" />
                      </span>
                      {center && (
                        <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs font-bold uppercase tracking-[0.2em] text-white">
                          {t.home.videos.play}
                        </span>
                      )}
                    </button>
                  )}
                </div>

                {product && (
                  <Link
                    href={`/urun/${product.slug}`}
                    tabIndex={center ? 0 : -1}
                    className={`mt-3 flex items-center gap-3 rounded-[4px] border bg-white p-2.5 transition-colors zw-focus ${
                      center ? "border-zw-grey-300 hover:border-zw-red-600" : "border-zw-grey-200"
                    }`}
                  >
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[3px] bg-zw-grey-50">
                      <ProductImage
                        src={product.images[0]?.url}
                        alt=""
                        label=""
                        className="h-full w-full object-contain"
                      />
                    </span>
                    <span className="line-clamp-2 text-sm font-semibold leading-snug text-zw-ink">{product.name}</span>
                  </Link>
                )}
              </div>
            );
          })}
        </div>

        {count > 1 && (
          <div className="mt-2 flex flex-col items-center gap-5">
            <div className="flex gap-2">
              {items.map(({ video }, i) => (
                <button
                  key={video.id}
                  type="button"
                  aria-label={t.home.videos.showVideo(i + 1)}
                  aria-current={i === current}
                  onClick={() => go(i)}
                  className={`h-2.5 rounded-full transition-all zw-focus ${
                    i === current ? "w-7 bg-zw-red-600" : "w-2.5 bg-zw-grey-300 hover:bg-zw-grey-500"
                  }`}
                />
              ))}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                aria-label={t.home.videos.previous}
                onClick={() => go(current - 1)}
                className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-zw-ink text-zw-ink transition-colors hover:bg-zw-ink hover:text-white zw-focus"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                aria-label={t.home.videos.next}
                onClick={() => go(current + 1)}
                className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-zw-ink text-zw-ink transition-colors hover:bg-zw-ink hover:text-white zw-focus"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
