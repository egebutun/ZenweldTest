import type { Order, OrderStatus, ReturnRequest } from "@zenweld/data";
import type { OrderListFilter, OrderListPage, ReturnListPage } from "@zenweld/db";
import { pageOf, searchMatches } from "@zenweld/utils";

/**
 * PANEL LISTELERI — ADRESTEKI SUZGECLER VE DEMO MODUNDA HESAP
 *
 * Suzgecler ve sayfa adreste durur (?durum=…&ara=…&sayfa=2): geri tusu
 * calisir, baglanti paylasilir. Veritabani modunda sunucu sayfasi bu
 * suzgeclerle yalnizca bir sayfayi okur (packages/db › readOrdersPage …);
 * demo modunda ayni kurallar tarayicidaki kayitlara uygulanir (asagidaki
 * *ListPage fonksiyonlari). Sayfa basina 50 kayit (@zenweld/utils › paging).
 */

/** Adresteki bir degeri okur (bos ise undefined). */
export type ParamReader = (name: string) => string | undefined;

/** Sunucu sayfasinin searchParams nesnesi icin okuyucu. */
export function readerOf(params: Record<string, string | string[] | undefined>): ParamReader {
  return (name) => {
    const value = params[name];
    const text = (Array.isArray(value) ? value[0] : value)?.trim();
    return text ? text.slice(0, 100) : undefined;
  };
}

export function pageParam(get: ParamReader): number {
  const n = Number(get("sayfa"));
  return Number.isSafeInteger(n) && n > 0 ? n : 1;
}

/** Yeniden eskiye; ayni anda olusanlar koda gore (sunucuyla ayni sira). */
const newestFirst = <T extends { createdAt: string; code: string }>(rows: T[]) =>
  [...rows].sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.code.localeCompare(a.code));

/* ------------------------------ Siparisler ------------------------------ */

export const ORDER_STATUSES: OrderStatus[] = ["awaiting_payment", "preparing", "shipped", "delivered", "cancelled"];

export function orderListFilter(get: ParamReader): OrderListFilter {
  const status = get("durum") as OrderStatus | undefined;
  return {
    status: status && ORDER_STATUSES.includes(status) ? status : undefined,
    q: get("ara"),
    page: pageParam(get),
  };
}

export function orderListPage(orders: Order[], filter: OrderListFilter): OrderListPage {
  const counts = Object.fromEntries(ORDER_STATUSES.map((s) => [s, 0])) as Record<OrderStatus, number>;
  orders.forEach((o) => counts[o.status]++);
  const matching = newestFirst(orders).filter(
    (o) =>
      (!filter.status || o.status === filter.status) &&
      searchMatches(filter.q ?? "", [o.code, o.customerName, o.email, o.invoice.companyName]),
  );
  return { ...pageOf(matching, filter.page), counts, all: orders.length };
}

/* ------------------------------ Iade talepleri ------------------------------ */

export function returnListPage(requests: ReturnRequest[], page: number): ReturnListPage {
  return { ...pageOf(newestFirst(requests), page), newCount: requests.filter((r) => r.status === "new").length };
}
