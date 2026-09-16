"use client";

import { useMemo } from "react";
import {
  AlertTriangle,
  FileText,
  Package,
  ShoppingCart,
  Store,
  Users,
} from "lucide-react";
import { useDatabase } from "@zenweld/store";
import { Badge } from "@zenweld/ui";
import { AdminCard, AdminPageHeader } from "@/components/admin/AdminShell";
import { LocaleLink } from "@/components/common/LocaleLink";
import { useLocale } from "@/lib/i18n-client";
import { formatDate, formatPrice } from "@/lib/format";

export default function AdminDashboard() {
  const db = useDatabase();
  const locale = useLocale();

  const stats = useMemo(() => {
    const activeProducts = db.products.filter((p) => p.active);
    const noOnlineStock = activeProducts.filter(
      (p) => !db.retailerStock.some((s) => s.productId === p.id && s.inStock),
    );
    return {
      products: activeProducts.length,
      users: db.users.length,
      pendingUsers: db.users.filter((u) => u.status === "pending").length,
      retailers: db.retailers.filter((r) => r.active).length,
      newQuotes: db.quotes.filter((q) => q.status === "new").length,
      quotes: db.quotes.length,
      orders: db.orders.length,
      noOnlineStock,
    };
  }, [db]);

  const cards = [
    { href: "/admin/urunler", label: "Aktif Ürün", value: stats.products, Icon: Package },
    { href: "/admin/uyeler", label: "Üye", value: stats.users, Icon: Users, note: stats.pendingUsers ? `${stats.pendingUsers} onay bekliyor` : undefined },
    { href: "/admin/saticilar", label: "Online Satıcı", value: stats.retailers, Icon: Store },
    { href: "/admin/teklifler", label: "Teklif", value: stats.quotes, Icon: FileText, note: stats.newQuotes ? `${stats.newQuotes} yeni` : undefined },
    { href: "/admin/siparisler", label: "Sipariş", value: stats.orders, Icon: ShoppingCart },
  ];

  return (
    <>
      <AdminPageHeader
        title="Panel"
        description="Zenweld yönetim paneline hoş geldiniz."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(({ href, label, value, Icon, note }) => (
          <LocaleLink key={href} href={href}>
            <AdminCard className="transition-colors hover:border-zw-ink">
              <Icon size={20} className="text-zw-red-600" />
              <div className="mt-3 font-display text-3xl font-bold">{value}</div>
              <div className="text-sm text-zw-grey-600">{label}</div>
              {note && (
                <Badge tone="amber" className="mt-2">
                  {note}
                </Badge>
              )}
            </AdminCard>
          </LocaleLink>
        ))}
      </div>

      {stats.noOnlineStock.length > 0 && (
        <AdminCard className="mt-6">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-600" />
            <h2 className="font-display text-xl font-bold uppercase">
              Hiçbir online satıcıda stokta olmayan ürünler
            </h2>
            <Badge tone="amber">{stats.noOnlineStock.length}</Badge>
          </div>
          <p className="mt-1 text-sm text-zw-grey-600">
            Bu ürünlerin sayfasında &quot;online satıcı&quot; bölümü boş görünür. Stok
            matrisinden güncelleyebilirsiniz.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {stats.noOnlineStock.slice(0, 12).map((p) => (
              <LocaleLink
                key={p.id}
                href={`/admin/stok?urun=${p.id}`}
                className="rounded-[3px] border border-zw-grey-300 px-2.5 py-1 text-xs font-semibold hover:border-zw-ink"
              >
                {p.name}
              </LocaleLink>
            ))}
          </div>
        </AdminCard>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <AdminCard>
          <h2 className="font-display text-xl font-bold uppercase">Son Teklifler</h2>
          <div className="mt-3 divide-y divide-zw-grey-100">
            {db.quotes.slice(0, 5).map((q) => (
              <LocaleLink
                key={q.id}
                href="/admin/teklifler"
                className="flex items-center gap-3 py-2.5 text-sm hover:text-zw-red-600"
              >
                <span className="font-semibold">{q.code}</span>
                <span className="truncate text-zw-grey-600">{q.companyName}</span>
                <span className="ml-auto shrink-0 text-xs text-zw-grey-400">
                  {formatDate(q.createdAt, locale)}
                </span>
              </LocaleLink>
            ))}
            {db.quotes.length === 0 && (
              <p className="py-3 text-sm text-zw-grey-500">Henüz teklif yok.</p>
            )}
          </div>
        </AdminCard>

        <AdminCard>
          <h2 className="font-display text-xl font-bold uppercase">Son Siparişler</h2>
          <div className="mt-3 divide-y divide-zw-grey-100">
            {db.orders.slice(0, 5).map((o) => (
              <LocaleLink
                key={o.id}
                href="/admin/siparisler"
                className="flex items-center gap-3 py-2.5 text-sm hover:text-zw-red-600"
              >
                <span className="font-semibold">{o.code}</span>
                <span className="truncate text-zw-grey-600">{o.customerName}</span>
                <span className="ml-auto shrink-0 font-semibold">
                  {formatPrice(o.total, locale)}
                </span>
              </LocaleLink>
            ))}
            {db.orders.length === 0 && (
              <p className="py-3 text-sm text-zw-grey-500">Henüz sipariş yok.</p>
            )}
          </div>
        </AdminCard>
      </div>
    </>
  );
}
