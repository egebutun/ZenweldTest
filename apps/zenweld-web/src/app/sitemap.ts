import type { MetadataRoute } from "next";
import { blogPosts, categories, categoryGroups, events, news, products } from "@zenweld/data";
import { categoryHref, groupHref } from "@/lib/catalog";
import { INDEXABLE_PAGES } from "@/lib/page-meta";
import { getSiteUrl } from "@/lib/seo";

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
 * Liste koddaki veriden uretilir; panelde eklenen urun ve yazilar backend
 * kurulunca veritabanindan okunacak (bkz. docs/YAPILACAKLAR.md).
 */

export default function sitemap(): MetadataRoute.Sitemap {
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
