"use client";

import type { Product, ZenweldDatabase } from "@zenweld/data";
import { getSnapshot, mutate, uid } from "../database";
import { findMoved, nowIso, withPreviousSlugs } from "./shared";

/* ------------------------------------------------------------------ */
/* Urunler                                                             */
/* ------------------------------------------------------------------ */

/** Sitede gorunen urunler (yayinda olanlar). */
export function listProducts(db: ZenweldDatabase = getSnapshot()): Product[] {
  return db.products.filter((p) => p.active);
}

/** Sitedeki urun sayfasi icin: yalnizca yayindaki urun. */
export function findProductBySlug(
  slug: string,
  db: ZenweldDatabase = getSnapshot(),
): Product | undefined {
  return db.products.find((p) => p.active && p.slug === slug);
}

/**
 * Kimlikleri verilen urunlerden yayinda olanlar, verilen sirayla. Favoriler
 * ve teklif listesi gibi tarayicida saklanan listeler icin: urun sonradan
 * yayindan kaldirilirsa listede gorunmez.
 */
export function visibleProducts(
  ids: string[],
  db: ZenweldDatabase = getSnapshot(),
): Product[] {
  return ids
    .map((id) => db.products.find((p) => p.id === id))
    .filter((p): p is Product => Boolean(p?.active));
}

/** Adresi degismis urun: eski adresle gelen ziyaretci yeni adrese yonlendirilir. */
export function findMovedProduct(slug: string, db: ZenweldDatabase = getSnapshot()): Product | undefined {
  return findMoved(listProducts(db), slug);
}

export function findProductById(
  id: string,
  db: ZenweldDatabase = getSnapshot(),
): Product | undefined {
  return db.products.find((p) => p.id === id);
}

/** Linki degisen urunun eski adresi yenisine yonlenir (withPreviousSlugs). */
export function saveProduct(product: Product): void {
  mutate((db) => {
    const idx = db.products.findIndex((p) => p.id === product.id);
    const next = { ...withPreviousSlugs(db.products, product), updatedAt: nowIso() };
    if (idx >= 0) db.products[idx] = next;
    else db.products.unshift({ ...next, createdAt: nowIso() });
    // Urunden kaldirilan seceneklerin stok satirlari ve kod eslestirmeleri de silinir.
    const kept = new Set(product.options?.variants.map((v) => v.valueId));
    const live = (r: { productId: string; variantId?: string }) =>
      r.productId !== product.id || !r.variantId || kept.has(r.variantId);
    db.dealerStock = db.dealerStock.filter(live);
    db.retailerStock = db.retailerStock.filter(live);
    db.skuAliases = db.skuAliases.filter(live);
  });
}

/** Kategorideki en buyuk Sıra numarasinin bir fazlasi. */
function nextProductOrder(categorySlug: string, db: ZenweldDatabase = getSnapshot()): number {
  return Math.max(0, ...db.products.filter((p) => p.categorySlug === categorySlug).map((p) => p.order ?? 0)) + 1;
}

export function createProduct(partial: Partial<Product>): Product {
  // Panel formlari yeni kayitta id: "" gonderir; bos metin de "id yok"
  // sayilir (?? kullanilsaydi kayit bos id ile yazilirdi).
  const id = partial.id || uid("p");
  const categorySlug = partial.categorySlug ?? "cok-fonksiyonlu-kaynak-makineleri";
  const product: Product = {
    id,
    slug: partial.slug ?? id,
    sku: partial.sku ?? "ZW-YENI",
    name: partial.name ?? "Yeni Ürün",
    section: partial.section ?? "ekipmanlar",
    categorySlug,
    processes: partial.processes ?? [],
    shortDescription: partial.shortDescription ?? "",
    description: partial.description ?? "",
    priceExVat: partial.priceExVat ?? 0,
    // Yeni urun olustururken girilen kampanya kaybolmasin.
    discount: partial.discount,
    vatRate: partial.vatRate ?? 20,
    currency: "TRY",
    images: partial.images ?? [],
    specs: partial.specs ?? [],
    inTheBox: partial.inTheBox ?? [],
    highlights: partial.highlights ?? [],
    quotable: partial.quotable ?? true,
    featured: partial.featured ?? false,
    isNew: partial.isNew ?? true,
    // Sira verilmediyse kategorisinin sonuna eklenir.
    order: partial.order ?? nextProductOrder(categorySlug),
    warrantyMonths: partial.warrantyMonths ?? 24,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    active: partial.active ?? true,
    options: partial.options,
    modelCode: partial.modelCode,
    manualUrl: partial.manualUrl,
    seo: partial.seo,
  };
  mutate((db) => {
    // Yeni link baska bir kaydin eski linkiyse o yonlendirme kalkar.
    db.products.unshift(withPreviousSlugs(db.products, product));
  });
  return product;
}

export function deleteProduct(id: string): void {
  mutate((db) => {
    db.products = db.products.filter((p) => p.id !== id);
    db.dealerStock = db.dealerStock.filter((l) => l.productId !== id);
    db.retailerStock = db.retailerStock.filter((l) => l.productId !== id);
    db.skuAliases = db.skuAliases.filter((a) => a.productId !== id);
    db.documents.forEach((d) => {
      if (d.productId === id) delete d.productId;
    });
  });
}
