import type { MetadataRoute } from "next";
import { getSiteUrl, isNoIndex } from "@/lib/seo";

/**
 * /robots.txt
 *
 * Gizli tutulacak sayfalar (demo sitenin tamami, yonetim paneli, hesap,
 * giris vb.) robots.txt ile ENGELLENMEZ; bunun yerine "noindex" etiketi
 * tasir (bkz. isNoIndex, sayfa layout'lari, next.config). Sebep: robots.txt
 * taramayi engellerse Google sayfayi okuyamaz, noindex etiketini de goremez
 * ve adresi baska kaynaklardan bulursa yine listeleyebilir. Ayrica
 * robots.txt herkese acik oldugu icin panel adresini ilan etmemis oluruz.
 *
 * Site aramaya kapaliyken (isNoIndex) site haritasi da bildirilmez.
 */
export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // API uclari sayfa degil; taranmalarina gerek yok.
        disallow: ["/api/"],
      },
    ],
    ...(isNoIndex() ? {} : { sitemap: `${siteUrl}/sitemap.xml` }),
    host: siteUrl,
  };
}
