import type { Order, OrderPayment, ReturnRequest } from "@zenweld/data";
import type { Dictionary } from "@zenweld/i18n";
import { formatPrice } from "@zenweld/utils";

/**
 * SIPARIS METINLERI (sayfalar ve sunucu)
 *
 * Siparis ve iade talebinin ekranda ve info@zenweld.com bildiriminde
 * gorunen ozet metinleri. Veritabani modunda bildirimi kaydi yapan sunucu
 * gonderir (Asama 5.2); demo modunda tarayici. T.C. kimlik no ve kart
 * bilgisi bildirime yazilmaz.
 */

/**
 * Odeme satiri ("Visa •••• 1111 · 3 taksit"). Odeme sayfasinda onaylanan
 * sozlesme ile siparisten acilan kopya ayni metni gostersin diye tek yerde.
 */
export function paymentSummary(payment: OrderPayment, t: Dictionary): string {
  if (payment.method === "transfer") return t.orders.transfer;
  const card = payment.cardLast4
    ? t.orders.cardPayment
        .replace("{brand}", payment.cardBrand ?? "")
        .replace("{last4}", payment.cardLast4)
        .trim()
    : t.checkout.card;
  const plan =
    (payment.installments ?? 1) > 1
      ? t.orders.installments.replace("{count}", String(payment.installments))
      : t.orders.singlePayment;
  return `${card} · ${plan}`;
}

/** info@zenweld.com'a giden "Yeni sipariş" bildiriminin alanlari (lib/server/notify.ts › siparis). */
export function orderNotice(order: Order, t: Dictionary) {
  const a = order.shippingAddress;
  const inv = order.invoice;
  return {
    code: order.code,
    customer: order.customerName,
    email: order.email,
    phone: order.phone,
    items: order.items.map(
      (i) => `${i.quantity} × ${i.productName}${i.variantLabel ? ` (${i.variantLabel})` : ""} — ${formatPrice(i.unitPrice * i.quantity)}`,
    ),
    coupon: order.coupon ? `${order.coupon.code} (−${formatPrice(order.coupon.discount)})` : undefined,
    total: formatPrice(order.total),
    payment: paymentSummary(order.payment, t),
    shipping: `${a.fullName}, ${a.line}, ${a.district} / ${a.city}`,
    invoice: inv.type === "corporate" ? `${inv.companyName} — ${inv.taxOffice} / ${inv.taxNumber}` : `Bireysel: ${inv.fullName}`,
    note: order.customerNote,
  };
}

/** "Yeni iade talebi" bildiriminin alanlari (lib/server/notify.ts › iade). */
export function returnNotice(request: ReturnRequest, t: Dictionary) {
  return {
    code: request.code,
    order: request.orderCode,
    customer: request.customerName,
    email: request.email,
    phone: request.phone,
    items: request.items.map((i) => `${i.quantity} × ${i.productName}${i.variantLabel ? ` (${i.variantLabel})` : ""} — ${i.sku}`),
    reason: t.returns.reasons[request.reason],
    note: request.note,
  };
}
