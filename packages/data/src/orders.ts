import type { Order } from "./types";

/**
 * SIPARIS TARIH KURALLARI (site, panel ve sunucu)
 *
 * Gun sonu ve yil Turkiye saatine gore hesaplanir (UTC+3; Turkiye 2016'dan
 * beri yaz saatine gecmiyor). Tarayici musterinin saatini, sunucu UTC'yi
 * kullanir; ikisi ayni sonucu versin diye saat dilimi burada sabittir.
 */

const TURKEY_OFFSET_MS = 3 * 60 * 60 * 1000;

/** Verilen anin Turkiye'deki gunu + addDays gunun sonu (23:59:59.999). */
export function turkeyDayEnd(at: Date, addDays = 0): Date {
  const local = new Date(at.getTime() + TURKEY_OFFSET_MS);
  return new Date(
    Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() + addDays, 23, 59, 59, 999) -
      TURKEY_OFFSET_MS,
  );
}

/** Verilen anin Turkiye'deki yili (kayit numaralarinda). */
export const turkeyYear = (at: Date) => new Date(at.getTime() + TURKEY_OFFSET_MS).getUTCFullYear();

/** Kayit numarasi onekleri: SIP-2026-00042, IAD-2026-0007. */
export const orderCodePrefix = (at: Date) => `SIP-${turkeyYear(at)}-`;
export const returnCodePrefix = (at: Date) => `IAD-${turkeyYear(at)}-`;
export const ORDER_CODE_DIGITS = 5;
export const RETURN_CODE_DIGITS = 4;

/** Suresi dolan havale siparisine yazilan iptal notu. */
export const PAYMENT_EXPIRED_NOTE = "Ödeme süresi doldu";

/**
 * Havale/EFT odeme suresi doldu mu? Musteriye son odeme GUNU gosterildigi
 * icin sure o gunun sonunda (Turkiye saatiyle 23:59) dolar, siparis
 * saatinde degil.
 */
export function isTransferExpired(order: Pick<Order, "status" | "payment">, now: Date = new Date()): boolean {
  if (order.status !== "awaiting_payment" || !order.payment.dueAt) return false;
  return now.getTime() > turkeyDayEnd(new Date(order.payment.dueAt)).getTime();
}
