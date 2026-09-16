"use client";

import { useAuth } from "@zenweld/auth";
import { ordersForUser, useDatabase } from "@zenweld/store";
import { Badge, EmptyState } from "@zenweld/ui";
import { Package } from "lucide-react";
import { useLocale, useT } from "@/lib/i18n-client";
import { formatDate, formatPrice } from "@/lib/format";

const STATUS_LABEL: Record<string, string> = {
  pending: "Hazırlanıyor",
  confirmed: "Onaylandı",
  shipped: "Kargoda",
  delivered: "Teslim Edildi",
  cancelled: "İptal",
};

export default function MyOrdersPage() {
  const t = useT();
  const locale = useLocale();
  const { user } = useAuth();
  const db = useDatabase();

  if (!user) return null;
  const orders = ordersForUser(user.id, db);

  if (orders.length === 0) {
    return <EmptyState icon={<Package size={38} />} title={t.account.noOrders} />;
  }

  return (
    <div className="space-y-4">
      {orders.map((o) => (
        <div key={o.id} className="rounded-[4px] border border-zw-grey-200 p-5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-display text-lg font-bold">{o.code}</span>
            <Badge tone={o.status === "delivered" ? "green" : "grey"}>
              {STATUS_LABEL[o.status]}
            </Badge>
            <Badge tone="outline">
              {o.channel === "zenweld" ? "Zenweld" : "ZENWELD-BAYİ-A"}
            </Badge>
            <span className="ml-auto text-sm text-zw-grey-500">
              {formatDate(o.createdAt, locale)}
            </span>
          </div>
          <ul className="mt-3 space-y-1 text-sm text-zw-grey-700">
            {o.items.map((item, i) => (
              <li key={i} className="flex justify-between gap-4">
                <span>
                  {item.quantity} × {item.productName}
                </span>
                <span>{formatPrice(item.unitPrice * item.quantity, locale)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 border-t border-zw-grey-200 pt-3 text-right font-semibold">
            {t.account.total}: {formatPrice(o.total, locale)}
          </div>
        </div>
      ))}
    </div>
  );
}
