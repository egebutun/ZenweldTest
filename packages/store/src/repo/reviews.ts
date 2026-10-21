"use client";

import type { ProductReview, ZenweldDatabase } from "@zenweld/data";
import { getSnapshot, mutate, uid } from "../database";
import { nowIso } from "./shared";

/* ------------------------------------------------------------------ */
/* Urun degerlendirmeleri                                              */
/* ------------------------------------------------------------------ */

/** Anasayfadaki kayan seritte en fazla bu kadar yorum gosterilir. */
export const FEATURED_REVIEW_LIMIT = 10;

/** Bir urunun yayindaki yorumlari (en yeni once). */
export function listProductReviews(
  productId: string,
  db: ZenweldDatabase = getSnapshot(),
): ProductReview[] {
  return db.reviews
    .filter((r) => r.productId === productId && r.approved)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Ortalama puan ve yorum sayisi. */
export function reviewSummary(
  productId: string,
  db: ZenweldDatabase = getSnapshot(),
): { average: number; count: number } {
  const list = listProductReviews(productId, db);
  if (list.length === 0) return { average: 0, count: 0 };
  const total = list.reduce((sum, r) => sum + r.rating, 0);
  return { average: Math.round((total / list.length) * 10) / 10, count: list.length };
}

/** Anasayfada gosterilecek, isaretlenmis yorumlar. */
export function featuredReviews(db: ZenweldDatabase = getSnapshot()): ProductReview[] {
  const visible = new Set(db.products.filter((p) => p.active).map((p) => p.id));
  return db.reviews
    // Yayindan kaldirilan urunun yorumu anasayfada da gorunmez.
    .filter((r) => r.approved && r.featured && visible.has(r.productId))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, FEATURED_REVIEW_LIMIT);
}

/** Yonetim panelindeki tam liste (onay bekleyenler dahil). */
export function listAllReviews(db: ZenweldDatabase = getSnapshot()): ProductReview[] {
  return [...db.reviews].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Yeni yorum; tarayici deposuna sigmazsa (buyuk video) null. */
export function createReview(partial: Partial<ProductReview>): ProductReview | null {
  const item: ProductReview = {
    id: partial.id || uid("rv"),
    productId: partial.productId ?? "",
    userId: partial.userId,
    authorName: partial.authorName ?? "",
    rating: Math.min(5, Math.max(1, partial.rating ?? 5)),
    title: partial.title,
    body: partial.body ?? "",
    media: partial.media ?? [],
    verifiedPurchase: partial.verifiedPurchase ?? false,
    // Yeni yorumlar once yonetim panelinde onaylanir.
    approved: partial.approved ?? false,
    featured: false,
    createdAt: partial.createdAt ?? nowIso(),
  };
  const saved = mutate((db) => {
    db.reviews.unshift(item);
  });
  return saved ? item : null;
}

export function saveReview(review: ProductReview): void {
  mutate((db) => {
    const i = db.reviews.findIndex((r) => r.id === review.id);
    if (i >= 0) db.reviews[i] = review;
  });
}

export function deleteReview(id: string): void {
  mutate((db) => {
    const i = db.reviews.findIndex((r) => r.id === id);
    if (i >= 0) db.reviews.splice(i, 1);
  });
}

/**
 * Yorumu anasayfa seridine alir ya da cikarir.
 * Sinir dolmussa yeni isaretleme yapilmaz; cagiran taraf false donusunu
 * kullaniciya bildirir.
 */
export function toggleFeaturedReview(id: string): boolean {
  let ok = true;
  mutate((db) => {
    const review = db.reviews.find((r) => r.id === id);
    if (!review) return;
    if (!review.featured) {
      const count = db.reviews.filter((r) => r.featured).length;
      if (count >= FEATURED_REVIEW_LIMIT) {
        ok = false;
        return;
      }
    }
    review.featured = !review.featured;
  });
  return ok;
}
