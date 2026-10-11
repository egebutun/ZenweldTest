"use client";

import { useMemo } from "react";
import { featuredReviews, findProductById, useDatabase } from "@zenweld/store";
import { ReviewMarquee as ReviewMarqueeUI } from "@zenweld/ui";
import { useT } from "@/lib/i18n-client";

/**
 * ANASAYFADAKI KAYAN YORUM SERIDI
 *
 * Yonetim panelinde "anasayfada goster" isaretlenmis en fazla 10 yorumu
 * yavasca yana kaydirir. Gorsel kisim @zenweld/ui icindeki paylasilan
 * bilesende; burada yalnizca veri baglanir.
 */
export function ReviewMarquee() {
  const t = useT();
  const db = useDatabase();
  const items = useMemo(
    () =>
      featuredReviews(db).map((r) => ({
        id: r.id,
        rating: r.rating,
        title: r.title,
        body: r.body,
        authorName: r.authorName,
        productName: findProductById(r.productId, db)?.name,
      })),
    [db],
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
