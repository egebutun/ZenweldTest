import type { Metadata } from "next";
import {
  RETURN_WINDOW_DAYS,
  pagePath,
  pagedTitle,
  HOME_FAQ_COUNT,
  isDiscountActive,
  isInWarehouse,
  productBrand,
  productOptionsView,
  salePriceExVat,
  variantPriceExVat,
  videoDescription,
  videoPoster,
  videoTitle,
  youtubeThumbnail,
  type BlogPost,
  type Category,
  type CategoryGroup,
  type CompanySettings,
  type FaqItem,
  type NewsItem,
  type OptionDefinition,
  type Product,
  type SeoFields,
  type SiteVideo,
  type ShopSettings,
  type ZenweldEvent,
} from "@zenweld/data";
import { socialLinks } from "@/lib/contact";

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

/**
 * Sayfali listenin 2. ve sonraki sayfasi (KARARLAR K-124): baslik
 * " — Sayfa <n>" alir, asil adres (canonical) sayfanin kendi adresidir
 * (1. sayfayi gostermez; Google'in onerisi), paylasim onizlemesi de oyle.
 */
export function pagedMetadata(meta: Metadata, basePath: string, page: number): Metadata {
  if (page <= 1) return meta;
  const raw = meta.title;
  const base = typeof raw === "string" ? raw : raw && "absolute" in raw ? raw.absolute : SITE_NAME;
  const title = pagedTitle(base, page);
  const path = pagePath(basePath, page);
  return {
    ...meta,
    title: { absolute: title },
    alternates: canonical(path),
    ...(meta.openGraph ? { openGraph: { ...meta.openGraph, title, url: absoluteUrl(path) } } : {}),
    ...(meta.twitter ? { twitter: { ...meta.twitter, title } } : {}),
  };
}

export const SITE_NAME = "ZENWELD";

export const SITE_DESCRIPTION =
  "Zenweld kaynak makineleri, plazma kesme sistemleri ve kaynak ekipmanları. Türkiye geneli yetkili bayi ağı, kurumsal teklif ve teknik destek.";

/* ------------------------------------------------------------------ */
/* Yapisal veri (JSON-LD)                                              */
/* ------------------------------------------------------------------ */

/**
 * Urunun arama motoru icin yapisal verisi.
 *
 * - now: fiyat ve kampanya hesabinin ani (sayfanin hazirlandigi an).
 * - inStock: Zenweld deposunda stok var mi (K-82); yoksa "stokta yok"
 *   bildirilir, sitede de urun sepete eklenmez.
 */
export function productJsonLd(
  product: Product,
  category: Category | undefined,
  {
    now,
    inStock,
    stock,
    definitions = [],
    shop,
    ratings = [],
  }: {
    now: Date;
    /** Urun stokta mi (secenekli urunde herhangi bir secenek) */
    inStock: boolean;
    /** Depo stogu (SAP kalem kodu -> adet); seceneklerin stogu buradan */
    stock?: ReadonlyMap<string, number>;
    /** Secenek tanimlari; secenekli urunde her secenek ayri gider */
    definitions?: OptionDefinition[];
    /** Kargo ucreti ve ucretsiz kargo siniri (Magaza Ayarlari); yoksa kargo bilgisi gonderilmez */
    shop?: Pick<ShopSettings, "shippingFee" | "freeShippingThreshold">;
    /** Urunun onayli yorumlarinin puanlari (1-5); bossa yildiz gonderilmez */
    ratings?: number[];
  },
): Record<string, unknown> {
  const endsAt = isDiscountActive(product, now) ? product.discount?.endsAt : undefined;
  const url = absoluteUrl(`/urun/${product.slug}`);

  // Google'a musterinin odedigi fiyat bildirilir (KDV dahil, kampanyali).
  // Kampanyanin bitis tarihi varsa priceValidUntil ile birlikte verilir;
  // tarih gecince arama sonucunda eski indirimli fiyat gosterilmez.
  const offer = (priceExVat: number, available: boolean, offerUrl: string) => {
    const price = Math.round(salePriceExVat({ ...product, priceExVat }, now) * (1 + product.vatRate / 100));
    return {
      "@type": "Offer",
      url: offerUrl,
      priceCurrency: "TRY",
      price,
      ...(endsAt ? { priceValidUntil: endsAt.slice(0, 10) } : {}),
      availability: available ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: SITE_NAME },
      ...(shop ? { shippingDetails: shippingJsonLd(price, shop) } : {}),
      hasMerchantReturnPolicy: RETURN_POLICY,
    };
  };

  const common = {
    "@context": "https://schema.org",
    name: product.name,
    description: productDescription(product),
    image: product.images.map((img) => absoluteUrl(img.url)),
    brand: { "@type": "Brand", name: productBrand(product) },
    category: category?.name,
    additionalProperty: product.specs.map((spec) => ({
      "@type": "PropertyValue",
      name: spec.label,
      value: spec.value,
    })),
    ...(ratings.length > 0 ? { aggregateRating: ratingJsonLd(ratings) } : {}),
  };

  // Secenekli urun (ornegin su sogutmali / 8 m torc): urun grubu; her
  // secenek kendi kodu, fiyati, stogu ve secenekli linkiyle ayri urun olarak
  // gider (sitede ayni sayfa, ?secenek= ile acilir).
  const view = productOptionsView(product, definitions);
  if (view) {
    return {
      ...common,
      "@type": "ProductGroup",
      url,
      productGroupID: product.sku,
      hasVariant: view.variants.map((v) => ({
        "@type": "Product",
        name: `${product.name} — ${v.label}`,
        sku: v.sku,
        ...(v.image ? { image: [absoluteUrl(v.image)] } : {}),
        additionalProperty: v.parts.map((part) => ({ "@type": "PropertyValue", name: part.group, value: part.value })),
        offers: offer(
          variantPriceExVat(product, v),
          stock ? isInWarehouse(product, stock, v.id) : inStock,
          `${url}?secenek=${encodeURIComponent(v.id)}`,
        ),
      })),
    };
  }

  return {
    ...common,
    "@type": "Product",
    sku: product.sku,
    mpn: product.modelCode ?? product.sku,
    offers: offer(product.priceExVat, inStock, url),
  };
}

