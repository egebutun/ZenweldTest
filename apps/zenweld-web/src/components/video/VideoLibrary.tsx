"use client";

import { useEffect, useState } from "react";
import Link from "@/components/common/Link";
import { Play } from "lucide-react";
import { categoryHref, groupVideosByCategory, siteVideos, videoPoster, videoTitle, type Product, type SiteVideo, type VideoGroup } from "@zenweld/data";
import { listVideos, useDatabase } from "@zenweld/store";
import { ProductImage } from "@zenweld/ui";
import { PageHero } from "@/components/common/PageShell";
import { VideoCover } from "@/components/home/VideoCover";
import { VideoPlayer } from "@/components/home/VideoPlayer";
import { useT } from "@/lib/i18n-client";

/** Adresteki kategori: kategorinin linki (slug) ya da "genel". */
const categoryParam = (group: VideoGroup) => group.category?.slug ?? group.key;

/**
 * VIDEOLAR SAYFASI (/videolar; KARARLAR K-125)
 *
 * Kutuphanedeki yayinda ve oynatilabilir butun videolar, urunlerinin
 * kategorisine gore gruplu. Ustte kategori sekmeleri (anasayfadaki gibi;
 * menudeki sirayla, "Tümü" yok, acilista ilk sekme; urunsuzler en sonda
 * "Genel"; tek grup varsa sekme yok). Secilen kategori adrese yazilir
 * (/videolar?kategori=<kategorinin linki>); bu adresle acilinca o sekme
 * secili gelir (anasayfadaki "Tüm videolar" secili sekmeyle gelir).
 *
 * Secili kategorinin basliginda tam adi ve video sayisi, sag tarafta
 * kategori sayfasina baglanti ("Tüm <kategori adı> →"). Secili olmayan
 * kategoriler sayfadan kaldirilmaz, gizlenir: Google butun videolari
 * sayfada gorur; gizli kartlarin kapaklari yuklenmez.
 *
 * Her kartta dik kapak (Oynat'a basinca video yerinde oynar; ayni anda tek
 * video), basligi ve urunun adi (urun sayfasina gider).
 */
export function VideoLibrary() {
  const t = useT();
  const db = useDatabase();
  const groups = groupVideosByCategory(siteVideos(listVideos(db), db.products), db.categories, db.categoryGroups);
  const [selected, setSelected] = useState<string | null>(null);
  const [playing, setPlaying] = useState<string | null>(null);

  // Adresteki kategori (sayfa hazirlanirken bilinmez; acilinca okunur).
  useEffect(() => {
    const wanted = new URLSearchParams(window.location.search).get("kategori");
    if (wanted) setSelected(wanted);
  }, []);

  const current = groups.find((g) => categoryParam(g) === selected) ?? groups[0];
  const choose = (group: VideoGroup) => {
    setSelected(categoryParam(group));
    setPlaying(null);
    window.history.replaceState(null, "", `/videolar?kategori=${encodeURIComponent(categoryParam(group))}`);
  };

  return (
    <>
      <PageHero title={t.explore.videos} subtitle={t.explore.videosDesc} />
      <div className="zw-container py-12">
        {groups.length === 0 && <p className="text-zw-grey-600">{t.videos.empty}</p>}
        {groups.length > 1 && (
          <div role="tablist" aria-label={t.home.videos.categories} className="-mx-4 mb-8 flex gap-2 overflow-x-auto px-4 pb-1">
            {groups.map((g) => (
              <button
                key={g.key}
                type="button"
                role="tab"
                aria-selected={g.key === current.key}
                aria-controls={`videolar-${categoryParam(g)}`}
                onClick={() => choose(g)}
                className={`shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition-colors zw-focus ${
                  g.key === current.key ? "border-zw-ink bg-zw-ink text-white" : "border-zw-grey-300 text-zw-grey-700 hover:border-zw-ink hover:text-zw-ink"
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        )}
        {groups.map((group) => (
          <section
            key={group.key}
            id={`videolar-${categoryParam(group)}`}
            role={groups.length > 1 ? "tabpanel" : undefined}
            hidden={group.key !== current.key}
            aria-labelledby={`videolar-baslik-${categoryParam(group)}`}
          >
            <div className="mb-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-b border-zw-grey-200 pb-3">
              <h2 id={`videolar-baslik-${categoryParam(group)}`} className="font-display text-2xl font-bold uppercase text-zw-ink sm:text-3xl">
                {group.name}
                <span className="ml-2 align-middle font-sans text-sm font-semibold normal-case tracking-normal text-zw-grey-500">
                  · {t.videos.count(group.items.length)}
                </span>
              </h2>
              {group.category && (
                <Link href={categoryHref(group.category)} className="text-sm font-semibold text-zw-red-700 hover:underline zw-focus">
                  {t.videos.toCategory(group.category.name)} →
                </Link>
              )}
            </div>
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {group.items.map(({ video, product }) => (
                <li key={video.id}>
                  <VideoCard video={video} product={product} playing={playing === video.id} onPlay={() => setPlaying(video.id)} />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}

function VideoCard({ video, product, playing, onPlay }: { video: SiteVideo; product?: Product; playing: boolean; onPlay: () => void }) {
  const t = useT();
  const title = videoTitle(video, product);
  return (
    <article className="flex h-full flex-col">
      <div className="relative aspect-[9/16] overflow-hidden rounded-[6px] bg-zw-ink">
        {playing ? (
          <VideoPlayer video={video} title={title} className="absolute inset-0 h-full w-full" />
        ) : (
          <button type="button" aria-label={t.videos.play(title)} onClick={onPlay} className="group absolute inset-0 h-full w-full zw-focus">
            <VideoCover youtubeId={video.youtubeId ?? ""} cover={videoPoster(video)} className="h-full w-full object-cover" />
            <span className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            <span className="absolute bottom-1/2 left-1/2 flex h-14 w-14 -translate-x-1/2 translate-y-1/2 items-center justify-center rounded-full bg-zw-red-600 text-white shadow-lg transition-transform group-hover:scale-105">
              <Play size={24} fill="currentColor" className="ml-0.5" aria-hidden="true" />
            </span>
          </button>
        )}
      </div>
      <h3 className="mt-3 line-clamp-2 font-sans text-sm font-semibold normal-case leading-snug tracking-normal text-zw-ink">{title}</h3>
      {product && (
        <Link
          href={`/urun/${product.slug}`}
          className="mt-2 flex items-center gap-2 rounded-[4px] border border-zw-grey-200 p-2 transition-colors hover:border-zw-red-600 zw-focus"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[3px] bg-zw-grey-50">
            <ProductImage src={product.images[0]?.url} alt="" label="" className="h-full w-full object-contain" />
          </span>
          <span className="line-clamp-2 text-xs font-semibold leading-snug text-zw-grey-700">{product.name}</span>
        </Link>
      )}
    </article>
  );
}
