"use client";

import type { ReactNode } from "react";
import { Truck } from "lucide-react";
import type { CartTotals } from "@zenweld/data";
import { formatPrice } from "@zenweld/utils";
import { useLocale, useT } from "@/lib/i18n-client";

/**
 * Sepet ve odeme sayfasindaki tutar ozeti. Taksitli odemede vade farki
 * ayri satirda gosterilir.
 */
export function OrderSummary({
  totals,
  installmentFee = 0,
  children,
}: {
  totals: CartTotals;
  installmentFee?: number;
  children?: ReactNode;
}) {
  const t = useT();
  const locale = useLocale();
  const row = "flex justify-between gap-4";

  return (
    <div className="rounded-[4px] border border-zw-grey-200 bg-zw-grey-50 p-5">
      <h2 className="font-display text-xl font-bold uppercase">{t.cart.summary}</h2>
      <dl className="mt-4 space-y-2 text-sm">
        <div className={row}>
          <dt className="text-zw-grey-600">{t.cart.subtotal}</dt>
          <dd className="font-semibold">{formatPrice(totals.subtotal, locale)}</dd>
        </div>
        <div className={`${row} text-xs text-zw-grey-500`}>
          <dt>{t.cart.vatIncluded}</dt>
          <dd>{formatPrice(totals.vat, locale)}</dd>
        </div>
        <div className={row}>
          <dt className="text-zw-grey-600">{t.cart.shipping}</dt>
          <dd className={totals.shipping === 0 ? "font-semibold text-emerald-700" : "font-semibold"}>
            {totals.shipping === 0 ? t.cart.free : formatPrice(totals.shipping, locale)}
          </dd>
        </div>
        {installmentFee > 0 && (
          <div className={row}>
            <dt className="text-zw-grey-600">{t.checkout.installmentFee}</dt>
            <dd className="font-semibold">{formatPrice(installmentFee, locale)}</dd>
          </div>
        )}
        <div className={`${row} border-t border-zw-grey-200 pt-3 text-base`}>
          <dt className="font-bold">{t.cart.total}</dt>
          <dd className="font-display text-2xl font-bold">
            {formatPrice(totals.total + installmentFee, locale)}
          </dd>
        </div>
      </dl>

      {totals.subtotal > 0 && (
        <p
          className={`mt-4 flex items-center gap-2 rounded-[4px] px-3 py-2 text-xs font-semibold ${
            totals.remainingForFreeShipping > 0
              ? "bg-white text-zw-grey-700"
              : "bg-emerald-50 text-emerald-800"
          }`}
        >
          <Truck size={15} className="shrink-0" />
          {totals.remainingForFreeShipping > 0
            ? t.cart.freeShippingLeft.replace(
                "{amount}",
                formatPrice(totals.remainingForFreeShipping, locale),
              )
            : t.cart.freeShippingReached}
        </p>
      )}

      {children && <div className="mt-5">{children}</div>}
    </div>
  );
}
