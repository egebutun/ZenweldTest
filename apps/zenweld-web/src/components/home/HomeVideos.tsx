"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Heart, Play } from "lucide-react";
import { groupVideosByCategory, homeVideos, productHighlights, videoPoster, videoTitle, type Product, type SiteVideo } from "@zenweld/data";
import { getHomeVideos, isProductInStock, listVideos, useDatabase } from "@zenweld/store";
import { ProductImage } from "@zenweld/ui";
import { useT } from "@/lib/i18n-client";
import { VideoCover } from "./VideoCover";
import { VideoPlayer } from "./VideoPlayer";
import { CardCartButton, ProductPrice } from "@/components/product/ProductCard";
import { useFavourites } from "@/lib/favourites";

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
 * (sondan sonra bastaki gelir, uctan yeni kart girer). Urunu olan videonun
 * yaninda yapisik urun karti (VideoCarousel).
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
 *
 * Kategori sekmeleri: videolar urunlerinin kategorisine gore ayrilir;
 * sekmeler menudeki sirayla, "Tümü" yok, acilista ilk sekme secili; urunsuz
 * videolar en sondaki "Genel" sekmesinde. Tek grup varsa sekme gorunmez.
 * Altta "Tüm videolar" Videolar sayfasini (/videolar) secili sekmenin
 * kategorisiyle acar (?kategori=<kategorinin linki>).
 */
