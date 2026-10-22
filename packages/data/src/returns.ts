import type { Order, ReturnRequest, UserRole } from "./types";

/**
 * IADE (CAYMA) TALEBI KURALLARI
 *
 * Bireysel uye, teslim edilen siparisi icin teslim gununden itibaren 14 gun
 * icinde iade talebi acar; kurumsal uyede yoktur (KARARLAR K-65). Para
 * iadesi panelden yapilmaz, banka uzerinden ayrica yapilir (K-27).
 */

export const RETURN_WINDOW_DAYS = 14;

/** Bu durumdaki talep varken ayni siparise yeni talep acilamaz. */
const OPEN_STATUSES: ReturnRequest["status"][] = ["new", "reviewing"];

/** Teslim ani: kargo kaydindaki teslim tarihi, yoksa durum gecmisindeki teslim. */
export function deliveredAt(order: Order): string | undefined {
  return order.shipment?.deliveredAt ?? order.history.findLast((e) => e.status === "delivered")?.at;
}

/** Son talep ani: teslim gunu + 14 gun, o gunun sonu (yerel saat). */
export function returnDeadline(order: Order): Date | undefined {
  const at = deliveredAt(order);
  if (!at) return undefined;
  const d = new Date(at);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + RETURN_WINDOW_DAYS, 23, 59, 59, 999);
}

/** Satir satir iade edilebilecek adet: siparis adedi - reddedilmemis taleplerdeki adet. */
export function returnableQuantities(order: Order, requests: ReturnRequest[]): number[] {
  const used = order.items.map(() => 0);
  requests
    .filter((r) => r.orderId === order.id && r.status !== "rejected")
    .forEach((r) =>
      r.items.forEach((item) => {
        if (used[item.line] !== undefined) used[item.line] += item.quantity;
      }),
    );
  return order.items.map((item, i) => Math.max(0, item.quantity - used[i]));
}

/**
 * Bu siparise su an iade talebi acilabilir mi: bireysel uye, siparis teslim
 * edilmis, sure dolmamis, acik talep yok ve iade edilecek urun kalmis.
 */
export function canRequestReturn(
  order: Order,
  role: UserRole,
  requests: ReturnRequest[],
  now: Date = new Date(),
): boolean {
  if (role !== "individual" || order.status !== "delivered") return false;
  const deadline = returnDeadline(order);
  if (!deadline || now > deadline) return false;
  const own = requests.filter((r) => r.orderId === order.id);
  if (own.some((r) => OPEN_STATUSES.includes(r.status))) return false;
  return returnableQuantities(order, own).some((q) => q > 0);
}
