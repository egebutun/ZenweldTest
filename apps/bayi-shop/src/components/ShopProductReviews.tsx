"use client";

import { useMemo } from "react";
import type { Product } from "@zenweld/data";
import { createReview, listProductReviews, reviewSummary, useDatabase } from "@zenweld/store";
import { useAuth } from "@zenweld/auth";
import { ProductReviews } from "@zenweld/ui";
import { useLocale, useT } from "@/lib/i18n-client";
import { STORE } from "@/lib/store-config";

/**
 * Bayi magazasindaki urun degerlendirmeleri.
 *
 * Ana siteyle ayni gorsel bileseni kullanir; yorumlar site: "bayi"
 * olarak kaydedildigi icin iki sitenin yorumlari birbirine karismaz.
 * Yeni yorumlar bayinin yonetim panelinde onay bekler.
 */
export function ShopProductReviews({ product }: { product: Product }) {
  const t = useT();
  const locale = useLocale();
  const db = useDatabase();
  const { user } = useAuth();

  const items = useMemo(() => listProductReviews(product.id, "bayi", db, STORE.retailerId), [product.id, db]);
  const summary = useMemo(() => reviewSummary(product.id, "bayi", db, STORE.retailerId), [product.id, db]);

  return (
    <ProductReviews
      items={items}
      average={summary.average}
      locale={locale}
      defaultName={user ? `${user.firstName} ${user.lastName}`.trim() : ""}
      texts={t.reviews}
      onSubmit={(input) =>
        createReview({
          productId: product.id,
          userId: user?.id,
          authorName: input.authorName,
          rating: input.rating,
          title: input.title || undefined,
          body: input.body,
          media: input.media,
          verifiedPurchase: Boolean(user),
          site: "bayi",
          retailerId: STORE.retailerId,
        })
      }
      onPickMedia={(files, add) => {
        if (!files) return;
        Array.from(files).forEach((file) => {
          const reader = new FileReader();
          reader.onload = () =>
            add({
              url: String(reader.result),
              kind: file.type.startsWith("video/") ? "video" : "image",
            });
          reader.readAsDataURL(file);
        });
      }}
    />
  );
}
