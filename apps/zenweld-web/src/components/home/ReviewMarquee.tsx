"use client";

import { useMemo } from "react";
import type { ProductReview } from "@zenweld/data";
import { featuredReviews, useDatabase } from "@zenweld/store";
import { ReviewMarquee as ReviewMarqueeUI } from "@zenweld/ui";
import { useT } from "@/lib/i18n-client";

/**
 * ANASAYFADAKI KAYAN YORUM SERIDI
 *
 * Yonetim panelinde "anasayfada goster" isaretlenmis en fazla 10 yorumu
 * yavasca yana kaydirir. Gorsel kisim @zenweld/ui icindeki paylasilan
 * bilesende; burada yalnizca veri baglanir (bayi magazasi da ayni
 * bileseni kendi yorumlariyla kullanir).
 */
export function ReviewMarquee({ site = "zenweld" }: { site?: ProductReview["site"] }) {
  const t = useT();
  const db = useDatabase();
  const items = useMemo(
    () =>
      featuredReviews(site, db).map((r) => ({
        id: r.id,
        rating: r.rating,
        title: r.title,
        body: r.body,
        authorName: r.authorName,
        productName: db.products.find((p) => p.id === r.productId)?.name,
      })),
    [site, db],
  );

  return (
    <ReviewMarqueeUI
      items={items}
      title={t.reviews.homeTitle}
      subtitle={t.reviews.homeSubtitle}
      tone="grey"
    />
  );
}
