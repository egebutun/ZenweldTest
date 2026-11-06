"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  CalendarDays,
  FileText,
  Newspaper,
  Package,
  ShieldCheck,
  ShoppingCart,
  Store,
  Users,
} from "lucide-react";
import { useDatabase, useNow } from "@zenweld/store";
import { Badge } from "@zenweld/ui";
import { formatDate, formatPrice } from "@zenweld/utils";
import { AdminCard, AdminPageHeader } from "@/components/admin/AdminShell";
import { DashboardCharts } from "@/components/admin/DashboardCharts";
import { useDemoExpiredTransfers } from "@/lib/admin-sales";
import { DEFAULT_RANGE, RANGE_COOKIE, dashboardSummary, parseRange, type DashboardSummary, type RangeKey } from "@/lib/admin-stats";

/** Tarih secimi bu tarayicida hatirlanir (cerez; veritabani modunda sunucu da okur). */
function rememberRange(key: RangeKey) {
  document.cookie = `${RANGE_COOKIE}=${key}; path=/yonetim; max-age=31536000; samesite=lax`;
}

function savedRange(): RangeKey {
  const match = document.cookie.match(new RegExp(`(?:^|; )${RANGE_COOKIE}=([^;]*)`));
  return parseRange(match?.[1]);
}

/**
 * Panel ana sayfasi: grafikler, genel durum, yapilacaklar, son teklif ve
 * siparisler. Veritabani modunda ozet sunucuda hesaplanir (page.tsx) ve
 * tarayiciya yalnizca sonuc gelir; tarih secimi degisince sunucu yeniden
 * hesaplar. Demo modunda ayni hesap tarayicidaki veriyle yapilir.
 */
export function DashboardClient({ summary }: { summary?: DashboardSummary }) {
  return summary ? <ServerDashboard summary={summary} /> : <BrowserDashboard />;
}

function ServerDashboard({ summary }: { summary: DashboardSummary }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const choose = (key: RangeKey) => {
    rememberRange(key);
    startTransition(() => router.refresh());
  };
  return <DashboardView summary={summary} onChoose={choose} pending={pending} />;
}

function BrowserDashboard() {
  const db = useDatabase();
  const now = useNow();
  // Odeme suresi dolan havale siparisi ciroda ve "islem bekliyor"da sayilmasin
  // (veritabani modunda sunucu, veriyi okurken yapar).
  useDemoExpiredTransfers();
  const [rangeKey, setRangeKey] = useState<RangeKey>(DEFAULT_RANGE);
  useEffect(() => setRangeKey(savedRange()), []);
  const summary = useMemo(() => dashboardSummary(db, rangeKey, now), [db, rangeKey, now]);
  const choose = (key: RangeKey) => {
    rememberRange(key);
    setRangeKey(key);
  };
  return <DashboardView summary={summary} onChoose={choose} />;
}

function DashboardView({
  summary,
  onChoose,
  pending,
}: {
  summary: DashboardSummary;
  onChoose: (key: RangeKey) => void;
  pending?: boolean;
}) {
  const { overview: o, noOnlineStock, recentQuotes, recentOrders } = summary;
  const cards = [
    { href: "/yonetim/urunler", label: "Aktif Ürün", value: o.products, Icon: Package },
    { href: "/yonetim/uyeler", label: "Üye", value: o.users, Icon: Users },
    { href: "/yonetim/saticilar", label: "Online Satıcı", value: o.retailers, Icon: Store },
    { href: "/yonetim/teklifler", label: "Teklif", value: o.quotes, Icon: FileText, note: o.newQuotes ? `${o.newQuotes} yeni` : undefined },
    { href: "/yonetim/siparisler", label: "Sipariş", value: o.orders, Icon: ShoppingCart, note: o.openOrders ? `${o.openOrders} işlem bekliyor` : undefined },
    { href: "/yonetim/garantiler", label: "Garanti Kaydı", value: o.warranties, Icon: ShieldCheck },
    { href: "/yonetim/etkinlikler", label: "Etkinlik", value: o.events, Icon: CalendarDays, note: o.upcomingEvents ? `${o.upcomingEvents} yaklaşan` : "yaklaşan etkinlik yok" },
    { href: "/yonetim/haberler", label: "Haber", value: o.news, Icon: Newspaper },
  ];

  return (
    <>
      <AdminPageHeader
        title="Panel"
        description="Satış, teklif ve müşteri özetleri."
      />

      <DashboardCharts summary={summary} onChoose={onChoose} pending={pending} />

      <h2 className="mb-4 mt-10 font-display text-2xl font-bold uppercase">Genel durum</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {cards.map(({ href, label, value, Icon, note }) => (
          <Link key={href} href={href}>
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
          </Link>
        ))}
      </div>

      {noOnlineStock.count > 0 && (
        <AdminCard className="mt-6">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-600" />
            <h2 className="font-display text-xl font-bold uppercase">
              Hiçbir online satıcıda stokta olmayan ürünler
            </h2>
            <Badge tone="amber">{noOnlineStock.count}</Badge>
          </div>
          <p className="mt-1 text-sm text-zw-grey-600">
            Bu ürünlerin sayfasında &quot;online satıcı&quot; bölümü boş görünür. Stok
            matrisinden güncelleyebilirsiniz.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {noOnlineStock.first.map((p) => (
              <Link
                key={p.id}
                href={`/yonetim/stok?sekme=urun&urun=${p.id}`}
                className="rounded-[3px] border border-zw-grey-300 px-2.5 py-1 text-xs font-semibold hover:border-zw-ink"
              >
                {p.name}
              </Link>
            ))}
          </div>
        </AdminCard>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <AdminCard>
          <h2 className="font-display text-xl font-bold uppercase">Son Teklifler</h2>
          <div className="mt-3 divide-y divide-zw-grey-100">
            {recentQuotes.map((q) => (
              <Link
                key={q.id}
                href="/yonetim/teklifler"
                className="flex items-center gap-3 py-2.5 text-sm hover:text-zw-red-600"
              >
                <span className="font-semibold">{q.code}</span>
                <span className="min-w-0 truncate text-zw-grey-600">{q.name}</span>
                <span className="ml-auto shrink-0 text-xs text-zw-grey-400">
                  {formatDate(q.createdAt)}
                </span>
              </Link>
            ))}
            {recentQuotes.length === 0 && (
              <p className="py-3 text-sm text-zw-grey-500">Henüz teklif yok.</p>
            )}
          </div>
        </AdminCard>

        <AdminCard>
          <h2 className="font-display text-xl font-bold uppercase">Son Siparişler</h2>
          <div className="mt-3 divide-y divide-zw-grey-100">
            {recentOrders.map((o) => (
              <Link
                key={o.id}
                href={`/yonetim/siparisler/${o.id}`}
                className="flex items-center gap-3 py-2.5 text-sm hover:text-zw-red-600"
              >
                <span className="font-semibold">{o.code}</span>
                <span className="min-w-0 truncate text-zw-grey-600">{o.customerName}</span>
                <span className="ml-auto shrink-0 font-semibold">
                  {formatPrice(o.total)}
                </span>
              </Link>
            ))}
            {recentOrders.length === 0 && (
              <p className="py-3 text-sm text-zw-grey-500">Henüz sipariş yok.</p>
            )}
          </div>
        </AdminCard>
      </div>
    </>
  );
}