/**
 * Urunun Google'a giden aciklamasi: kisa aciklama, one cikan ozellikler ve
 * uzun aciklama (bicim isaretleri ve HTML temizlenir; en cok 5.000 karakter).
 */
function productDescription(product: Product): string {
  const plain = (text: string) =>
    text
      .replace(/^\s*-\s+/gm, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/(^|\s)#{1,6}\s+/g, "$1")
      .replace(/\*\*/g, "")
      .replace(/\s+/g, " ")
      .trim();
  const highlights = product.highlights.filter((h) => h.trim()).join(". ");
  return [product.shortDescription, highlights, product.description]
    .map((part) => plain(part ?? ""))
    .filter(Boolean)
    .join(" ")
    .slice(0, 5000);
}

/**
 * Kargo (Google Alisveris): Turkiye'ye gonderim; urunun fiyati ucretsiz
 * kargo sinirina ulasiyorsa ucret 0, degilse Magaza Ayarlari'ndaki kargo
 * ucreti (sepetteki hesapla ayni kural; docs/IS-KURALLARI.md › 4).
 * Teslim suresi sahibinden ogrenilince eklenecek (docs/YAPILACAKLAR.md › SEO).
 */
function shippingJsonLd(priceIncVat: number, shop: Pick<ShopSettings, "shippingFee" | "freeShippingThreshold">) {
  return {
    "@type": "OfferShippingDetails",
    shippingRate: {
      "@type": "MonetaryAmount",
      value: priceIncVat >= shop.freeShippingThreshold ? 0 : shop.shippingFee,
      currency: "TRY",
    },
    shippingDestination: { "@type": "DefinedRegion", addressCountry: "TR" },
  };
}

/**
 * Iade (cayma) politikasi: Turkiye, teslimden itibaren 14 gun, kargoyla
 * (docs/IS-KURALLARI.md › 7). Iade kargo ucretini kimin odedigi sahibinden
 * ogrenilince eklenecek (docs/YAPILACAKLAR.md › SEO).
 */
const RETURN_POLICY = {
  "@type": "MerchantReturnPolicy",
  applicableCountry: "TR",
  returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
  merchantReturnDays: RETURN_WINDOW_DAYS,
  returnMethod: "https://schema.org/ReturnByMail",
};

/** Yildiz: onayli yorumlarin ortalamasi (bir ondalik) ve sayisi; sitede gorunen ortalamayla ayni. */
function ratingJsonLd(ratings: number[]) {
  const average = Math.round((ratings.reduce((sum, r) => sum + r, 0) / ratings.length) * 10) / 10;
  return { "@type": "AggregateRating", ratingValue: average, reviewCount: ratings.length, bestRating: 5, worstRating: 1 };
}

/**
 * Blog yazisinin yapisal verisi (BlogPosting): baslik, ozet, tarih, gorsel,
 * yazar ve yayinci. Haberlerdeki NewsArticle'in karsiligi.
 */
export function blogPostingJsonLd(post: BlogPost): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt ?? post.publishedAt,
    inLanguage: "tr-TR",
    ...(post.coverUrl ? { image: [absoluteUrl(post.coverUrl)] } : {}),
    mainEntityOfPage: { "@type": "WebPage", "@id": absoluteUrl(`/blog/${post.slug}`) },
    author: { "@type": "Organization", name: post.author || SITE_NAME },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: { "@type": "ImageObject", url: absoluteUrl("/images/brand/zenweld-logo.png") },
    },
  };
}

