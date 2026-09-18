import type { MetadataRoute } from "next";
import { getSiteUrl, isNoIndex } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/tr/sepet",
          "/en/cart",
          "/tr/odeme",
          "/en/checkout",
          "/tr/hesabim",
          "/en/account",
        ],
      },
    ],
    ...(isNoIndex() ? {} : { sitemap: `${siteUrl}/sitemap.xml` }),
    host: siteUrl,
  };
}
