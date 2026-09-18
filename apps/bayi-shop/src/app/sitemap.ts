import type { MetadataRoute } from "next";
import { products, retailerStock } from "@zenweld/data";
import { locales, localizePath } from "@zenweld/i18n";
import { getSiteUrl } from "@/lib/seo";
import { STORE } from "@/lib/store-config";

/** Yalnizca bu magazada stokta olan urunler site haritasina girer. */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  const now = new Date();
  const inStock = new Set(
    retailerStock
      .filter((s) => s.retailerId === STORE.retailerId && s.inStock)
      .map((s) => s.productId),
  );

  const entries: MetadataRoute.Sitemap = [];

  const push = (path: string, priority: number, freq: MetadataRoute.Sitemap[number]["changeFrequency"]) => {
    locales.forEach((locale) => {
      entries.push({
        url: `${base}/${locale}${localizePath(path, locale)}`,
        lastModified: now,
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

  push("", 1, "daily");
  push("/magaza", 0.9, "daily");
  push("/hakkimizda", 0.4, "yearly");
  push("/iletisim", 0.4, "yearly");
  push("/kargo-iade", 0.4, "yearly");

  products
    .filter((p) => p.active && inStock.has(p.id))
    .forEach((p) => push(`/urun/${p.slug}`, 0.9, "daily"));

  return entries;
}
