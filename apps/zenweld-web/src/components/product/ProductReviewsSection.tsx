"use client";

import { useMemo } from "react";
import type { Product } from "@zenweld/data";
import { createReview, listProductReviews, reviewSummary, useDatabase } from "@zenweld/store";
import { useAuth } from "@zenweld/auth";
import { ProductReviews } from "@zenweld/ui";
import { useT } from "@/lib/i18n-client";
import { optimizeImageFile } from "@zenweld/utils";
import { KvkkNotice } from "@/components/legal/LegalLink";
import { useBotTrap } from "@/components/common/BotTrap";
import { notifyZenweld } from "@/lib/notify";

/** Yorum videosu en fazla 2 MB (tarayici deposunun siniri ~5 MB). */
const MAX_VIDEO_BYTES = 2 * 1024 * 1024;

/**
 * Urun sayfasindaki degerlendirme bolumu.
 *
 * Gorunum paylasilan @zenweld/ui bilesenindedir; burada yalnizca veri
 * baglantisi ve dosya kucultme yapilir. Yeni yorumlar dogrudan
 * yayinlanmaz, yonetim panelinde onay bekler.
 */
export function ProductReviewsSection({ product }: { product: Product }) {
  const t = useT();
  const db = useDatabase();
  const { user } = useAuth();
  const bot = useBotTrap();

  const items = useMemo(() => listProductReviews(product.id, db), [product.id, db]);
  const summary = useMemo(() => reviewSummary(product.id, db), [product.id, db]);

  return (
    <ProductReviews
      items={items}
      average={summary.average}
      defaultName={user ? `${user.firstName} ${user.lastName}`.trim() : ""}
      texts={t.reviews}
      notice={
        <>
          {bot.field}
          <KvkkNotice />
        </>
      }
      onSubmit={(input) => {
        const review = createReview({
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
        });
        if (!review) return false;
        // Yorum panelde onay bekler; info@zenweld.com'a da haber verilir.
        void notifyZenweld("yorum", {
          productName: product.name,
          authorName: review.authorName,
          rating: review.rating,
          title: review.title,
          body: review.body,
          media: review.media.length ? `${review.media.length} dosya (panelde görülebilir)` : "Yok",
        }, bot.website);
        return true;
      }}
      onPickMedia={(files, add, fail) => {
        if (!files) return;
        Array.from(files).forEach(async (file) => {
          if (file.type.startsWith("video/")) {
            // Video tarayicida kucultulemiyor; oldugu gibi okunur. Demo
            // verisi tarayici deposunda tutuldugu icin boyut sinirli.
            if (file.size > MAX_VIDEO_BYTES) {
              fail(t.reviews.mediaTooLarge.replace("{name}", file.name));
              return;
            }
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
