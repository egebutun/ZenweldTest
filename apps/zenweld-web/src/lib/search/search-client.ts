"use client";

import MiniSearch, { type SearchResult as MiniSearchResult } from "minisearch";
import { salePriceExVat, type ZenweldDatabase } from "@zenweld/data";
import { listBlogPosts, listEvents, listNews, listProducts } from "@zenweld/store";
import { priceWithVat } from "@zenweld/utils";
import { trNormalize, trTokenize } from "./tr-normalize";
import { expandQuery } from "./synonyms";
import { categoryHref } from "@/lib/catalog";

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
  /** Urunlerde KDV dahil satis fiyati (urunun kendi KDV orani ile) */
  price?: number;
}

export interface SearchHit extends SearchDoc {
  score: number;
}

const STATIC_PAGES: { id: string; text: string; href: string }[] = [
  { id: "page-teklif", text: "Teklif Al kurumsal vadeli çek ödeme", href: "/teklif-al" },
  { id: "page-bayi", text: "Nereden Alabilirim bayi bul harita satış noktası", href: "/yetkili-bayi-ve-servis-agi" },
  { id: "page-garanti-sorgula", text: "Garanti Sorgula seri numarası", href: "/garanti/sorgulama" },
  { id: "page-garanti-kayit", text: "Garanti Kaydı uzatma kayıt", href: "/garanti/kayit" },
  { id: "page-club", text: "Welders Club topluluk üyelik", href: "/welders-club" },
  { id: "page-msds", text: "MSDS malzeme güvenlik bilgi formu", href: "/msds" },
  { id: "page-sertifika", text: "Parti Sertifikaları uygunluk belgesi", href: "/parti-sertifikalari" },
  { id: "page-secici", text: "Ürün Seçici hangi makine bana uygun", href: "/urun-secici" },
  { id: "page-iletisim", text: "İletişim destek yardım servis telefon adres", href: "/iletisim" },
  { id: "page-sss", text: "Sık Sorulan Sorular SSS", href: "/sss" },
  { id: "page-hakkimizda", text: "Hakkımızda kurumsal şirket", href: "/hakkimizda" },
  { id: "page-blog", text: "Blog yazılar rehber ipuçları", href: "/blog" },
  { id: "page-etkinlikler", text: "Etkinlikler etkinlik takvimi fuar fuarlar", href: "/etkinlikler" },
  { id: "page-haberler", text: "Haberler duyurular basın", href: "/haberler" },
];

export function buildDocuments(db: ZenweldDatabase): SearchDoc[] {
  const docs: SearchDoc[] = [];

  // Yalnizca yayindaki icerik aranir.
  listProducts(db).forEach((p) => {
    const category = db.categories.find((c) => c.slug === p.categorySlug);
    docs.push({
      id: `product:${p.id}`,
      type: "product",
      title: p.name,
      subtitle: category ? category.name : "",
      body: [
        p.shortDescription,
        p.description,
        p.processes.join(" "),
        p.modelCode ?? "",
        p.specs.map((s) => `${s.label} ${s.value}`).join(" "),
        // Paneldeki SEO sekmesinin anahtar kelimeleri
        p.seo?.keywords?.join(" ") ?? "",
      ].join(" "),
      // Seçenekli urun kombinasyon kodlariyla da bulunur (SAP kodu, ör. ZW30100000012).
      sku: [p.sku, ...(p.options?.variants.map((v) => v.sku) ?? [])].join(" "),
      href: `/urun/${p.slug}`,
      image: p.images[0]?.url,
      // Sonuclarda musterinin odeyecegi (kampanyali, KDV dahil) fiyat gorunur.
      // Arama yalnizca kullanici acinca cizildigi icin anlik saat kullanilir.
      price: priceWithVat(salePriceExVat(p), p.vatRate),
    });
  });

  db.categories.forEach((c) => {
    docs.push({
      id: `category:${c.id}`,
      type: "category",
      title: c.name,
      subtitle: c.description,
      body: `${c.name} ${c.description} ${c.group} ${c.seo?.keywords?.join(" ") ?? ""}`,
      sku: "",
      href: categoryHref(c),
    });
  });

  listEvents(db).forEach((e) => {
    docs.push({
      id: `article:event-${e.id}`,
      type: "article",
      title: e.title,
      subtitle: `${e.venue} · ${e.city}`,
      body: `${e.summary} ${e.description} ${e.city} ${e.country} ${e.seo?.keywords?.join(" ") ?? ""}`,
      sku: "",
      href: `/etkinlikler/${e.slug}`,
      image: e.logoUrl,
    });
  });

  listNews(db).forEach((n) => {
    docs.push({
      id: `article:news-${n.id}`,
      type: "article",
      title: n.title,
      subtitle: n.summary,
      body: `${n.summary} ${n.body} ${n.seo?.keywords?.join(" ") ?? ""}`,
      sku: "",
      href: `/haberler/${n.slug}`,
      image: n.coverUrl,
    });
  });

  listBlogPosts(db).forEach((b) => {
    docs.push({
      id: `article:${b.id}`,
      type: "article",
      title: b.title,
      subtitle: b.category,
      body: `${b.excerpt} ${b.seo?.keywords?.join(" ") ?? ""}`,
      sku: "",
      href: `/blog/${b.slug}`,
      image: b.coverUrl,
    });
  });

  STATIC_PAGES.forEach((p) => {
    docs.push({
      id: p.id,
      type: "page",
      title: p.text.split(" ").slice(0, 3).join(" "),
      subtitle: p.text,
      body: p.text,
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
    storeFields: ["id", "type", "title", "subtitle", "href", "image", "price", "sku"],
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
