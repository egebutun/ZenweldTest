import type { Order, OrderStatus, ProductReview, Quote, QuoteStatus, ReturnRequest, ServiceRequest, User, WarrantyRecord } from "@zenweld/data";
import type {
  OrderListFilter,
  OrderListPage,
  QuoteListFilter,
  ReturnListPage,
  ReviewListFilter,
  ReviewListPage,
  ServiceListPage,
  WarrantyListFilter,
  WarrantyListPage,
  WarrantyState,
} from "@zenweld/db";
import { pageOf, searchMatches, type ListPage } from "@zenweld/utils";

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

/** Yeniden eskiye; ayni anda olusanlar koda (ya da kimlige) gore, sunucuyla ayni sira. */
function newestFirst<T>(rows: T[], at: (row: T) => string, tie: (row: T) => string): T[] {
  return [...rows].sort((a, b) => at(b).localeCompare(at(a)) || tie(b).localeCompare(tie(a)));
}

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
  const matching = newestFirst(orders, (o) => o.createdAt, (o) => o.code).filter(
    (o) =>
      (!filter.status || o.status === filter.status) &&
      searchMatches(filter.q ?? "", [o.code, o.customerName, o.email, o.invoice.companyName]),
  );
  return { ...pageOf(matching, filter.page), counts, all: orders.length };
}

/* ------------------------------ Iade talepleri ------------------------------ */

export function returnListPage(requests: ReturnRequest[], page: number): ReturnListPage {
  return {
    ...pageOf(newestFirst(requests, (r) => r.createdAt, (r) => r.code), page),
    newCount: requests.filter((r) => r.status === "new").length,
  };
}

/* ------------------------------ Teklifler ------------------------------ */

const QUOTE_STATUSES: QuoteStatus[] = ["new", "reviewing", "sent", "won", "lost"];

export function quoteListFilter(get: ParamReader): QuoteListFilter {
  const status = get("durum") as QuoteStatus | undefined;
  return { status: status && QUOTE_STATUSES.includes(status) ? status : undefined, page: pageParam(get) };
}

/** Suzgece uyan teklifler (CSV'nin tamami da budur). */
export function matchingQuotes(quotes: Quote[], filter: Omit<QuoteListFilter, "page">): Quote[] {
  return newestFirst(quotes, (q) => q.createdAt, (q) => q.code).filter((q) => !filter.status || q.status === filter.status);
}

export function quoteListPage(quotes: Quote[], filter: QuoteListFilter): ListPage<Quote> {
  return pageOf(matchingQuotes(quotes, filter), filter.page);
}

/* ------------------------------ Servis talepleri ------------------------------ */

export function serviceListPage(requests: ServiceRequest[], page: number): ServiceListPage {
  return {
    ...pageOf(newestFirst(requests, (r) => r.createdAt, (r) => r.code), page),
    newCount: requests.filter((r) => r.status === "new").length,
  };
}

/* ------------------------------ Garantiler ------------------------------ */

const WARRANTY_STATES: WarrantyState[] = ["valid", "expired", "extended"];

/** today: Turkiye gunu (lib/admin-stats.ts › istanbulDateKey). */
export function warrantyListFilter(get: ParamReader, today: string): WarrantyListFilter {
  const state = get("durum") as WarrantyState | undefined;
  return { q: get("ara"), state: state && WARRANTY_STATES.includes(state) ? state : undefined, today, page: pageParam(get) };
}

/** Suzgece uyan garanti kayitlari (CSV'nin tamami da budur). */
export function matchingWarranties(warranties: WarrantyRecord[], filter: Omit<WarrantyListFilter, "page">): WarrantyRecord[] {
  return newestFirst(warranties, (w) => w.registeredAt, (w) => w.id).filter((w) => {
    const expired = w.expiresAt < filter.today;
    if (filter.state === "valid" && expired) return false;
    if (filter.state === "expired" && !expired) return false;
    if (filter.state === "extended" && !w.extended) return false;
    return searchMatches(filter.q ?? "", [w.serialNumber, w.ownerName, w.email]);
  });
}

export function warrantyListPage(warranties: WarrantyRecord[], users: User[], filter: WarrantyListFilter): WarrantyListPage {
  const page = pageOf(matchingWarranties(warranties, filter), filter.page);
  const memberEmails = new Set(users.filter((u) => u.role !== "admin").map((u) => u.email.toLowerCase()));
  const shown = [...new Set(page.rows.map((w) => w.email.toLowerCase()))];
  return {
    ...page,
    all: warranties.length,
    valid: warranties.filter((w) => w.expiresAt >= filter.today).length,
    members: shown.filter((e) => memberEmails.has(e)),
  };
}

/* ------------------------------ Yorumlar ------------------------------ */

export function reviewListFilter(get: ParamReader): ReviewListFilter {
  return { q: get("ara"), pending: get("bekleyen") === "1", page: pageParam(get) };
}

/** featuredCount: anasayfada gorunebilen one cikarilmislar (packages/store › featuredReviewCount). */
export function reviewListPage(reviews: ProductReview[], featuredCount: number, filter: ReviewListFilter): ReviewListPage {
  const matching = newestFirst(reviews, (r) => r.createdAt, (r) => r.id).filter(
    (r) => (!filter.pending || !r.approved) && searchMatches(filter.q ?? "", [r.authorName, r.body]),
  );
  return { ...pageOf(matching, filter.page), pendingCount: reviews.filter((r) => !r.approved).length, featuredCount };
}
