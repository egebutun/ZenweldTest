import type { MetadataRoute } from "next";
import { blogPosts, events, news } from "@zenweld/data";
import { categoryHref, groupHref } from "@/lib/catalog";
import { INDEXABLE_PAGES } from "@/lib/page-meta";
import { getSiteUrl } from "@/lib/seo";
import { getServerCatalog } from "@/lib/server/catalog";

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
 * Urunler, gruplar ve kategoriler sunucunun katalogundan gelir: veri
 * kaynagi veritabaniysa tablolardan (en fazla 60 saniye eski), degilse
 * koddaki ornek veriden. Blog, haber ve etkinlikler simdilik koddaki
 * veriden uretilir; veritabanindan okunmalari sonraki adimda
 * (docs/YAPILACAKLAR.md › Asama 3).
 */

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { categories, categoryGroups, products } = await getServerCatalog();
  const base = getSiteUrl();
  const entry = (path: string, lastModified?: string): MetadataRoute.Sitemap[number] => ({
    url: `${base}${path}`,
    ...(lastModified ? { lastModified: new Date(lastModified) } : {}),
  });

  return [
    // Sabit sayfalar: lib/page-meta.ts (Sayfa SEO ekranindaki liste)
    ...INDEXABLE_PAGES.map((page) => entry(page.path)),
    ...categoryGroups.map((group) => entry(groupHref(group))),
    ...categories.map((category) => entry(categoryHref(category))),
    ...products.filter((p) => p.active).map((p) => entry(`/urun/${p.slug}`, p.updatedAt)),
    ...blogPosts.filter((p) => p.active !== false).map((p) => entry(`/blog/${p.slug}`, p.publishedAt)),
    ...news.filter((n) => n.active).map((n) => entry(`/haberler/${n.slug}`, n.publishedAt)),
    ...events.filter((e) => e.active).map((e) => entry(`/etkinlikler/${e.slug}`)),
  ];
}
