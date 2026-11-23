import type { MetadataRoute } from "next";
import { productVideos, siteVideos, videoDescription, videoPoster, videoTitle, youtubeThumbnail, type Product, type SiteVideo } from "@zenweld/data";
import { categoryHref, groupHref } from "@/lib/catalog";
import { INDEXABLE_PAGES } from "@/lib/page-meta";
import { absoluteUrl, getSiteUrl } from "@/lib/seo";
import { getServerCatalog } from "@/lib/server/catalog";
import { getServerContent } from "@/lib/server/content";

/**
 * /sitemap.xml
 *
 * Yalnizca Google'da gorunmesini istedigimiz sayfalar: urunler, katalog,
 * blog, haberler, etkinlikler, kurumsal ve destek sayfalari. Giris, sepet,
 * odeme, arama, hesabim, yonetim paneli ve yer tutucu metinli yasal sayfalar
 * girmez (bu sayfalar noindex etiketi tasir).
 *
 * "Son degisiklik" (lastmod) yalnizca gercek tarihi bilinen sayfalarda
 * yazilir: urunun guncellenme, blog yazisinin ve haberin yayin tarihi.
 * Diger sayfalara her derlemede "bugun" yazilirsa Google bu tarihe
 * guvenmemeyi ogrenir. Oncelik (priority) ve siklik (changefreq) alanlarini
 * Google kullanmadigi icin yazilmaz.
 *
 * Videolar (KARARLAR K-125): Videolar sayfasinin ve videosu olan urun
 * sayfalarinin satirinda video bilgisi (baslik, aciklama, kapak, kendi
 * videomuzda dosya ve sure, YouTube'da cerezsiz oynatici adresi).
 *
 * Urunler, gruplar, kategoriler, blog, haber ve etkinlikler sunucunun
 * katalogundan ve iceriginden gelir: veri kaynagi veritabaniysa
 * tablolardan (en fazla 60 saniye eski), degilse koddaki ornek veriden.
 */

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { categories, categoryGroups, products } = await getServerCatalog();
  const { blogPosts, events, news, videos } = await getServerContent();
  // Videolar (K-123, K-125): Videolar sayfasinda hepsi, urun sayfasinda o urunun videolari.
  const videoEntry = (v: SiteVideo, product?: Product) => {
    const thumbnail = videoPoster(v) ?? (v.youtubeId ? youtubeThumbnail(v.youtubeId) : "");
    return {
      title: videoTitle(v, product),
      description: videoDescription(v, product),
      thumbnail_loc: absoluteUrl(thumbnail),
      ...(v.source === "file" && v.file?.hd
        ? { content_loc: absoluteUrl(v.file.hd), ...(v.file.durationSeconds ? { duration: v.file.durationSeconds } : {}) }
        : { player_loc: `https://www.youtube-nocookie.com/embed/${v.youtubeId}` }),
      publication_date: v.createdAt,
    };
  };
  const shown = siteVideos(videos, products);
  const base = getSiteUrl();
  const entry = (path: string, lastModified?: string): MetadataRoute.Sitemap[number] => ({
    url: `${base}${path}`,
    ...(lastModified ? { lastModified: new Date(lastModified) } : {}),
  });

  return [
    // Sabit sayfalar: lib/page-meta.ts (Sayfa SEO ekranindaki liste)
    ...INDEXABLE_PAGES.map((page) =>
      page.path === "/videolar" && shown.length ? { ...entry(page.path), videos: shown.map(({ video, product }) => videoEntry(video, product)) } : entry(page.path),
    ),
    ...categoryGroups.map((group) => entry(groupHref(group))),
    ...categories.map((category) => entry(categoryHref(category))),
    ...products
      .filter((p) => p.active)
      .map((p) => {
        const own = productVideos(videos, p.id);
        return own.length ? { ...entry(`/urun/${p.slug}`, p.updatedAt), videos: own.map((v) => videoEntry(v, p)) } : entry(`/urun/${p.slug}`, p.updatedAt);
      }),
    ...blogPosts.filter((p) => p.active !== false).map((p) => entry(`/blog/${p.slug}`, p.publishedAt)),
    ...news.filter((n) => n.active).map((n) => entry(`/haberler/${n.slug}`, n.publishedAt)),
    ...events.filter((e) => e.active).map((e) => entry(`/etkinlikler/${e.slug}`)),
  ];
}
