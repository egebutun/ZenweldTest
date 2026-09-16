"use client";

import { Package, User as UserIcon } from "lucide-react";
import { useAuth } from "@zenweld/auth";
import { ordersForUser, useDatabase } from "@zenweld/store";
import { Badge, Button, EmptyState } from "@zenweld/ui";
import { LocaleLink } from "@/components/LocaleLink";
import { useLocale, useT } from "@/lib/i18n-client";
import { formatDate, formatPrice } from "@/lib/format";

const STATUS_LABEL: Record<string, string> = {
  pending: "Hazırlanıyor",
  confirmed: "Onaylandı",
  shipped: "Kargoda",
  delivered: "Teslim Edildi",
  cancelled: "İptal",
};

export default function ShopAccountPage() {
  const t = useT();
  const locale = useLocale();
  const db = useDatabase();
  const { user, ready, logout } = useAuth();

  if (!ready) return <div className="zw-container py-20 text-center">{t.common.loading}</div>;

  if (!user) {
    return (
      <div className="zw-container py-20">
        <EmptyState
          icon={<UserIcon size={40} />}
          title={t.auth.loginTitle}
          action={
            <LocaleLink href="/giris">
              <Button size="lg">{t.nav.login}</Button>
            </LocaleLink>
          }
        />
      </div>
    );
  }

  const orders = ordersForUser(user.id, db).filter((o) => o.channel === "bayi-shop");

  return (
    <div className="zw-container py-10">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-4xl font-bold uppercase">{t.account.title}</h1>
        <Badge tone="dark">
          {user.firstName} {user.lastName}
        </Badge>
        <button
          onClick={logout}
          className="ml-auto rounded-[4px] border border-zw-grey-300 px-3 py-2 text-sm font-semibold hover:border-zw-ink"
        >
          {t.nav.logout}
        </button>
      </div>

      <h2 className="mt-8 font-display text-2xl font-bold uppercase">{t.account.myOrders}</h2>

      {orders.length === 0 ? (
        <div className="mt-4">
          <EmptyState icon={<Package size={38} />} title={t.account.noOrders} />
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {orders.map((o) => (
            <div key={o.id} className="rounded-[4px] border border-zw-grey-200 p-5">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-display text-lg font-bold">{o.code}</span>
                <Badge tone={o.status === "delivered" ? "green" : "grey"}>
                  {STATUS_LABEL[o.status]}
                </Badge>
                <span className="ml-auto text-sm text-zw-grey-500">
                  {formatDate(o.createdAt, locale)}
                </span>
              </div>
              <ul className="mt-3 space-y-1 text-sm text-zw-grey-700">
                {o.items.map((i, idx) => (
                  <li key={idx} className="flex justify-between gap-4">
                    <span>
                      {i.quantity} × {i.productName}
                    </span>
                    <span>{formatPrice(i.unitPrice * i.quantity, locale)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 border-t border-zw-grey-200 pt-3 text-right font-semibold">
                {t.shop.total}: {formatPrice(o.total, locale)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
