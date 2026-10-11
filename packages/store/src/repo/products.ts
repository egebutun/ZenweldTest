"use client";

import type { Product, ZenweldDatabase } from "@zenweld/data";
import { getSnapshot, mutate, uid } from "../database";
import { nowIso } from "./shared";

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

export function findProductById(
  id: string,
  db: ZenweldDatabase = getSnapshot(),
): Product | undefined {
  return db.products.find((p) => p.id === id);
}

export function saveProduct(product: Product): void {
  mutate((db) => {
    const idx = db.products.findIndex((p) => p.id === product.id);
    const next = { ...product, updatedAt: nowIso() };
    if (idx >= 0) db.products[idx] = next;
    else db.products.unshift({ ...next, createdAt: nowIso() });
  });
}

export function createProduct(partial: Partial<Product>): Product {
  // Panel formlari yeni kayitta id: "" gonderir; bos metin de "id yok"
  // sayilir (?? kullanilsaydi kayit bos id ile yazilirdi).
  const id = partial.id || uid("p");
  const product: Product = {
    id,
    slug: partial.slug ?? id,
    sku: partial.sku ?? "ZW-YENI",
    name: partial.name ?? "Yeni Ürün",
    section: partial.section ?? "ekipmanlar",
    categorySlug: partial.categorySlug ?? "cok-fonksiyonlu-kaynak-makineleri",
    processes: partial.processes ?? [],
    shortDescription: partial.shortDescription ?? { tr: "", en: "" },
    description: partial.description ?? { tr: "", en: "" },
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
    warrantyMonths: partial.warrantyMonths ?? 24,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    active: partial.active ?? true,
    modelCode: partial.modelCode,
    manualUrl: partial.manualUrl,
  };
  mutate((db) => {
    db.products.unshift(product);
  });
  return product;
}

export function deleteProduct(id: string): void {
  mutate((db) => {
    db.products = db.products.filter((p) => p.id !== id);
    db.retailerStock = db.retailerStock.filter((s) => s.productId !== id);
    db.dealerStock = db.dealerStock.filter((s) => s.productId !== id);
  });
}
