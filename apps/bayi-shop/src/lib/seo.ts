import { localizePath, type Locale } from "@zenweld/i18n";
import type { Product, RetailerStock } from "@zenweld/data";
import { shopPrice } from "./pricing";
import { STORE } from "./store-config";

/** Magaza adresi: NEXT_PUBLIC_SITE_URL > Vercel > yerel gelistirme */
export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/^https?:\/\//, "https://").replace(/\/$/, "");
  // VERCEL_URL yedegi icin bkz. zenweld-web/src/lib/seo.ts
  const vercel =
    process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  if (vercel) return `https://${vercel.replace(/\/$/, "")}`;
  return "http://localhost:3001";
}

export function isNoIndex(): boolean {
  return process.env.NEXT_PUBLIC_NOINDEX === "1";
}

export function absoluteUrl(path: string): string {
  if (path.startsWith("http")) return path;
  return `${getSiteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

export function languageAlternates(path: string, locale: Locale = "tr") {
  const clean = path.startsWith("/") ? path : `/${path}`;
  // Her dil kendi adres yazimini kullanir: /tr/urun/... ve /en/products/...
  const forLocale = (target: Locale) =>
    absoluteUrl(`/${target}${clean === "/" ? "" : localizePath(clean, target)}`);

  return {
    canonical: forLocale(locale),
    languages: {
      "tr-TR": forLocale("tr"),
      "en-US": forLocale("en"),
      "x-default": forLocale("tr"),
    },
  };
}

/**
 * Magaza urunu icin yapisal veri.
 * Burada gercek satis yapildigi icin offers bilgisi stok kaydindan gelir.
 */
export function shopProductJsonLd(
  product: Product,
  stock: RetailerStock | undefined,
  locale: Locale,
): Record<string, unknown> {
  // Musterinin odedigi fiyat: magaza fiyati + bayinin gecerli kampanyasi.
  const now = new Date();
  const { sale: price, endsAt } = shopPrice(product, stock, now);

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDescription[locale],
    sku: product.sku,
    mpn: product.modelCode ?? product.sku,
    image: product.images.map((img) => absoluteUrl(img.url)),
    brand: { "@type": "Brand", name: "Zenweld" },
    offers: {
      "@type": "Offer",
      // Dile gore cevrilmis adres (/en/products/...).
      url: ogUrl(`/urun/${product.slug}`, locale),
      priceCurrency: "TRY",
      price,
      ...(endsAt ? { priceValidUntil: endsAt.slice(0, 10) } : {}),
      availability: stock?.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: STORE.legalName },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: {
          "@type": "MonetaryAmount",
          value: price >= STORE.freeShippingOver ? 0 : STORE.shippingFee,
          currency: "TRY",
        },
        shippingDestination: {
          "@type": "DefinedRegion",
          addressCountry: "TR",
        },
      },
    },
  };
}

export function storeJsonLd(locale: Locale): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Store",
    name: STORE.name,
    legalName: STORE.legalName,
    url: absoluteUrl(`/${locale}`),
    telephone: STORE.phone,
    email: STORE.email,
    address: { "@type": "PostalAddress", streetAddress: STORE.address, addressCountry: "TR" },
    openingHours: "Mo-Fr 08:00-19:00, Sa 09:00-17:00",
    description:
      locale === "tr"
        ? "Yetkili Zenweld bayisi. Kaynak makineleri ve ekipmanlarını online satın alın."
        : "Authorised Zenweld dealer. Buy welding machines and equipment online.",
  };
}

export function jsonLdScript(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/**
 * Adres parcasi dile gore DEGISEN sayfalar icin alternates.
 * (Blog yazilari: /tr/kesfet/blog/<tr-slug> ve /en/explore/blog/<en-slug>)
 *
 * pathFor, her dil icin IC rotayi dondurur; cevrim yine localizePath ile
 * yapilir, yalnizca slug disaridan gelir.
 */
export function languageAlternatesFor(
  pathFor: (locale: Locale) => string,
  locale: Locale = "tr",
): { canonical: string; languages: Record<string, string> } {
  const forLocale = (target: Locale) =>
    absoluteUrl(`/${target}${localizePath(pathFor(target), target)}`);

  return {
    canonical: forLocale(locale),
    languages: {
      "tr-TR": forLocale("tr"),
      "en-US": forLocale("en"),
      "x-default": forLocale("tr"),
    },
  };
}

/**
 * og:url icin MUTLAK ve DILE GORE CEVRILMIS adres.
 *
 * Onceden `/${lang}/kesfet/haberler/...` gibi ic rota yaziliyordu;
 * Ingilizce sayfalar paylasildiginda og:url Turkce adresi gosteriyordu
 * (canonical dogruydu, yalnizca og:url yanlisti). Bu yardimci ayni
 * cevrimi canonical ile birlikte yapar.
 */
export function ogUrl(path: string, locale: Locale = "tr"): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return absoluteUrl(`/${locale}${clean === "/" ? "" : localizePath(clean, locale)}`);
}