export function HomeVideos() {
  const t = useT();
  const db = useDatabase();
  const settings = getHomeVideos(db);
  const groups = groupVideosByCategory(homeVideos(listVideos(db), db.products), db.categories, db.categoryGroups);
  const [selected, setSelected] = useState<string | null>(null);

  if (groups.length === 0) return null;
  const group = groups.find((g) => g.key === selected) ?? groups[0];

  return (
    <section className="bg-white" aria-labelledby="ana-sayfa-videolar">
      <div className="zw-container zw-section">
        <h2
          id="ana-sayfa-videolar"
          className="mb-6 text-center font-display text-4xl font-bold uppercase leading-[0.95] text-zw-ink sm:mb-8 sm:text-5xl"
        >
          {settings.title}
        </h2>

        {groups.length > 1 && (
          <div
            role="tablist"
            aria-label={t.home.videos.categories}
            className="-mx-4 mb-8 flex gap-2 overflow-x-auto px-4 pb-1 sm:justify-center"
          >
            {groups.map((g) => (
              <button
                key={g.key}
                type="button"
                role="tab"
                aria-selected={g.key === group.key}
                onClick={() => setSelected(g.key)}
                className={`shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition-colors zw-focus ${
                  g.key === group.key
                    ? "border-zw-ink bg-zw-ink text-white"
                    : "border-zw-grey-300 text-zw-grey-700 hover:border-zw-ink hover:text-zw-ink"
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        )}

        <VideoCarousel key={group.key} items={group.items} />

        <div className="mt-6 text-center">
          <Link href={`/videolar?kategori=${encodeURIComponent(group.category?.slug ?? group.key)}`} className="text-sm font-semibold text-zw-red-700 underline-offset-4 hover:underline zw-focus">
            {t.home.videos.all} →
          </Link>
        </div>
      </div>
    </section>
  );
}

/**
 * Kategorinin videolari icin kayan serit (yukaridaki yerlesim).
 *
 * Videolarin urunu varsa her video, sagina yapisik urun karti ile bir
 * "cift"tir (KARARLAR K-125): kartta fotograf, ad, one cikan ozellikler
 * (genis ekranda), fiyat, favori ve sepete ekle (secenekli urunde
 * "Seçenekleri Gör"); fotografa ya da ada tiklaninca urun sayfasi acilir.
 * Serit ciftleri birlikte kaydirir; ortadaki cift renkli, yanlardakiler
 * soluk. Urunu olmayan videolar (Genel) tek basina, ortadaki daha uzun.
 */
function VideoCarousel({ items }: { items: { video: SiteVideo; product?: Product }[] }) {
  const t = useT();
  const [pos, setPos] = useState(0);
  const [playing, setPlaying] = useState<number | null>(null);
  const touchX = useRef<number | null>(null);

  const count = items.length;
  const current = mod(pos, count);
  const paired = items.every((x) => x.product);
  // Genis ekranda ortadaki ve yanlardaki kartlar; uclarda gecis sirasinda giren/cikan kart; az videoda tekrar yok.
  const left = count >= 5 ? 3 : Math.floor((count - 1) / 2);
  const right = count >= 5 ? 3 : count - 1 - left;
  const slots = Array.from({ length: left + right + 1 }, (_, i) => pos - left + i);
  // Yuvanin genisligi: cift (video + urun karti) ya da yalnizca video.
  const slot = paired ? "(var(--w) * 2)" : "var(--w)";

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
    <>
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
        {/* --w: videonun genisligi; --h: ortadaki videonun boyu (9:16). */}
        <div
          className={`relative ${
            paired
              ? "[--w:40cqw] sm:[--w:min(240px,24cqw)] lg:[--w:min(280px,20cqw)]"
              : "[--w:62cqw] sm:[--w:calc((100cqw_-_32px)/3)] lg:[--w:calc((100cqw_-_64px)/5)]"
          }`}
          style={{ height: "calc(var(--w) * 16 / 9 + 8px)", ["--h" as string]: "calc(var(--w) * 16 / 9)" }}
        >
          {slots.map((slotNo) => {
            const d = slotNo - pos;
            const n = mod(slotNo, count);
            const { video, product } = items[n];
            const center = d === 0;
            const reachable = Math.abs(d) <= 2;
            // Tek videoda yanlardakiler kisa; ciftte urun karti ayni boyda kalsin diye boy degismez.
            const short = !paired && !center;
            return (
              <div
                key={slotNo}
                aria-hidden={!reachable}
                inert={!reachable}
                className={`absolute flex overflow-hidden rounded-[6px] shadow-[0_18px_40px_-20px_rgba(0,0,0,0.6)] transition-[left,top,height,opacity,filter] duration-500 ease-in-out ${
                  center ? "z-20" : "z-10 opacity-50 grayscale"
                } ${paired ? "border border-zw-grey-200 bg-white" : "bg-zw-ink"}`}
                style={{
                  width: `calc(${slot})`,
                  left: `calc(50% - ${slot} / 2 + ${d} * (${slot} + ${GAP}px))`,
                  top: short ? `calc(var(--h) * ${(1 - SIDE) / 2})` : 0,
                  height: short ? `calc(var(--h) * ${SIDE})` : "var(--h)",
                }}
              >
                <div className="relative h-full w-[var(--w)] shrink-0 bg-zw-ink">
                  {center && playing === slotNo ? (
                    <VideoPlayer video={video} title={videoTitle(video, product)} className="absolute inset-0 h-full w-full" />
                  ) : (
                    <button
                      type="button"
                      aria-label={center ? t.home.videos.playVideo(n + 1) : t.home.videos.showVideo(n + 1)}
                      onClick={() => (center ? setPlaying(slotNo) : go(slotNo))}
                      className="group absolute inset-0 h-full w-full zw-focus"
                    >
                      <VideoCover youtubeId={video.youtubeId ?? ""} cover={videoPoster(video)} className="h-full w-full object-cover" />
                      <span className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
                      <span
                        className={`absolute flex items-center justify-center rounded-full bg-zw-red-600 text-white shadow-lg transition-transform group-hover:scale-105 ${
                          center ? "bottom-1/2 left-1/2 h-14 w-14 -translate-x-1/2 translate-y-1/2 sm:h-16 sm:w-16" : "bottom-3 right-3 h-10 w-10"
                        }`}
                      >
                        <Play size={center ? 26 : 18} fill="currentColor" className="ml-0.5" aria-hidden="true" />
                      </span>
                      {center && (
                        <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs font-bold uppercase tracking-[0.2em] text-white">
                          {t.home.videos.play}
                        </span>
                      )}
                    </button>
                  )}
                </div>
                {paired && product && <VideoProductCard product={product} />}
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
    </>
  );
}

/**
 * Videonun yanindaki urun karti: fotograf ve ad urun sayfasina gider; one
 * cikan ozellikler (genis ekranda), fiyat, favori ve sepete ekle (secenekli
 * urunde "Seçenekleri Gör"; depoda yoksa "Stokta Yok"). Boyu videoyla ayni;
 * fotograf kalan yere sigar.
 */
function VideoProductCard({ product }: { product: Product }) {
  const db = useDatabase();
  const favourites = useFavourites();
  const inStock = isProductInStock(product, undefined, db);
  const highlights = productHighlights(product);
  return (
    <div className="relative flex h-full w-[var(--w)] shrink-0 flex-col border-l border-zw-grey-200 bg-white">
      <button
        type="button"
        onClick={() => favourites.toggle(product.id)}
        aria-label="Favori"
        className="absolute right-2 top-2 z-10 rounded-full bg-white/90 p-1.5 text-zw-grey-500 transition-colors hover:text-zw-red-600"
      >
        <Heart size={16} className={favourites.has(product.id) ? "fill-zw-red-600 text-zw-red-600" : ""} />
      </button>
      <Link href={`/urun/${product.slug}`} tabIndex={-1} aria-hidden="true" className="block min-h-0 flex-1 bg-zw-grey-50">
        <ProductImage src={product.images[0]?.url} alt="" label={product.name} className="h-full w-full object-contain p-2" />
      </Link>
      <div className="flex flex-col p-2.5 sm:p-3">
        <Link href={`/urun/${product.slug}`} className="zw-focus">
          <h3 className="line-clamp-2 font-display text-sm font-semibold leading-tight text-zw-ink hover:text-zw-red-600 sm:text-base">{product.name}</h3>
        </Link>
        {highlights.length > 0 && (
          <ul className="mt-2 hidden space-y-1 lg:block">
            {highlights.map((h, i) => (
              <li key={i} className="flex gap-2 text-xs leading-snug text-zw-grey-600">
                <span className="mt-[6px] h-1 w-1 shrink-0 rounded-full bg-zw-red-600" />
                <span className="line-clamp-1">{h}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-2 [&_.text-xl]:text-lg sm:mt-3 sm:[&_.text-xl]:text-xl">
          <ProductPrice product={product} compact />
        </div>
        <CardCartButton product={product} inStock={inStock} />
      </div>
    </div>
  );
}
