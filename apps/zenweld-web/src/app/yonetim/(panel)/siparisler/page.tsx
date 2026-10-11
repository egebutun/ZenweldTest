"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CreditCard, Landmark, Search } from "lucide-react";
import type { OrderStatus } from "@zenweld/data";
import { cancelExpiredTransfers, listOrders, useDatabase } from "@zenweld/store";
import { Input } from "@zenweld/ui";
import { formatDateTime, formatPrice } from "@zenweld/utils";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { AdminOrderStatus, ORDER_STATUS } from "@/components/admin/order-status";

/**
 * SIPARISLER — uyelerin ana sitede verdigi online siparisler.
 *
 * Isi bekleyenler once: "Odeme Bekleniyor" (havale kontrolu) ve
 * "Hazirlaniyor" (kargoya verilecek). Satira tiklayinca siparis detayi
 * acilir; odeme onayi, kargo takip no ve teslim orada girilir.
 */
export default function AdminOrdersPage() {
  const db = useDatabase();
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [query, setQuery] = useState("");

  // Odeme suresi dolan havale siparisleri iptal edilir (sunucu yok).
  useEffect(() => cancelExpiredTransfers(), []);

  const all = listOrders(db);
  const counts = Object.fromEntries(Object.keys(ORDER_STATUS).map((s) => [s, 0])) as Record<OrderStatus, number>;
  all.forEach((o) => counts[o.status]++);

  const q = query.trim().toLocaleLowerCase("tr");
  const orders = all
    .filter((o) => filter === "all" || o.status === filter)
    .filter(
      (o) =>
        !q ||
        [o.code, o.customerName, o.email, o.invoice.companyName ?? ""].some((v) =>
          v.toLocaleLowerCase("tr").includes(q),
        ),
    );

  const tab = (id: OrderStatus | "all", label: string, count: number) => (
    <button
      key={id}
      type="button"
      onClick={() => setFilter(id)}
      className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
        filter === id ? "bg-zw-ink text-white" : "bg-white text-zw-grey-700 hover:bg-zw-grey-100"
      }`}
    >
      {label} <span className="opacity-60">{count}</span>
    </button>
  );

  return (
    <>
      <AdminPageHeader
        title="Siparişler"
        description="Üyelerin sitede verdiği online siparişler. Havale ödemesini onaylamak, kargo takip numarası girmek için siparişi açın."
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {tab("all", "Tümü", all.length)}
        {(Object.keys(ORDER_STATUS) as OrderStatus[]).map((s) => tab(s, ORDER_STATUS[s].label, counts[s]))}
        <div className="relative ml-auto w-full sm:w-72">
          <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-zw-grey-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Sipariş no, müşteri, e-posta…"
            className="pl-9"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-[4px] border border-zw-grey-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-zw-grey-50 text-left text-xs uppercase tracking-wide text-zw-grey-600">
            <tr>
              <th className="px-4 py-3">Sipariş</th>
              <th className="px-4 py-3">Müşteri</th>
              <th className="px-4 py-3">Ürünler</th>
              <th className="px-4 py-3">Ödeme</th>
              <th className="px-4 py-3 text-right">Tutar</th>
              <th className="px-4 py-3">Durum</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zw-grey-100">
            {orders.map((o) => (
              <tr key={o.id} className="hover:bg-zw-grey-50">
                <td className="px-4 py-2.5">
                  <Link href={`/yonetim/siparisler/${o.id}`} className="font-semibold text-zw-red-700 hover:underline">
                    {o.code}
                  </Link>
                  <div className="text-xs text-zw-grey-500">{formatDateTime(o.createdAt, "tr")}</div>
                </td>
                <td className="px-4 py-2.5">
                  <div className="font-semibold">{o.invoice.companyName ?? o.customerName}</div>
                  <div className="text-xs text-zw-grey-500">{o.email}</div>
                  <div className="text-xs text-zw-grey-400">{o.shippingAddress.city}</div>
                </td>
                <td className="px-4 py-2.5 text-xs text-zw-grey-600">
                  {o.items.map((i, idx) => (
                    <div key={idx}>
                      {i.quantity} × {i.productName}
                      {i.variantLabel && <span className="text-zw-grey-400"> ({i.variantLabel.tr})</span>}
                    </div>
                  ))}
                </td>
                <td className="px-4 py-2.5 text-xs text-zw-grey-600">
                  {o.payment.method === "card" ? (
                    <span className="flex items-center gap-1.5">
                      <CreditCard size={14} />
                      Kart{(o.payment.installments ?? 1) > 1 ? ` · ${o.payment.installments} taksit` : ""}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <Landmark size={14} />
                      Havale/EFT
                    </span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-right font-semibold">{formatPrice(o.total, "tr")}</td>
                <td className="px-4 py-2.5">
                  <AdminOrderStatus status={o.status} />
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-zw-grey-500">
                  {all.length === 0 ? "Henüz sipariş yok." : "Bu filtreye uyan sipariş yok."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
