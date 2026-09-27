import { localizePath, type Locale } from "@zenweld/i18n";
import { faqs, type Category, type Product } from "@zenweld/data";
import { CONTACT, OFFICES } from "@/lib/contact";

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
  if (explicit) return explicit.replace(/^https?:\/\//, "https://").replace(/\/$/, "");

  // Vercel her dagitimda VERCEL_PROJECT_PRODUCTION_URL saglamayabilir
  // (ornegin onizleme dagitimlarinda). VERCEL_URL her zaman dolu olur.
  // Ikisi de yoksa adres localhost kalir ve og:image gibi MUTLAK adres
  // isteyen alanlar disaridan erisilemez hale gelir — WhatsApp/LinkedIn
  // onizlemesi bu yuzden bos doner.
  const vercel =
    process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
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
    // Raster bicim: paylasim onizlemeleri ve arama motorlari PNG'yi her
    // zaman isler, SVG'yi her arac islemez.
    logo: absoluteUrl("/images/brand/zenweld-logo.png"),
    description: siteDescription(locale),
    // Resmi sosyal medya hesaplari — arama motorlari markayi bu hesaplarla
    // eslestirir. Tek kaynak CONTACT.social.
    sameAs: Object.values(CONTACT.social),
    contactPoint: {
      "@type": "ContactPoint",
      telephone: OFFICES[0].phones[0].replace(/\s/g, ""),
      email: CONTACT.email,
      contactType: "customer service",
      areaServed: "TR",
      availableLanguage: ["Turkish", "English"],
    },
    address: OFFICES.map((office) => ({
      "@type": "PostalAddress",
      streetAddress: office.addressLines.join(" "),
      addressLocality: office.city,
      addressCountry: "TR",
    })),
  };
}

/** <script type="application/ld+json"> icerigi icin guvenli seri hale getirme. */
export function jsonLdScript(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/* ------------------------------------------------------------------ */
/* Icerigi henuz yazilmamis sayfalar                                   */
/* ------------------------------------------------------------------ */

/**
 * Yer tutucu metin tasiyan sayfalar icin metadata.
 *
 * Bu sayfalarda (KVKK, gizlilik, iade, garanti sartlari...) su an Lorem
 * ipsum duruyor. Arama motorlarina acik birakilirsa Google bu metni
 * Zenweld'in GERCEK hukuki metni sanip indeksler; sonradan gercek metin
 * yazildiginda da eski hali bir sure aramada kalir. Bu yuzden gercek
 * icerik gelene kadar noindex isaretliyoruz.
 *
 * Gercek metin eklendiginde: ilgili sayfada bu fonksiyon yerine
 * pageMetadata() kullanin, sayfa aramaya acilir.
 */
export function placeholderPageMetadata(opts: {
  path: string;
  locale: Locale;
  title: { tr: string; en: string };
  description: { tr: string; en: string };
}) {
  return {
    title: opts.title[opts.locale],
    description: opts.description[opts.locale],
    alternates: languageAlternates(opts.path, opts.locale),
    robots: { index: false, follow: true },
  };
}

/**
 * Icerigi hazir sayfalar icin metadata.
 * Her sayfanin kendi basligi ve aciklamasi olur; aksi halde tum sayfalar
 * aramada anasayfanin basligiyla cikar.
 */
export function pageMetadata(opts: {
  path: string;
  locale: Locale;
  title: { tr: string; en: string };
  description: { tr: string; en: string };
}) {
  const title = opts.title[opts.locale];
  const description = opts.description[opts.locale];

  return {
    title,
    description,
    alternates: languageAlternates(opts.path, opts.locale),
    openGraph: {
      title,
      description,
      siteName: SITE_NAME,
      url: `/${opts.locale}${opts.path}`,
    },
    ...(isNoIndex() ? { robots: { index: false, follow: false } } : {}),
  };
}

/**
 * Anasayfadaki sik sorulan sorular icin FAQPage yapisal verisi.
 * Google bu sorulari arama sonucunda dogrudan gosterebiliyor.
 */
export function faqJsonLd(locale: Locale): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.slice(0, 8).map((item) => ({
      "@type": "Question",
      name: item.question[locale],
      acceptedAnswer: { "@type": "Answer", text: item.answer[locale] },
    })),
  };
}
