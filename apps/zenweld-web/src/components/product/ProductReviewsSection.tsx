"use client";

import { useMemo } from "react";
import type { Product, ProductReview } from "@zenweld/data";
import { createReview, listProductReviews, reviewSummary, useDatabase } from "@zenweld/store";
import { useAuth } from "@zenweld/auth";
import { ProductReviews, type ReviewMediaInput } from "@zenweld/ui";
import { useLocale, useT } from "@/lib/i18n-client";
import { optimizeImageFile } from "@/lib/slugify";

/**
 * Urun sayfasindaki degerlendirme bolumu.
 *
 * Gorunum paylasilan @zenweld/ui bilesenindedir; burada yalnizca veri
 * baglantisi ve dosya kucultme yapilir. Yeni yorumlar dogrudan
 * yayinlanmaz, yonetim panelinde onay bekler.
 */
export function ProductReviewsSection({
  product,
  site,
}: {
  product: Product;
  site: ProductReview["site"];
}) {
  const t = useT();
  const locale = useLocale();
  const db = useDatabase();
  const { user } = useAuth();

  const items = useMemo(() => listProductReviews(product.id, site, db), [product.id, site, db]);
  const summary = useMemo(() => reviewSummary(product.id, site, db), [product.id, site, db]);

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
          // Uye girisi olanlar "dogrulanmis alici" sayilir; gercek
          // sistemde siparis kaydiyla eslestirilmeli.
          verifiedPurchase: Boolean(user),
          site,
        })
      }
      onPickMedia={(files, add) => {
        if (!files) return;
        Array.from(files).forEach(async (file) => {
          if (file.type.startsWith("video/")) {
            // Video tarayicida kucultulemiyor; oldugu gibi okunur.
            const reader = new FileReader();
            reader.onload = () => add({ url: String(reader.result), kind: "video" });
            reader.readAsDataURL(file);
            return;
          }
          const url = await optimizeImageFile(file);
          add({ url, kind: "image" });
        });
      }}
    />
  );
}