/**
 * Sayfanin arama motoru bilgileri: panelin SEO sekmesinde girilen alanlar,
 * bossa otomatik deger. Sayfanin generateMetadata'si ve paneldeki Google
 * onizlemesi ayni sonucu kullanir.
 */
export function pageSeo(seo: SeoFields | undefined, autoTitle: string, autoDescription: string) {
  return {
    /** Sekmede ve aramada gorunen tam baslik */
    title: seo?.title?.trim() || `${autoTitle} | ${SITE_NAME}`,
    description: seo?.description?.trim() || autoDescription,
    keywords: seo?.keywords ?? [],
  };
}

export type PageSeo = ReturnType<typeof pageSeo>;

/** Paylasim karti: 1200x630 markali gorsel (scripts/make-brand-images.mjs). */
export const OG_COVER = { url: "/images/brand/og-cover.png", width: 1200, height: 630, alt: SITE_NAME };

/**
 * WhatsApp, LinkedIn (Open Graph) ve X (Twitter) onizlemesi. Next ust
 * duzeyin openGraph/twitter nesnesini birlestirmez, degistirir; bu yuzden
 * her sayfa gorseli ve site adini kendisi vermeli, yoksa onizlemede gorsel
 * cikmaz ve X'te ana sayfanin basligi gorunur.
 */
export function socialMetadata({
  title,
  description,
  path,
  image,
}: {
  title: string;
  description: string;
  path: string;
  /** Yoksa markali kart */
  image?: { url: string; alt?: string };
}): Pick<Metadata, "openGraph" | "twitter"> {
  const picture = image ?? OG_COVER;
  return {
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: "tr_TR",
      title,
      description,
      url: absoluteUrl(path),
      images: [picture],
    },
    twitter: { card: "summary_large_image", title, description, images: [picture.url] },
  };
}

/** generateMetadata icin baslik, aciklama ve keywords etiketi. */
export function seoMetadata(seo: PageSeo): Pick<Metadata, "title" | "description" | "keywords"> {
  return {
    // Baslik tam haliyle yazilir; ust sayfanin baslik sablonuna bagli kalmaz
    // (ornegin /blog sayfasi sablonu tasimiyor).
    title: { absolute: seo.title },
    description: seo.description,
    keywords: seo.keywords.length > 0 ? seo.keywords : undefined,
  };
}

/**
 * Urun sayfasinin otomatik basligi "<Urun adi> | ZENWELD": urun adi model ve
 * turu icerir (KARARLAR K-71); kategori adi eklenmez, baslik Google'da
 * kesilmesin.
 */
export const productSeo = (product: Product) => pageSeo(product.seo, product.name, product.shortDescription);

export const blogPostSeo = (post: BlogPost) => pageSeo(post.seo, post.title, post.excerpt);

export const newsSeo = (item: NewsItem) => pageSeo(item.seo, item.title, item.summary);

export const eventSeo = (event: ZenweldEvent) => pageSeo(event.seo, event.title, event.summary);

export const categorySeo = (category: Category) => pageSeo(category.seo, category.name, category.description);

/** `description`: grup sayfasindaki aciklama (lib/catalog.ts groupDescription). */
export const groupSeo = (group: CategoryGroup, description: string) => pageSeo(group.seo, group.name, description);

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

/** Arama motorlarina kurulus bilgisi; sirket bilgileri Magaza Ayarlari > Sirket ve Iletisim'den (K-105). */
/**
 * Site adi: Google arama sonucunda adresin ustunde "ZENWELD" yazsin
 * (adres yerine marka). Anasayfada bir kez verilir.
 */
export function websiteJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    alternateName: ["Zenweld", "zenweld.com"],
    url: absoluteUrl("/"),
  };
}

