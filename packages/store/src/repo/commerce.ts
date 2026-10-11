"use client";

import type { Order, Quote, ZenweldDatabase } from "@zenweld/data";
import { getSnapshot, mutate, uid } from "../database";
import { nowIso } from "./shared";

/* ------------------------------------------------------------------ */
/* Teklifler ve siparisler                                             */
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

export function listOrders(db: ZenweldDatabase = getSnapshot()): Order[] {
  return [...db.orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function ordersForUser(userId: string, db: ZenweldDatabase = getSnapshot()): Order[] {
  return listOrders(db).filter((o) => o.userId === userId);
}

export function createOrder(order: Omit<Order, "id" | "code" | "createdAt">): Order {
  const db = getSnapshot();
  const seq = String(db.orders.length + 1).padStart(4, "0");
  const record: Order = {
    ...order,
    id: uid("o"),
    code: `SIP-${new Date().getFullYear()}-${seq}`,
    createdAt: nowIso(),
  };
  mutate((draft) => {
    draft.orders.unshift(record);
  });
  return record;
}

export function saveOrder(order: Order): void {
  mutate((db) => {
    const idx = db.orders.findIndex((o) => o.id === order.id);
    if (idx >= 0) db.orders[idx] = order;
  });
}
