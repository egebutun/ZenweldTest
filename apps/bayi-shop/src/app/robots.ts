import type { MetadataRoute } from "next";
import { getSiteUrl, isNoIndex } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/tr/sepet", "/en/sepet", "/tr/odeme", "/en/odeme", "/tr/hesabim", "/en/hesabim"],
      },
    ],
    ...(isNoIndex() ? {} : { sitemap: `${siteUrl}/sitemap.xml` }),
    host: siteUrl,
  };
}
