import type { CouponView } from "@zenweld/data";
import type { Dictionary } from "@zenweld/i18n";
import { formatDate, formatPrice } from "@zenweld/utils";

/** Kuponun neden uygulanmadigini musteriye anlatan metin (sepet, odeme ve sunucu). */
export function couponProblemText(result: CouponView, t: Dictionary): string {
  if (result.ok) return "";
  const texts = t.cart.couponProblems;
  switch (result.problem) {
    case "scheduled":
      return texts.scheduled.replace("{date}", result.startsAt ? formatDate(result.startsAt) : "");
    case "minTotal":
      return texts.minTotal.replace("{amount}", formatPrice(result.minCartTotal ?? 0));
    default:
      return texts[result.problem];
  }
}
