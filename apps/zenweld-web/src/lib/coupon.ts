import type { CouponResult } from "@zenweld/data";
import type { Dictionary } from "@zenweld/i18n";
import { formatDate, formatPrice } from "@zenweld/utils";

/** Kuponun neden uygulanmadigini musteriye anlatan metin (sepet ve odeme). */
export function couponProblemText(result: CouponResult, t: Dictionary): string {
  if (result.ok) return "";
  const texts = t.cart.couponProblems;
  const c = result.coupon;
  switch (result.problem) {
    case "scheduled":
      return texts.scheduled.replace("{date}", c?.startsAt ? formatDate(c.startsAt) : "");
    case "minTotal":
      return texts.minTotal.replace("{amount}", formatPrice(c?.minCartTotal ?? 0));
    default:
      return texts[result.problem];
  }
}
