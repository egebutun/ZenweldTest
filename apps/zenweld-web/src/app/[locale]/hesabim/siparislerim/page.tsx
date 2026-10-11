"use client";

import { useEffect } from "react";
import { Package, Truck } from "lucide-react";
import { useAuth } from "@zenweld/auth";
import { cancelExpiredTransfers, ordersForUser, useDatabase } from "@zenweld/store";
import { Button, EmptyState } from "@zenweld/ui";
import { formatDate, formatPrice } from "@zenweld/utils";
import { LocaleLink } from "@/components/common/LocaleLink";
import { OrderStatusBadge } from "@/components/shop/OrderParts";
import { useLocale, useT, useText } from "@/lib/i18n-client";

export default function MyOrdersPage() {
  const t = useT();
  const locale = useLocale();
  const text = useText();
  const { user } = useAuth();
  const db = useDatabase();

  // Odeme suresi dolan havale siparisleri burada iptal edilir (sunucu yok).
  useEffect(() => cancelExpiredTransfers(), []);

  if (!user) return null;
  const orders = ordersForUser(user.id, db);

  if (orders.length === 0) {
    return (
      <EmptyState
        icon={<Package size={38} />}
        title={t.account.noOrders}
        action={
          <LocaleLink href="/">
            <Button>{t.cart.continueShopping}</Button>
          </LocaleLink>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((o) => (
        <LocaleLink
          key={o.id}
          href={`/hesabim/siparislerim/${o.code}`}
          className="block rounded-[4px] border border-zw-grey-200 p-5 transition-colors hover:border-zw-ink"
        >
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-display text-lg font-bold">{o.code}</span>
            <OrderStatusBadge status={o.status} />
            <span className="ml-auto text-sm text-zw-grey-500">{formatDate(o.createdAt, locale)}</span>
          </div>
          <ul className="mt-3 space-y-1 text-sm text-zw-grey-700">
            {o.items.map((item, i) => (
              <li key={i}>
                {item.quantity} × {item.productName}
                {item.variantLabel && (
                  <span className="text-zw-grey-500"> — {text(item.variantLabel)}</span>
                )}
              </li>
            ))}
          </ul>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-zw-grey-200 pt-3 text-sm">
            {o.shipment && o.status === "shipped" ? (
              <span className="flex items-center gap-2 text-zw-grey-600">
                <Truck size={16} />
                {o.shipment.carrier} · {o.shipment.trackingNumber}
              </span>
            ) : (
              <span />
            )}
            <span className="font-semibold">
              {t.account.total}: {formatPrice(o.total, locale)}
            </span>
          </div>
        </LocaleLink>
      ))}
    </div>
  );
}
