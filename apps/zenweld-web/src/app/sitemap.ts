import type { MetadataRoute } from "next";
import { categories, products, events, news, newsSlug } from "@zenweld/data";
import { locales, localizePath } from "@zenweld/i18n";
import { getSiteUrl } from "@/lib/seo";

/**
 * /sitemap.xml
 *
 * Urun, kategori ve blog sayfalari packages/data icindeki veriden otomatik
 * uretilir; yeni urun eklendiginde site haritasi kendiliginden guncellenir.
 * Her adres TR ve EN karsiligiyla birlikte listelenir (hreflang).
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  const now = new Date();

  const staticPaths: { path: string; priority: number; freq: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
    { path: "", priority: 1, freq: "weekly" },
    { path: "/ekipmanlar", priority: 0.9, freq: "weekly" },
    { path: "/guvenlik", priority: 0.7, freq: "monthly" },
    { path: "/aksesuarlar", priority: 0.7, freq: "monthly" },
    { path: "/dolgu-metalleri", priority: 0.7, freq: "monthly" },
    { path: "/yetkili-bayi-ve-servis-agi", priority: 0.9, freq: "monthly" },
    { path: "/teklif-al", priority: 0.9, freq: "monthly" },
    { path: "/hakkimizda", priority: 0.6, freq: "yearly" },
    { path: "/kesfet/welders-club", priority: 0.6, freq: "monthly" },
    { path: "/kesfet/bayilik-basvurusu", priority: 0.7, freq: "yearly" },
    { path: "/kesfet/garanti", priority: 0.6, freq: "yearly" },
    { path: "/kesfet/blog", priority: 0.6, freq: "weekly" },
    { path: "/kesfet/etkinlikler", priority: 0.7, freq: "weekly" },
    { path: "/kesfet/haberler", priority: 0.7, freq: "weekly" },
    { path: "/kesfet/urun-secici", priority: 0.6, freq: "monthly" },
    { path: "/kesfet/kaynak-rehberi", priority: 0.6, freq: "yearly" },
    { path: "/kesfet/msds", priority: 0.4, freq: "yearly" },
    { path: "/kesfet/parti-sertifikalari", priority: 0.4, freq: "yearly" },
    { path: "/destek", priority: 0.5, freq: "monthly" },
    { path: "/destek/sss", priority: 0.5, freq: "monthly" },
    { path: "/destek/iletisim", priority: 0.5, freq: "yearly" },
  ];

  const entries: MetadataRoute.Sitemap = [];

  const push = (
    path: string,
    priority: number,
    freq: MetadataRoute.Sitemap[number]["changeFrequency"],
    lastModified: Date = now,
  ) => {
    locales.forEach((locale) => {
      entries.push({
        url: `${base}/${locale}${localizePath(path, locale)}`,
        lastModified,
        changeFrequency: freq,
        priority,
        alternates: {
          languages: Object.fromEntries(
            locales.map((alt) => [
              alt === "tr" ? "tr-TR" : "en-US",
              `${base}/${alt}${localizePath(path, alt)}`,
            ]),
          ),
        },
      });
    });
  };

  /**
   * Adres parcasi dile gore DEGISEN kayitlar icin (haberler).
   * pathFor her dil icin ic rotayi dondurur.
   */
  const pushPerLocale = (
    pathFor: (locale: (typeof locales)[number]) => string,
    priority: number,
    freq: MetadataRoute.Sitemap[number]["changeFrequency"],
    lastModified: Date = now,
  ) => {
    locales.forEach((locale) => {
      entries.push({
        url: `${base}/${locale}${localizePath(pathFor(locale), locale)}`,
        lastModified,
        changeFrequency: freq,
        priority,
        alternates: {
          languages: Object.fromEntries(
            locales.map((alt) => [
              alt === "tr" ? "tr-TR" : "en-US",
              `${base}/${alt}${localizePath(pathFor(alt), alt)}`,
            ]),
          ),
        },
      });
    });
  };

  staticPaths.forEach((p) => push(p.path, p.priority, p.freq));

  categories.forEach((category) => {
    push(`/${category.section}/${category.slug}`, 0.8, "weekly");
  });

  products
    .filter((product) => product.active)
    .forEach((product) => {
      push(`/urun/${product.slug}`, 0.9, "weekly", new Date(product.updatedAt));
    });

  // Blog yazilarinin govdesi hala yer tutucu metin. Gercek yazilar
  // yazildiginda asagidaki blogun yorumu kaldirilir ve
  // kesfet/blog/[slug]/layout.tsx icindeki noindex silinir.
  // blogPosts.forEach((post) => {
  //   push(`/kesfet/blog/${post.slug}`, 0.5, "monthly", new Date(post.publishedAt));
  //   (push her iki dili de uretir; blogSlug(post, locale) kullanilmali)
  // });

  events
    .filter((event) => event.active)
    .forEach((event) => {
      push(`/kesfet/etkinlikler/${event.slug}`, 0.6, "monthly", new Date(event.startDate));
    });

  // Haberin adresi dile gore degisir (baslik cevriliyor), bu yuzden her
  // dil kendi adresiyle listelenir.
  news
    .filter((item) => item.active)
    .forEach((item) => {
      pushPerLocale(
        (locale) => `/kesfet/haberler/${newsSlug(item, locale)}`,
        0.5,
        "monthly",
        new Date(item.publishedAt),
      );
    });

  return entries;
}
