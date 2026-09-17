import type { MetadataRoute } from "next";
import { getSiteUrl, isNoIndex } from "@/lib/seo";

/**
 * /robots.txt
 *
 * Demo ortaminda arama motorlarina kapatmak icin Vercel'de
 * NEXT_PUBLIC_NOINDEX=1 ortam degiskenini tanimlayin.
 */
export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  if (isNoIndex()) {
    return {
      rules: [{ userAgent: "*", disallow: "/" }],
    };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Yonetim paneli ve hesap sayfalari aramada cikmasin
        disallow: ["/tr/admin", "/en/admin", "/tr/hesabim", "/en/hesabim", "/api/"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
