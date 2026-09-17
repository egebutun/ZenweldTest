import type { Locale } from "@zenweld/i18n";
import type { Category, Product } from "@zenweld/data";

/**
 * SEO yardimcilari.
 *
 * Site adresi sirasiyla su kaynaklardan okunur:
 *   1. NEXT_PUBLIC_SITE_URL          (elle tanimlanirsa)
 *   2. VERCEL_PROJECT_PRODUCTION_URL (Vercel otomatik saglar)
 *   3. http://localhost:3000         (yerel gelistirme)
 */
export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel.replace(/\/$/, "")}`;

  return "http://localhost:3000";
}

/** Demo ortaminda arama motorlarina kapatmak icin: NEXT_PUBLIC_NOINDEX=1 */
export function isNoIndex(): boolean {
  return process.env.NEXT_PUBLIC_NOINDEX === "1";
}

export function absoluteUrl(path: string): string {
  if (path.startsWith("http")) return path;
  return `${getSiteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Ayni sayfanin TR ve EN adresleri.
 *
 * canonical: icinde bulunulan dilin adresi (dil on ekiyle birlikte)
 * languages: hreflang etiketleri
 */
export function languageAlternates(
  path: string,
  locale: Locale = "tr",
): {
  canonical: string;
  languages: Record<string, string>;
} {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return {
    canonical: absoluteUrl(`/${locale}${clean === "/" ? "" : clean}`),
    languages: {
      "tr-TR": absoluteUrl(`/tr${clean === "/" ? "" : clean}`),
      "en-US": absoluteUrl(`/en${clean === "/" ? "" : clean}`),
      "x-default": absoluteUrl(`/tr${clean === "/" ? "" : clean}`),
    },
  };
}

export const SITE_NAME = "ZENWELD";

const DESCRIPTIONS: Record<Locale, string> = {
  tr: "Zenweld kaynak makineleri, plazma kesme sistemleri ve kaynak ekipmanları. Türkiye geneli yetkili bayi ağı, kurumsal teklif ve teknik destek.",
  en: "Zenweld welding machines, plasma cutting systems and welding equipment. Authorised dealer network across Türkiye, corporate quotes and technical support.",
};

export function siteDescription(locale: Locale): string {
  return DESCRIPTIONS[locale];
}

/* ------------------------------------------------------------------ */
/* Yapisal veri (JSON-LD)                                              */
/* ------------------------------------------------------------------ */

export function productJsonLd(
  product: Product,
  locale: Locale,
  category?: Category,
): Record<string, unknown> {
  const priceIncVat = Math.round(product.priceExVat * (1 + product.vatRate / 100));

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDescription[locale],
    sku: product.sku,
    mpn: product.modelCode ?? product.sku,
    image: product.images.map((img) => absoluteUrl(img.url)),
    brand: { "@type": "Brand", name: "Zenweld" },
    category: category?.name[locale],
    offers: {
      "@type": "Offer",
      url: absoluteUrl(`/${locale}/urun/${product.slug}`),
      priceCurrency: "TRY",
      price: priceIncVat,
      availability: product.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: SITE_NAME },
    },
    additionalProperty: product.specs.map((spec) => ({
      "@type": "PropertyValue",
      name: spec.label[locale],
      value: spec.value[locale],
    })),
  };
}

export function breadcrumbJsonLd(
  items: { name: string; path: string }[],
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function organizationJsonLd(locale: Locale): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: absoluteUrl(`/${locale}`),
    logo: absoluteUrl("/images/products/zenweld-urun.png"),
    description: siteDescription(locale),
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+90-850-000-00-00",
      contactType: "customer service",
      areaServed: "TR",
      availableLanguage: ["Turkish", "English"],
    },
  };
}

/** <script type="application/ld+json"> icerigi icin guvenli seri hale getirme. */
export function jsonLdScript(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
