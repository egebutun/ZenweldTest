import {
  faqs,
  isDiscountActive,
  salePriceExVat,
  type Category,
  type Product,
} from "@zenweld/data";
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

/**
 * ARAMA MOTORLARINA ACIK ALAN ADLARI
 *
 * Site YALNIZCA bu adreslerden birinde yayindayken Google'a aciktir.
 * Diger her yerde (vercel.app demo adresi, Vercel onizleme surumleri,
 * localhost) her sayfa "noindex" etiketi alir ve site haritasi
 * bildirilmez. Varsayilan kapali oldugu icin bir ayar unutulsa bile demo
 * aramaya dusmez.
 *
 * Gercek alan adi farkliysa (ornegin zenweld.com.tr) bu listeye eklenmeli.
 * Vercel disinda bir sunucuda NEXT_PUBLIC_SITE_URL bu adres olmalidir.
 */
const INDEXABLE_HOSTS = ["zenweld.com", "www.zenweld.com"];

export function isNoIndex(): boolean {
  // Onizleme surumleri gercek alan adiyla derlense de aramaya kapali kalir.
  if (process.env.VERCEL_ENV === "preview") return true;
  return !INDEXABLE_HOSTS.includes(new URL(getSiteUrl()).hostname);
}

export function absoluteUrl(path: string): string {
  if (path.startsWith("http")) return path;
  return `${getSiteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Sayfanin kalici (canonical) adresi. */
export function canonical(path: string): { canonical: string } {
  return { canonical: absoluteUrl(path) };
}

export const SITE_NAME = "ZENWELD";

export const SITE_DESCRIPTION =
  "Zenweld kaynak makineleri, plazma kesme sistemleri ve kaynak ekipmanları. Türkiye geneli yetkili bayi ağı, kurumsal teklif ve teknik destek.";

/* ------------------------------------------------------------------ */
/* Yapisal veri (JSON-LD)                                              */
/* ------------------------------------------------------------------ */

export function productJsonLd(
  product: Product,
  category?: Category,
): Record<string, unknown> {
  // Google'a musterinin odedigi fiyat bildirilir. Kampanyanin bitis tarihi
  // varsa priceValidUntil ile birlikte verilir; tarih gecince arama
  // sonucunda eski indirimli fiyat gosterilmez.
  const now = new Date();
  const priceIncVat = Math.round(salePriceExVat(product, now) * (1 + product.vatRate / 100));
  const endsAt = isDiscountActive(product, now) ? product.discount?.endsAt : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDescription,
    sku: product.sku,
    mpn: product.modelCode ?? product.sku,
    image: product.images.map((img) => absoluteUrl(img.url)),
    brand: { "@type": "Brand", name: "Zenweld" },
    category: category?.name,
    offers: {
      "@type": "Offer",
      url: absoluteUrl(`/urun/${product.slug}`),
      priceCurrency: "TRY",
      price: priceIncVat,
      ...(endsAt ? { priceValidUntil: endsAt.slice(0, 10) } : {}),
      // Zenweld deposunda her urun her zaman bulunur.
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: SITE_NAME },
    },
    additionalProperty: product.specs.map((spec) => ({
      "@type": "PropertyValue",
      name: spec.label,
      value: spec.value,
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

export function organizationJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: absoluteUrl("/"),
    // Raster bicim: paylasim onizlemeleri ve arama motorlari PNG'yi her
    // zaman isler, SVG'yi her arac islemez.
    logo: absoluteUrl("/images/brand/zenweld-logo.png"),
    description: SITE_DESCRIPTION,
    // Resmi sosyal medya hesaplari — arama motorlari markayi bu hesaplarla
    // eslestirir. Tek kaynak CONTACT.social.
    sameAs: Object.values(CONTACT.social),
    contactPoint: {
      "@type": "ContactPoint",
      telephone: OFFICES[0].phones[0].replace(/\s/g, ""),
      email: CONTACT.email,
      contactType: "customer service",
      areaServed: "TR",
      availableLanguage: ["Turkish"],
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
 * Gercek metin eklendiginde: sayfayi lib/page-meta.ts tablosuna ekleyip
 * pageMetadataFor() kullanin, sayfa aramaya acilir.
 */
export function placeholderPageMetadata(opts: { path: string; title: string; description: string }) {
  return {
    title: opts.title,
    description: opts.description,
    alternates: canonical(opts.path),
    robots: { index: false, follow: true },
  };
}

/**
 * Anasayfadaki sik sorulan sorular icin FAQPage yapisal verisi.
 * Google bu sorulari arama sonucunda dogrudan gosterebiliyor.
 */
export function faqJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.slice(0, 8).map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}
