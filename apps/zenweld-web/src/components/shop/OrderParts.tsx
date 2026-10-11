"use client";

import { Check, X } from "lucide-react";
import type { Order, OrderStatus } from "@zenweld/data";
import { PAYMENT_EXPIRED_NOTE } from "@zenweld/store";
import { Badge } from "@zenweld/ui";
import { formatDateTime } from "@zenweld/utils";
import { useLocale, useT } from "@/lib/i18n-client";

const TONE: Record<OrderStatus, "amber" | "grey" | "dark" | "green" | "outline"> = {
  awaiting_payment: "amber",
  preparing: "grey",
  shipped: "dark",
  delivered: "green",
  cancelled: "outline",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const t = useT();
  return <Badge tone={TONE[status]}>{t.orders.status[status]}</Badge>;
}

/**
 * Siparisin adim adim ilerleyisi. Havale siparislerinde "Odeme Bekleniyor"
 * adimi da gosterilir. Iptal edilen sipariste gecilen adimlar ve iptal
 * ani listelenir.
 */
export function OrderTimeline({ order }: { order: Order }) {
  const t = useT();
  const locale = useLocale();
  const reachedAt = (status: OrderStatus) => order.history.find((h) => h.status === status)?.at;

  const steps: OrderStatus[] = [
    ...(order.payment.method === "transfer" ? (["awaiting_payment"] as const) : []),
    "preparing",
    "shipped",
    "delivered",
  ];

  if (order.status === "cancelled") {
    const cancelled = order.history.find((h) => h.status === "cancelled");
    return (
      <div className="flex items-start gap-3 rounded-[4px] border border-zw-grey-200 bg-zw-grey-50 px-4 py-3 text-sm">
        <X size={18} className="mt-0.5 shrink-0 text-zw-red-600" />
        <div>
          <div className="font-semibold">{t.orders.status.cancelled}</div>
          {cancelled && (
            <div className="text-xs text-zw-grey-500">
              {formatDateTime(cancelled.at, locale)}
              {cancelled.note &&
                ` — ${cancelled.note === PAYMENT_EXPIRED_NOTE ? t.orders.paymentExpired : cancelled.note}`}
            </div>
          )}
        </div>
      </div>
    );
  }

  const current = steps.indexOf(order.status);

  return (
    <ol className="grid gap-4 sm:grid-flow-col sm:auto-cols-fr sm:gap-0">
      {steps.map((status, i) => {
        const done = i <= current;
        const at = reachedAt(status);
        return (
          <li key={status} className="relative flex gap-3 sm:flex-col sm:items-center sm:text-center">
            {i > 0 && (
              <span
                className={`absolute hidden h-0.5 sm:block sm:left-[-50%] sm:right-1/2 sm:top-4 ${
                  done ? "bg-zw-red-600" : "bg-zw-grey-200"
                }`}
                aria-hidden
              />
            )}
            <span
              className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold ${
                done
                  ? "border-zw-red-600 bg-zw-red-600 text-white"
                  : "border-zw-grey-300 bg-white text-zw-grey-400"
              }`}
            >
              {done ? <Check size={15} /> : i + 1}
            </span>
            <div className="sm:mt-2">
              <div className={`text-sm font-semibold ${done ? "text-zw-ink" : "text-zw-grey-400"}`}>
                {t.orders.status[status]}
              </div>
              {at && <div className="text-xs text-zw-grey-500">{formatDateTime(at, locale)}</div>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
