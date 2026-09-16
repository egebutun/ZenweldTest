"use client";

import type { OrderStatus } from "@zenweld/data";
import { saveOrder, useDatabase } from "@zenweld/store";
import { Badge, Select } from "@zenweld/ui";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { formatDateTime, formatPrice } from "@/lib/format";

const STATUS: { id: OrderStatus; label: string }[] = [
  { id: "pending", label: "Hazırlanıyor" },
  { id: "confirmed", label: "Onaylandı" },
  { id: "shipped", label: "Kargoda" },
  { id: "delivered", label: "Teslim Edildi" },
  { id: "cancelled", label: "İptal" },
];

export default function AdminOrdersPage() {
  const db = useDatabase();
  const orders = [...db.orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <>
      <AdminPageHeader title="Siparişler" description={`${orders.length} sipariş`} />

      <div className="overflow-x-auto rounded-[4px] border border-zw-grey-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-zw-grey-50 text-left text-xs uppercase tracking-wide text-zw-grey-600">
            <tr>
              <th className="px-4 py-3">Sipariş</th>
              <th className="px-4 py-3">Müşteri</th>
              <th className="px-4 py-3">Kanal</th>
              <th className="px-4 py-3">Ürünler</th>
              <th className="px-4 py-3">Tutar</th>
              <th className="px-4 py-3">Durum</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zw-grey-100">
            {orders.map((o) => (
              <tr key={o.id}>
                <td className="px-4 py-2.5">
                  <div className="font-semibold">{o.code}</div>
                  <div className="text-xs text-zw-grey-500">
                    {formatDateTime(o.createdAt, "tr")}
                  </div>
                </td>
                <td className="px-4 py-2.5">
                  <div className="font-semibold">{o.customerName}</div>
                  <div className="text-xs text-zw-grey-500">{o.email}</div>
                  <div className="text-xs text-zw-grey-400">{o.city}</div>
                </td>
                <td className="px-4 py-2.5">
                  <Badge tone={o.channel === "zenweld" ? "red" : "grey"}>
                    {o.channel === "zenweld" ? "Zenweld (Bayi)" : "ZENWELD-BAYİ-A"}
                  </Badge>
                </td>
                <td className="px-4 py-2.5 text-xs text-zw-grey-600">
                  {o.items.map((i, idx) => (
                    <div key={idx}>
                      {i.quantity} × {i.productName}
                    </div>
                  ))}
                </td>
                <td className="px-4 py-2.5 font-semibold">{formatPrice(o.total, "tr")}</td>
                <td className="px-4 py-2.5">
                  <Select
                    value={o.status}
                    onChange={(e) =>
                      saveOrder({ ...o, status: e.target.value as OrderStatus })
                    }
                    className="w-40 py-1.5 text-xs"
                  >
                    {STATUS.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </Select>
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-zw-grey-500">
                  Henüz sipariş yok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
