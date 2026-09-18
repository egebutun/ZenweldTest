import type { MetadataRoute } from "next";
import { categories, products, blogPosts } from "@zenweld/data";
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
    { path: "/nereden-alabilirim", priority: 0.9, freq: "monthly" },
    { path: "/teklif-al", priority: 0.9, freq: "monthly" },
    { path: "/kesfet/hakkimizda", priority: 0.6, freq: "yearly" },
    { path: "/kesfet/welders-club", priority: 0.6, freq: "monthly" },
    { path: "/kesfet/garanti-sorgula", priority: 0.6, freq: "yearly" },
    { path: "/kesfet/garanti-kayit", priority: 0.6, freq: "yearly" },
    { path: "/kesfet/blog", priority: 0.6, freq: "weekly" },
    { path: "/kesfet/urun-secici", priority: 0.6, freq: "monthly" },
    { path: "/kesfet/msds", priority: 0.4, freq: "yearly" },
    { path: "/kesfet/parti-sertifikalari", priority: 0.4, freq: "yearly" },
    { path: "/destek", priority: 0.5, freq: "monthly" },
    { path: "/destek/sss", priority: 0.5, freq: "monthly" },
    { path: "/destek/iletisim", priority: 0.5, freq: "yearly" },
    { path: "/destek/servis-agi", priority: 0.5, freq: "monthly" },
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

  staticPaths.forEach((p) => push(p.path, p.priority, p.freq));

  categories.forEach((category) => {
    push(`/${category.section}/${category.slug}`, 0.8, "weekly");
  });

  products
    .filter((product) => product.active)
    .forEach((product) => {
      push(`/urun/${product.slug}`, 0.9, "weekly", new Date(product.updatedAt));
    });

  blogPosts.forEach((post) => {
    push(`/kesfet/blog/${post.slug}`, 0.5, "monthly", new Date(post.publishedAt));
  });

  return entries;
}
