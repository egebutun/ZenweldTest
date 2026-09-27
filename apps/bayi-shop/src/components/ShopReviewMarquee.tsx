"use client";

import { useMemo } from "react";
import { featuredReviews, useDatabase } from "@zenweld/store";
import { ReviewMarquee } from "@zenweld/ui";
import { useT } from "@/lib/i18n-client";
import { STORE } from "@/lib/store-config";

/**
 * BAYI MAGAZASI ANASAYFASINDAKI KAYAN YORUM SERIDI
 *
 * Yalnizca BU magazanin yorumlarini gosterir: bayi sahibi ana siteden
 * giris yapip Hesabim > Yorumlar'dan "anasayfada goster" isaretledigi
 * yorumlar (en fazla 10) burada cikar.
 */
export function ShopReviewMarquee() {
  const t = useT();
  const db = useDatabase();
  const items = useMemo(
    () =>
      featuredReviews("bayi", db, STORE.retailerId).map((r) => ({
        id: r.id,
        rating: r.rating,
        title: r.title,
        body: r.body,
        authorName: r.authorName,
        productName: db.products.find((p) => p.id === r.productId)?.name,
      })),
    [db],
  );

  return (
    <ReviewMarquee
      items={items}
      title={t.reviews.homeTitle}
      subtitle="Mağazamızdan alışveriş yapan müşterilerimizin değerlendirmeleri."
      tone="grey"
    />
  );
}
