"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { homeVideos, videoPoster, videoTitle } from "@zenweld/data";
import { getHomeVideos, listVideos, useDatabase } from "@zenweld/store";
import { ProductImage } from "@zenweld/ui";
import { useT } from "@/lib/i18n-client";
import { VideoCover } from "./VideoCover";
import { VideoPlayer } from "./VideoPlayer";

/** Kartlar arasi bosluk (px). */
const GAP = 16;
/** Yandaki kartin boyu, ortadakinin bu kadari (ortaya hizali). */
const SIDE = 0.8;

const mod = (n: number, m: number) => ((n % m) + m) % m;

/**
 * ANASAYFA › VIDEOLAR (KARARLAR K-125)
 *
 * Bayi bulucunun altindaki "Gerçek İşler, Gerçek Kaynak" bolumu. Dik
 * (Shorts) video kartlari ayni genislikte yan yana durur (genis ekranda 5,
 * tablette 3, telefonda 1 ve yanlarda komsularin ucu); ortadaki kart daha
 * uzun ve renkli, yanlardakiler soluk. Ok, nokta, yandaki karta tiklama ya
 * da parmakla kaydirma bütün seridi tek parca kaydirir; liste sonsuz doner
 * (sondan sonra bastaki gelir, uctan yeni kart girer). Altta videodaki
 * urunun adi (tiklaninca urun sayfasi).
 *
 * Seridin yerlesimi: her kart bir "yuva"dir (pos); yuvanin anahtari
 * mutlak sirasidir, gosterdigi video pos mod (video sayisi). Gecis yalnizca
 * yuvalari kaydirir; uctaki yeni yuva ekranin disinda dogar.
 *
 * Hiz ve gizlilik: sayfa acilirken yalnizca kapak resmi yuklenir (YouTube
 * oynaticisi yuklenmez); oynatici, ziyaretci Oynat'a basinca cerezsiz
 * YouTube adresinden (youtube-nocookie.com) acilir. Baska videoya
 * gecilince oynatici kapanir.
 *
 * Baslik ve videolar panelden yonetilir (Videolar; baslik
 * settings.homeVideos, videolar kutuphaneden: yayinda ve "Anasayfada
 * goster" isaretli olanlar). Gosterilecek video yoksa bolum gorunmez.
 */
export function HomeVideos() {
  const t = useT();
  const db = useDatabase();
  const settings = getHomeVideos(db);
  const items = homeVideos(listVideos(db), db.products);
  const [pos, setPos] = useState(0);
  const [playing, setPlaying] = useState<number | null>(null);
  const touchX = useRef<number | null>(null);

  if (items.length === 0) return null;
  const count = items.length;
  const current = mod(pos, count);
  const hasProducts = items.some((x) => x.product);
  // Genis ekranda 5 kart tam, uclarda gecis sirasinda giren/cikan kart; az videoda tekrar yok.
  const left = count >= 5 ? 3 : Math.floor((count - 1) / 2);
  const right = count >= 5 ? 3 : count - 1 - left;
  const slots = Array.from({ length: left + right + 1 }, (_, i) => pos - left + i);

  const go = (target: number) => {
    setPos(target);
    setPlaying(null);
  };
  /** n. videoya en kisa yoldan. */
  const goToVideo = (n: number) => {
    let d = mod(n - current, count);
    if (d > count / 2) d -= count;
    go(pos + d);
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
          className="overflow-hidden"
          style={{ containerType: "inline-size" }}
          onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touchX.current === null) return;
            const dx = e.changedTouches[0].clientX - touchX.current;
            touchX.current = null;
            if (Math.abs(dx) > 40) go(pos + (dx < 0 ? 1 : -1));
          }}
        >
          {/* --w: kart genisligi; --h: ortadaki kartin boyu (9:16). */}
          <div
            className="relative [--w:62cqw] sm:[--w:calc((100cqw_-_32px)/3)] lg:[--w:calc((100cqw_-_64px)/5)]"
            style={{ height: `calc(var(--w) * 16 / 9 + ${hasProducts ? 92 : 8}px)`, ["--h" as string]: "calc(var(--w) * 16 / 9)" }}
          >
            {slots.map((slot) => {
              const d = slot - pos;
              const n = mod(slot, count);
              const { video, product } = items[n];
              const center = d === 0;
              const reachable = Math.abs(d) <= 2;
              return (
                <div
                  key={slot}
                  aria-hidden={!reachable}
                  className={`absolute w-[var(--w)] transition-[left,top,opacity,filter] duration-500 ease-in-out ${
                    center ? "z-20" : "z-10 opacity-50 grayscale"
                  }`}
                  style={{
                    left: `calc(50% - var(--w) / 2 + ${d} * (var(--w) + ${GAP}px))`,
                    top: center ? 0 : `calc(var(--h) * ${(1 - SIDE) / 2})`,
                  }}
                >
                  <div
                    className="relative overflow-hidden rounded-[6px] bg-zw-ink shadow-[0_18px_40px_-20px_rgba(0,0,0,0.6)] transition-[height] duration-500 ease-in-out"
                    style={{ height: center ? "var(--h)" : `calc(var(--h) * ${SIDE})` }}
                  >
                    {center && playing === slot ? (
                      <VideoPlayer video={video} title={videoTitle(video, product)} className="absolute inset-0 h-full w-full" />
                    ) : (
                      <button
                        type="button"
                        tabIndex={reachable ? 0 : -1}
                        aria-label={center ? t.home.videos.playVideo(n + 1) : t.home.videos.showVideo(n + 1)}
                        onClick={() => (center ? setPlaying(slot) : go(slot))}
                        className="group absolute inset-0 h-full w-full zw-focus"
                      >
                        <VideoCover youtubeId={video.youtubeId ?? ""} cover={videoPoster(video)} className="h-full w-full object-cover" />
                        <span className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
                        <span
                          className={`absolute flex items-center justify-center rounded-full bg-zw-red-600 text-white shadow-lg transition-transform group-hover:scale-105 ${
                            center ? "bottom-1/2 left-1/2 h-16 w-16 -translate-x-1/2 translate-y-1/2" : "bottom-3 right-3 h-10 w-10"
                          }`}
                        >
                          <Play size={center ? 28 : 18} fill="currentColor" className="ml-0.5" aria-hidden="true" />
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
                        <ProductImage src={product.images[0]?.url} alt="" label="" className="h-full w-full object-contain" />
                      </span>
                      <span className="line-clamp-2 text-sm font-semibold leading-snug text-zw-ink">{product.name}</span>
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {count > 1 && (
          <div className="mt-6 flex flex-col items-center gap-5">
            <div className="flex gap-2">
              {items.map(({ video }, i) => (
                <button
                  key={video.id}
                  type="button"
                  aria-label={t.home.videos.showVideo(i + 1)}
                  aria-current={i === current}
                  onClick={() => goToVideo(i)}
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
                onClick={() => go(pos - 1)}
                className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-zw-ink text-zw-ink transition-colors hover:bg-zw-ink hover:text-white zw-focus"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                aria-label={t.home.videos.next}
                onClick={() => go(pos + 1)}
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
