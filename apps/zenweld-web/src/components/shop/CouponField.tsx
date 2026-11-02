"use client";

import { useState } from "react";
import { TicketPercent, X } from "lucide-react";
import { useAuth } from "@zenweld/auth";
import { Button, Input } from "@zenweld/ui";
import { useCart } from "@/lib/cart";
import { couponProblemText } from "@/lib/coupon";
import { useT } from "@/lib/i18n-client";

/**
 * SEPETTEKI KUPON ALANI (KARARLAR K-85)
 *
 * Kod yazilip Uygula'ya basilir; uygulanamiyorsa nedeni yazar ve kod
 * sepete kaydedilmez. Uygulanan kupon sonradan gecersiz kalirsa (sure
 * doldu, sepet degisti) nedeni kirmizi yazar; kaldirilana kadar odemeye
 * gecilemez. Kisiye ozel kupon ziyaretciye uygulanir; e-postasi odeme
 * adiminda, giris yapan uyeye gore denetlenir.
 */
export function CouponField() {
  const t = useT();
  const cart = useCart();
  const { user } = useAuth();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (cart.coupon) {
    const { code: applied, result } = cart.coupon;
    return (
      <div
        className={`rounded-[4px] border px-3 py-2.5 text-sm ${
          result.ok ? "border-emerald-200 bg-emerald-50" : "border-zw-red-200 bg-zw-red-50"
        }`}
        data-testid="coupon-applied"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2 font-semibold">
            <TicketPercent size={16} className="shrink-0" />
            {result.ok ? t.cart.couponApplied.replace("{code}", applied) : applied}
          </span>
          <button
            type="button"
            onClick={() => {
              cart.removeCoupon();
              setError(null);
            }}
            className="flex items-center gap-1 rounded-[3px] px-1.5 py-1 text-xs font-semibold text-zw-grey-600 hover:bg-white hover:text-zw-red-600"
          >
            <X size={14} />
            {t.cart.couponRemove}
          </button>
        </div>
        {!result.ok && <p className="mt-1 text-xs font-semibold text-zw-red-700">{couponProblemText(result, t)}</p>}
        {result.ok && !user && result.coupon.audience === "customers" && (
          <p className="mt-1 text-xs text-zw-grey-600">{t.cart.couponPersonal}</p>
        )}
      </div>
    );
  }

  const apply = () => {
    if (!code.trim()) return;
    const result = cart.applyCoupon(code);
    setError(result.ok ? null : couponProblemText(result, t));
    if (result.ok) setCode("");
  };

  return (
    <div>
      <label htmlFor="coupon-code" className="mb-1.5 block text-xs font-semibold text-zw-grey-700">
        {t.cart.couponLabel}
      </label>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          apply();
        }}
      >
        <Input
          id="coupon-code"
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            setError(null);
          }}
          placeholder={t.cart.couponPlaceholder}
          autoComplete="off"
          className="uppercase"
        />
        <Button type="submit" variant="outline">
          {t.cart.couponApply}
        </Button>
      </form>
      {error && <p className="mt-1.5 text-xs font-semibold text-zw-red-700">{error}</p>}
    </div>
  );
}
