import type { MetadataRoute } from "next";
import { getSiteUrl, isNoIndex } from "@/lib/seo";

/**
 * /robots.txt
 *
 * NEXT_PUBLIC_NOINDEX=1 iken sayfalar taramaya ACIK kalir ama her sayfaya
 * <meta name="robots" content="noindex"> eklenir. Sebep: robots.txt ile
 * taramayi engellersek Google sayfayi okuyamaz, dolayisiyla noindex etiketini
 * de goremez ve URL'yi baska kaynaklardan indeksleyebilir. Indekslemeyi
 * durdurmanin dogru yolu, taramaya izin verip noindex etiketi koymaktir.
 * Bu durumda yalnizca site haritasi bildirilmez.
 */
export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Yonetim paneli ve hesap sayfalari aramada cikmasin
        disallow: ["/tr/admin", "/en/admin", "/tr/hesabim", "/en/hesabim", "/api/"],
      },
    ],
    ...(isNoIndex() ? {} : { sitemap: `${siteUrl}/sitemap.xml` }),
    host: siteUrl,
  };
}
