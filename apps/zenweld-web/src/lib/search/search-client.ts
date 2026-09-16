"use client";

import MiniSearch, { type SearchResult as MiniSearchResult } from "minisearch";
import type { Locale } from "@zenweld/i18n";
import type { ZenweldDatabase } from "@zenweld/data";
import { trNormalize, trTokenize } from "./tr-normalize";
import { expandQuery } from "./synonyms";

/**
 * ARAMA MOTORU
 *
 * Gercek Elasticsearch bir sunucu gerektirdigi icin (bu projede backend yok)
 * tarayicida calisan MiniSearch kullaniyoruz. MiniSearch, Elasticsearch ile
 * ayni BM25 skorlama algoritmasini uygular; ustune:
 *   - yazim hatasi toleransi (fuzzy / edit distance)
 *   - on-ek eslesmesi (prefix)
 *   - alan agirliklandirma (urun adi > kategori > aciklama)
 *   - Turkce karakter normalizasyonu
 *   - esanlamli sozlugu ile sorgu genisletme
 * ekliyoruz.
 *
 * ILERIDE: Bu dosyadaki search() imzasini koruyarak govdeyi gercek bir
 * Elasticsearch/Typesense/Algolia cagrisiyla degistirmek yeterlidir.
 */

export type SearchDocType = "product" | "category" | "page" | "article";

export interface SearchDoc {
  id: string;
  type: SearchDocType;
  title: string;
  subtitle: string;
  body: string;
  sku: string;
  href: string;
  image?: string;
  price?: number;
  inStock?: boolean;
}

export interface SearchHit extends SearchDoc {
  score: number;
}

const STATIC_PAGES: { id: string; tr: string; en: string; href: string }[] = [
  { id: "page-teklif", tr: "Teklif Al kurumsal vadeli çek ödeme", en: "Request a Quote business deferred cheque payment", href: "/teklif-al" },
  { id: "page-bayi", tr: "Nereden Alabilirim bayi bul harita satış noktası", en: "Where to Buy find dealer map store locator", href: "/nereden-alabilirim" },
  { id: "page-garanti-sorgula", tr: "Garanti Sorgula seri numarası", en: "Check Your Warranty serial number", href: "/kesfet/garanti-sorgula" },
  { id: "page-garanti-kayit", tr: "Garanti Kaydı uzatma kayıt", en: "Register Your Warranty extension", href: "/kesfet/garanti-kayit" },
  { id: "page-club", tr: "Welders Club topluluk üyelik", en: "Welders Club community membership", href: "/kesfet/welders-club" },
  { id: "page-msds", tr: "MSDS malzeme güvenlik bilgi formu", en: "MSDS material safety data sheet", href: "/kesfet/msds" },
  { id: "page-sertifika", tr: "Parti Sertifikaları uygunluk belgesi", en: "Batch Certificates compliance", href: "/kesfet/parti-sertifikalari" },
  { id: "page-secici", tr: "Ürün Seçici hangi makine bana uygun", en: "Product Selector which machine suits me", href: "/kesfet/urun-secici" },
  { id: "page-destek", tr: "Destek yardım servis iletişim", en: "Support help service contact", href: "/destek" },
  { id: "page-sss", tr: "Sık Sorulan Sorular SSS", en: "Frequently Asked Questions FAQ", href: "/destek/sss" },
  { id: "page-hakkimizda", tr: "Hakkımızda kurumsal şirket", en: "About Us company", href: "/kesfet/hakkimizda" },
  { id: "page-blog", tr: "Blog yazılar rehber ipuçları", en: "Blog articles guide tips", href: "/kesfet/blog" },
];

