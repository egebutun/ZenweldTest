import type { OrderStatus } from "@zenweld/data";
import { Badge } from "@zenweld/ui";

/** Panelde siparis durumlarinin adi ve rengi (panel yalnizca Turkce). */
export const ORDER_STATUS: Record<OrderStatus, { label: string; tone: "amber" | "grey" | "dark" | "green" | "outline" }> = {
  awaiting_payment: { label: "Ödeme Bekleniyor", tone: "amber" },
  preparing: { label: "Hazırlanıyor", tone: "grey" },
  shipped: { label: "Kargoda", tone: "dark" },
  delivered: { label: "Teslim Edildi", tone: "green" },
  cancelled: { label: "İptal", tone: "outline" },
};

export function AdminOrderStatus({ status }: { status: OrderStatus }) {
  const s = ORDER_STATUS[status];
  return <Badge tone={s.tone}>{s.label}</Badge>;
}