/** Etkinlik ulkesinin Google'in bekledigi kodu (ISO 3166-1); bilinmeyen ad oldugu gibi kalir. */
const COUNTRY_CODES: Record<string, string> = {
  "Türkiye": "TR",
  "Birleşik Arap Emirlikleri": "AE",
  "Suudi Arabistan": "SA",
  "Almanya": "DE",
  "Irak": "IQ",
  "Azerbaycan": "AZ",
};
export const countryCode = (country: string) => COUNTRY_CODES[country.trim()] ?? country;

/**
 * Etkinlik (fuar) yapisal verisi. Zenweld fuarlarin duzenleyicisi degil,
 * katilimcisidir; bu yuzden "organizer" verilmez. Gorsel: etkinligin
 * fotograflari, yoksa logosu.
 */
export function eventJsonLd(event: ZenweldEvent): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.summary,
    startDate: event.startDate,
    endDate: event.endDate,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    image: (event.images.length ? event.images : [event.logoUrl]).filter(Boolean).map((i) => absoluteUrl(i)),
    url: absoluteUrl(`/etkinlikler/${event.slug}`),
    location: {
      "@type": "Place",
      name: event.venue,
      address: {
        "@type": "PostalAddress",
        addressLocality: event.city,
        addressCountry: countryCode(event.country),
      },
    },
  };
}

export function organizationJsonLd(company: CompanySettings): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    // Ticari unvan (Magaza Ayarlari > Sirket ve Iletisim); marka adi "name"de.
    ...(company.legalName?.trim() ? { legalName: company.legalName.trim() } : {}),
    url: absoluteUrl("/"),
    // Raster bicim: paylasim onizlemeleri ve arama motorlari PNG'yi her
    // zaman isler, SVG'yi her arac islemez.
    logo: absoluteUrl("/images/brand/zenweld-logo.png"),
    description: SITE_DESCRIPTION,
    // Resmi sosyal medya hesaplari — arama motorlari markayi bu hesaplarla
    // eslestirir.
    sameAs: socialLinks(company).map((s) => s.url),
    contactPoint: {
      "@type": "ContactPoint",
      telephone: company.phone.replace(/\s/g, ""),
      email: company.email,
      contactType: "customer service",
      areaServed: "TR",
      availableLanguage: ["Turkish"],
    },
    address: company.offices.map((office) => ({
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
 * Taslak metin tasiyan sayfalar icin metadata.
 *
 * Bu sayfalarda (KVKK, gizlilik, iade, garanti sartlari...) su an hukuk
 * danismaninin yazmadigi taslak metinler duruyor. Arama motorlarina acik
 * birakilirsa Google bu metni Zenweld'in GERCEK hukuki metni sanip
 * indeksler; sonradan gercek metin yazildiginda da eski hali bir sure
 * aramada kalir. Bu yuzden gercek icerik gelene kadar noindex isaretliyoruz.
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
/** Anasayfadaki sorular (sitede gorunenlerle ayni, HOME_FAQ_COUNT). */
export function faqJsonLd(faqs: FaqItem[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.slice(0, HOME_FAQ_COUNT).map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

/* ------------------------------ Videolar (KARARLAR K-123, K-125) ------------------------------ */

/** ISO 8601 sure ("PT1M5S"). */
const isoDuration = (seconds: number) => `PT${Math.floor(seconds / 60) ? `${Math.floor(seconds / 60)}M` : ""}${seconds % 60}S`;

/**
 * Video icin VideoObject yapisal verisi: basligi (yoksa urunun adi),
 * aciklamasi, kapagi, siteye eklendigi tarih; kendi videomuzda dosyanin
 * adresi (1080p) ve suresi, YouTube videosunda cerezsiz gomme adresi.
 * Google videoyu bu sayfanin videosu olarak gosterebilir.
 */
export function videoJsonLd(video: SiteVideo, product?: Product): Record<string, unknown> {
  const own = video.source === "file";
  const thumbnail = videoPoster(video) ?? (video.youtubeId ? youtubeThumbnail(video.youtubeId) : undefined);
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: videoTitle(video, product),
    description: videoDescription(video, product),
    ...(thumbnail && { thumbnailUrl: [absoluteUrl(thumbnail)] }),
    uploadDate: video.createdAt,
    ...(own && video.file?.hd ? { contentUrl: absoluteUrl(video.file.hd) } : {}),
    ...(own && video.file?.durationSeconds ? { duration: isoDuration(video.file.durationSeconds) } : {}),
    ...(!own && video.youtubeId ? { embedUrl: `https://www.youtube-nocookie.com/embed/${video.youtubeId}` } : {}),
    publisher: { "@type": "Organization", name: SITE_NAME, logo: { "@type": "ImageObject", url: absoluteUrl("/images/brand/zenweld-logo.png") } },
  };
}
