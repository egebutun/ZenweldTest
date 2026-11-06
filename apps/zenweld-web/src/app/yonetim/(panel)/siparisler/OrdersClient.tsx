"use client";

import Link from "next/link";
import { CreditCard, Landmark } from "lucide-react";
import type { OrderStatus } from "@zenweld/data";
import type { OrderListPage } from "@zenweld/db";
import { listOrders, useDatabase } from "@zenweld/store";
import { formatDateTime, formatPrice } from "@zenweld/utils";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { ListPager, ListSearch, useListQuery } from "@/components/admin/ListControls";
import { AdminOrderStatus, ORDER_STATUS } from "@/components/admin/order-status";
import { ORDER_STATUSES, orderListFilter, orderListPage } from "@/lib/admin-lists";
import { useDemoExpiredTransfers } from "@/lib/admin-sales";

/**
 * SIPARISLER — uyelerin ana sitede verdigi online siparisler.
 *
 * Isi bekleyenler once: "Odeme Bekleniyor" (havale kontrolu) ve
 * "Hazirlaniyor" (kargoya verilecek). Satira tiklayinca siparis detayi
 * acilir; odeme onayi, kargo takip no ve teslim orada girilir.
 *
 * Sayfa basina 50 siparis; durum, arama ve sayfa adreste durur. Veritabani
 * modunda sunucu yalnizca bu sayfayi okur (page prop); demo modunda ayni
 * kurallar tarayicidaki siparislere uygulanir (lib/admin-lists.ts).
 */
export function OrdersClient({ page }: { page?: OrderListPage }) {
  const db = useDatabase();
  const list = useListQuery();
  const filter = orderListFilter(list.get);

  // Odeme suresi dolan havale siparisleri iptal edilir (veritabani modunda sunucu yapar).
  useDemoExpiredTransfers();

  const data = page ?? orderListPage(listOrders(db), filter);
  const orders = data.rows;
  const current = filter.status ?? "all";

  const tab = (id: OrderStatus | "all", label: string, count: number) => (
    <button
      key={id}
      type="button"
      aria-pressed={current === id}
      onClick={() => list.go({ durum: id === "all" ? undefined : id })}
      className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
        current === id ? "bg-zw-ink text-white" : "bg-white text-zw-grey-700 hover:bg-zw-grey-100"
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
        {tab("all", "Tümü", data.all)}
        {ORDER_STATUSES.map((s) => tab(s, ORDER_STATUS[s].label, data.counts[s]))}
        <div className="ml-auto w-full sm:w-auto">
          <ListSearch
            value={filter.q}
            onSearch={(q) => list.go({ ara: q }, true)}
            placeholder="Sipariş no, müşteri, e-posta…"
            label="Siparişlerde ara"
          />
        </div>
      </div>

      <div
        className={`overflow-x-auto rounded-[4px] border border-zw-grey-200 bg-white transition-opacity ${list.pending ? "opacity-60" : ""}`}
        aria-busy={list.pending}
      >
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
                  <div className="text-xs text-zw-grey-500">{formatDateTime(o.createdAt)}</div>
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
                      {i.variantLabel && <span className="text-zw-grey-400"> ({i.variantLabel})</span>}
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
                <td className="px-4 py-2.5 text-right font-semibold">{formatPrice(o.total)}</td>
                <td className="px-4 py-2.5">
                  <AdminOrderStatus status={o.status} />
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-zw-grey-500">
                  {data.all === 0 ? "Henüz sipariş yok." : "Bu filtreye uyan sipariş yok."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <ListPager page={data.page} total={data.total} hrefFor={(p) => list.hrefWith({ sayfa: p > 1 ? String(p) : undefined })} />
    </>
  );
}
