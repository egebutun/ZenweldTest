"use client";

import type { Order, OrderStatus, Quote, ZenweldDatabase } from "@zenweld/data";
import { getSnapshot, mutate, uid } from "../database";
import { nowIso } from "./shared";

/* ------------------------------------------------------------------ */
/* Teklifler                                                           */
/* ------------------------------------------------------------------ */

export function listQuotes(db: ZenweldDatabase = getSnapshot()): Quote[] {
  return [...db.quotes].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function quotesForUser(
  userId: string,
  db: ZenweldDatabase = getSnapshot(),
): Quote[] {
  return listQuotes(db).filter((q) => q.userId === userId);
}

export function createQuote(quote: Omit<Quote, "id" | "code" | "createdAt" | "updatedAt">): Quote {
  const db = getSnapshot();
  const seq = String(db.quotes.length + 1).padStart(4, "0");
  const record: Quote = {
    ...quote,
    id: uid("q"),
    code: `TKL-${new Date().getFullYear()}-${seq}`,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  mutate((draft) => {
    draft.quotes.unshift(record);
  });
  return record;
}

export function saveQuote(quote: Quote): void {
  mutate((db) => {
    const idx = db.quotes.findIndex((q) => q.id === quote.id);
    if (idx >= 0) db.quotes[idx] = { ...quote, updatedAt: nowIso() };
  });
}

export function deleteQuote(id: string): void {
  mutate((db) => {
    db.quotes = db.quotes.filter((q) => q.id !== id);
  });
}

/* ------------------------------------------------------------------ */
/* Online siparisler                                                   */
/* ------------------------------------------------------------------ */

export function listOrders(db: ZenweldDatabase = getSnapshot()): Order[] {
  return [...db.orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function ordersForUser(userId: string, db: ZenweldDatabase = getSnapshot()): Order[] {
  return listOrders(db).filter((o) => o.userId === userId);
}

export function findOrder(id: string, db: ZenweldDatabase = getSnapshot()): Order | undefined {
  return db.orders.find((o) => o.id === id);
}

export type NewOrder = Omit<
  Order,
  "id" | "code" | "status" | "history" | "createdAt" | "updatedAt"
>;

/**
 * Siparisi kaydeder. Kartla odenen siparis dogrudan "Hazirlaniyor"a,
 * havale/EFT siparisi "Odeme Bekleniyor"a duser.
 */
export function placeOrder(order: NewOrder): Order {
  const db = getSnapshot();
  const year = new Date().getFullYear();
  const prefix = `SIP-${year}-`;
  const last = db.orders
    .filter((o) => o.code.startsWith(prefix))
    .reduce((max, o) => Math.max(max, Number(o.code.slice(prefix.length)) || 0), 0);
  const at = nowIso();
  const status: OrderStatus = order.payment.method === "card" ? "preparing" : "awaiting_payment";
  const record: Order = {
    ...order,
    id: uid("o"),
    code: `${prefix}${String(last + 1).padStart(5, "0")}`,
    status,
    history: [{ status, at }],
    createdAt: at,
    updatedAt: at,
  };
  mutate((draft) => {
    draft.orders.unshift(record);
  });
  return record;
}

function updateOrder(id: string, update: (order: Order, at: string) => void): void {
  mutate((db) => {
    const order = db.orders.find((o) => o.id === id);
    if (!order) return;
    const at = nowIso();
    update(order, at);
    order.updatedAt = at;
  });
}

function pushStatus(order: Order, status: OrderStatus, at: string, note?: string): void {
  order.status = status;
  order.history.push({ status, at, ...(note ? { note } : {}) });
}

/** Havale/EFT odemesi hesaba gecti: siparis hazirlanmaya baslar. */
export function markOrderPaid(id: string): void {
  updateOrder(id, (o, at) => {
    if (o.status !== "awaiting_payment") return;
    o.payment = { ...o.payment, paidAt: at };
    pushStatus(o, "preparing", at);
  });
}

/** Kargoya verildi: firma ve takip numarasi musteriye gosterilir. */
export function shipOrder(id: string, carrier: string, trackingNumber: string): void {
  updateOrder(id, (o, at) => {
    o.shipment = { carrier, trackingNumber, shippedAt: o.shipment?.shippedAt ?? at };
    if (o.status === "preparing") pushStatus(o, "shipped", at);
  });
}

export function markOrderDelivered(id: string): void {
  updateOrder(id, (o, at) => {
    if (o.status !== "shipped") return;
    if (o.shipment) o.shipment.deliveredAt = at;
    pushStatus(o, "delivered", at);
  });
}

export function cancelOrder(id: string, note?: string): void {
  updateOrder(id, (o, at) => {
    if (o.status === "delivered" || o.status === "cancelled") return;
    pushStatus(o, "cancelled", at, note);
  });
}

export function saveOrderAdminNote(id: string, adminNote: string): void {
  updateOrder(id, (o) => {
    o.adminNote = adminNote || undefined;
  });
}

/** Suresi dolan havale siparisine yazilan not (musteri sayfasinda cevrilir). */
export const PAYMENT_EXPIRED_NOTE = "Ödeme süresi doldu";

/**
 * Odeme suresi dolan havale/EFT siparislerini iptal eder.
 *
 * Sunucu olmadigi icin bu kontrol siparis sayfalari acildiginda yapilir;
 * gercek sistemde gunluk zamanlanmis bir is olacak.
 */
export function cancelExpiredTransfers(now: Date = new Date()): void {
  const db = getSnapshot();
  const expired = db.orders.filter(
    (o) =>
      o.status === "awaiting_payment" &&
      o.payment.dueAt &&
      new Date(o.payment.dueAt).getTime() < now.getTime(),
  );
  if (expired.length === 0) return;
  const ids = new Set(expired.map((o) => o.id));
  mutate((draft) => {
    const at = nowIso();
    draft.orders
      .filter((o) => ids.has(o.id))
      .forEach((o) => {
        pushStatus(o, "cancelled", at, PAYMENT_EXPIRED_NOTE);
        o.updatedAt = at;
      });
  });
}