export function buildDocuments(db: ZenweldDatabase, locale: Locale): SearchDoc[] {
  const docs: SearchDoc[] = [];

  db.products
    .filter((p) => p.active)
    .forEach((p) => {
      const category = db.categories.find((c) => c.slug === p.categorySlug);
      docs.push({
        id: `product:${p.id}`,
        type: "product",
        title: p.name,
        subtitle: category ? category.name[locale] : "",
        body: [
          p.shortDescription[locale],
          p.description[locale],
          p.processes.join(" "),
          p.modelCode ?? "",
          p.specs.map((s) => `${s.label[locale]} ${s.value[locale]}`).join(" "),
        ].join(" "),
        sku: p.sku,
        href: `/urun/${p.slug}`,
        image: p.images[0]?.url,
        price: p.priceExVat,
        inStock: p.inStock,
      });
    });

  db.categories.forEach((c) => {
    docs.push({
      id: `category:${c.id}`,
      type: "category",
      title: c.name[locale],
      subtitle: c.description[locale],
      body: `${c.name.tr} ${c.name.en} ${c.description[locale]} ${c.group}`,
      sku: "",
      href: `/${c.section}/${c.slug}`,
    });
  });

  db.blogPosts.forEach((b) => {
    docs.push({
      id: `article:${b.id}`,
      type: "article",
      title: b.title[locale],
      subtitle: b.category[locale],
      body: b.excerpt[locale],
      sku: "",
      href: `/kesfet/blog/${b.slug}`,
      image: b.coverUrl,
    });
  });

  STATIC_PAGES.forEach((p) => {
    docs.push({
      id: p.id,
      type: "page",
      title: (locale === "tr" ? p.tr : p.en).split(" ").slice(0, 3).join(" "),
      subtitle: locale === "tr" ? p.tr : p.en,
      body: `${p.tr} ${p.en}`,
      sku: "",
      href: p.href,
    });
  });

  return docs;
}

export function createIndex(docs: SearchDoc[]): MiniSearch<SearchDoc> {
  const mini = new MiniSearch<SearchDoc>({
    idField: "id",
    fields: ["title", "sku", "subtitle", "body"],
    storeFields: ["id", "type", "title", "subtitle", "href", "image", "price", "inStock", "sku"],
    processTerm: (term) => {
      const normalized = trNormalize(term);
      return normalized.length > 1 || /\d/.test(normalized) ? normalized : null;
    },
    tokenize: (text) => trTokenize(text),
    searchOptions: {
      boost: { title: 4, sku: 3, subtitle: 2, body: 1 },
      prefix: true,
      fuzzy: 0.2,
      combineWith: "OR",
    },
  });
  mini.addAll(docs);
  return mini;
}

export interface SearchOptions {
  limit?: number;
  types?: SearchDocType[];
}

export function search(
  index: MiniSearch<SearchDoc>,
  rawQuery: string,
  options: SearchOptions = {},
): SearchHit[] {
  const normalized = trNormalize(rawQuery);
  if (normalized.length === 0) return [];

  const expanded = expandQuery(normalized).join(" ");

  const results = index.search(expanded, {
    prefix: true,
    fuzzy: (term) => (term.length <= 3 ? 0 : 0.25),
    boost: { title: 4, sku: 3, subtitle: 2, body: 1 },
    combineWith: "OR",
  }) as (MiniSearchResult & SearchDoc)[];

  const filtered = options.types
    ? results.filter((r) => options.types!.includes(r.type))
    : results;

  return filtered.slice(0, options.limit ?? 50).map((r) => ({
    id: r.id,
    type: r.type,
    title: r.title,
    subtitle: r.subtitle,
    body: "",
    sku: r.sku,
    href: r.href,
    image: r.image,
    price: r.price,
    inStock: r.inStock,
    score: r.score,
  }));
}

/** "Bunu mu demek istediniz?" onerileri. */
export function suggest(index: MiniSearch<SearchDoc>, rawQuery: string, limit = 5): string[] {
  const normalized = trNormalize(rawQuery);
  if (normalized.length < 2) return [];
  return index
    .autoSuggest(normalized, { fuzzy: 0.3, prefix: true })
    .slice(0, limit)
    .map((s) => s.suggestion);
}
