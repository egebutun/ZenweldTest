"use client";

import type {
  Dealer,
  DealerStock,
  NewsItem,
  Order,
  Product,
  Quote,
  Retailer,
  RetailerStock,
  User,
  ZenweldDatabase,
  ZenweldEvent,
} from "@zenweld/data";
import { getSnapshot, mutate } from "./database";

const nowIso = () => new Date().toISOString();

const uid = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

/* ------------------------------------------------------------------ */
/* Urunler                                                             */
/* ------------------------------------------------------------------ */

export function listProducts(db: ZenweldDatabase = getSnapshot()): Product[] {
  return db.products.filter((p) => p.active);
}

export function listAllProducts(db: ZenweldDatabase = getSnapshot()): Product[] {
  return db.products;
}

export function findProductBySlug(
  slug: string,
  db: ZenweldDatabase = getSnapshot(),
): Product | undefined {
  return db.products.find((p) => p.slug === slug);
}

export function findProductById(
  id: string,
  db: ZenweldDatabase = getSnapshot(),
): Product | undefined {
  return db.products.find((p) => p.id === id);
}

export function saveProduct(product: Product): void {
  mutate((db) => {
    const idx = db.products.findIndex((p) => p.id === product.id);
    const next = { ...product, updatedAt: nowIso() };
    if (idx >= 0) db.products[idx] = next;
    else db.products.unshift({ ...next, createdAt: nowIso() });
  });
}

export function createProduct(partial: Partial<Product>): Product {
  const id = partial.id ?? uid("p");
  const product: Product = {
    id,
    slug: partial.slug ?? id,
    sku: partial.sku ?? "ZW-YENI",
    name: partial.name ?? "Yeni Ürün",
    section: partial.section ?? "ekipmanlar",
    categorySlug: partial.categorySlug ?? "multi-process",
    processes: partial.processes ?? [],
    shortDescription: partial.shortDescription ?? { tr: "", en: "" },
    description: partial.description ?? { tr: "", en: "" },
    priceExVat: partial.priceExVat ?? 0,
    vatRate: partial.vatRate ?? 20,
    currency: "TRY",
    images: partial.images ?? [],
    specs: partial.specs ?? [],
    inTheBox: partial.inTheBox ?? [],
    highlights: partial.highlights ?? [],
    inStock: partial.inStock ?? true,
    quotable: partial.quotable ?? true,
    featured: partial.featured ?? false,
    isNew: partial.isNew ?? true,
    warrantyMonths: partial.warrantyMonths ?? 24,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    active: partial.active ?? true,
    modelCode: partial.modelCode,
    manualUrl: partial.manualUrl,
  };
  mutate((db) => {
    db.products.unshift(product);
  });
  return product;
}

export function deleteProduct(id: string): void {
  mutate((db) => {
    db.products = db.products.filter((p) => p.id !== id);
    db.retailerStock = db.retailerStock.filter((s) => s.productId !== id);
    db.dealerStock = db.dealerStock.filter((s) => s.productId !== id);
  });
}

/* ------------------------------------------------------------------ */
/* Online satici stogu — urun sayfasinin kalbi                         */
/* ------------------------------------------------------------------ */

export interface RetailerWithStock {
  retailer: Retailer;
  stock: RetailerStock;
}

/** Bir urunun STOKTA OLDUGU online saticilar. */
export function retailersInStockFor(
  productId: string,
  db: ZenweldDatabase = getSnapshot(),
): RetailerWithStock[] {
  return db.retailerStock
    .filter((s) => s.productId === productId && s.inStock)
    .map((stock) => {
      const retailer = db.retailers.find((r) => r.id === stock.retailerId);
      return retailer && retailer.active ? { retailer, stock } : null;
    })
    .filter((x): x is RetailerWithStock => x !== null)
    .sort((a, b) => {
      if (a.retailer.isOwnStore !== b.retailer.isOwnStore) {
        return a.retailer.isOwnStore ? -1 : 1;
      }
      return a.retailer.name.localeCompare(b.retailer.name, "tr");
    });
}

/** Bir saticinin tum stok kayitlari (bayi paneli / admin icin). */
export function stockForRetailer(
  retailerId: string,
  db: ZenweldDatabase = getSnapshot(),
): RetailerStock[] {
  return db.retailerStock.filter((s) => s.retailerId === retailerId);
}

export function getRetailerStock(
  productId: string,
  retailerId: string,
  db: ZenweldDatabase = getSnapshot(),
): RetailerStock | undefined {
  return db.retailerStock.find(
    (s) => s.productId === productId && s.retailerId === retailerId,
  );
}

export function setRetailerStock(
  productId: string,
  retailerId: string,
  patch: Partial<Omit<RetailerStock, "productId" | "retailerId">>,
): void {
  mutate((db) => {
    const idx = db.retailerStock.findIndex(
      (s) => s.productId === productId && s.retailerId === retailerId,
    );
    if (idx >= 0) {
      db.retailerStock[idx] = {
        ...db.retailerStock[idx],
        ...patch,
        updatedAt: nowIso(),
      };
    } else {
      const retailer = db.retailers.find((r) => r.id === retailerId);
      const product = db.products.find((p) => p.id === productId);
      db.retailerStock.push({
        productId,
        retailerId,
        inStock: patch.inStock ?? false,
        quantity: patch.quantity,
        price: patch.price,
        productUrl:
          patch.productUrl ??
          (retailer?.isOwnStore
            ? `${(retailer?.websiteUrl ?? "").replace(/\/$/, "")}/tr/urun/${product?.slug ?? ""}`
            : `${(retailer?.websiteUrl ?? "").replace(/\/$/, "")}/urun/${product?.slug ?? ""}`),
        updatedAt: nowIso(),
      });
    }
  });
}

/** Bir saticinin tum urunlerini toplu isaretle/temizle. */
export function bulkSetRetailerStock(
  retailerId: string,
  productIds: string[],
  inStock: boolean,
): void {
  productIds.forEach((productId) => setRetailerStock(productId, retailerId, { inStock }));
}

/** Bir urunun en son stok guncelleme zamani. */
export function lastStockUpdate(
  productId: string,
  db: ZenweldDatabase = getSnapshot(),
): string | undefined {
  const times = db.retailerStock
    .filter((s) => s.productId === productId)
    .map((s) => s.updatedAt)
    .sort();
  return times[times.length - 1];
}

/* ------------------------------------------------------------------ */
/* Bayiler                                                             */
/* ------------------------------------------------------------------ */

export function listDealers(db: ZenweldDatabase = getSnapshot()): Dealer[] {
  return db.dealers.filter((d) => d.active);
}

export function dealersWithProduct(
  productId: string,
  db: ZenweldDatabase = getSnapshot(),
): Set<string> {
  return new Set(
    db.dealerStock
      .filter((s) => s.productId === productId && s.inStock)
      .map((s) => s.dealerId),
  );
}

export function getDealerStock(
  productId: string,
  dealerId: string,
  db: ZenweldDatabase = getSnapshot(),
): DealerStock | undefined {
  return db.dealerStock.find((s) => s.productId === productId && s.dealerId === dealerId);
}

export function setDealerStock(
  productId: string,
  dealerId: string,
  inStock: boolean,
  quantity?: number,
): void {
  mutate((db) => {
    const idx = db.dealerStock.findIndex(
      (s) => s.productId === productId && s.dealerId === dealerId,
    );
    if (idx >= 0) {
      db.dealerStock[idx] = {
        ...db.dealerStock[idx],
        inStock,
        quantity,
        updatedAt: nowIso(),
      };
    } else {
      db.dealerStock.push({ productId, dealerId, inStock, quantity, updatedAt: nowIso() });
    }
  });
}

export function saveDealer(dealer: Dealer): void {
  mutate((db) => {
    const idx = db.dealers.findIndex((d) => d.id === dealer.id);
    if (idx >= 0) db.dealers[idx] = dealer;
    else db.dealers.unshift(dealer);
  });
}

export function deleteDealer(id: string): void {
  mutate((db) => {
    db.dealers = db.dealers.filter((d) => d.id !== id);
  });
}

/* ------------------------------------------------------------------ */
/* Saticilar                                                           */
/* ------------------------------------------------------------------ */

export function listRetailers(db: ZenweldDatabase = getSnapshot()): Retailer[] {
  return db.retailers;
}

export function saveRetailer(retailer: Retailer): void {
  mutate((db) => {
    const idx = db.retailers.findIndex((r) => r.id === retailer.id);
    if (idx >= 0) db.retailers[idx] = retailer;
    else db.retailers.unshift(retailer);
  });
}

export function deleteRetailer(id: string): void {
  mutate((db) => {
    db.retailers = db.retailers.filter((r) => r.id !== id);
    db.retailerStock = db.retailerStock.filter((s) => s.retailerId !== id);
  });
}

/* ------------------------------------------------------------------ */
/* Kullanicilar                                                        */
/* ------------------------------------------------------------------ */

export function listUsers(db: ZenweldDatabase = getSnapshot()): User[] {
  return db.users;
}

export function findUserByEmail(
  email: string,
  db: ZenweldDatabase = getSnapshot(),
): User | undefined {
  return db.users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
}

export function findUserById(
  id: string,
  db: ZenweldDatabase = getSnapshot(),
): User | undefined {
  return db.users.find((u) => u.id === id);
}

export function addUser(user: User): void {
  mutate((db) => {
    db.users.unshift(user);
  });
}

export function saveUser(user: User): void {
  mutate((db) => {
    const idx = db.users.findIndex((u) => u.id === user.id);
    if (idx >= 0) db.users[idx] = user;
    else db.users.unshift(user);
  });
}

export function deleteUser(id: string): void {
  mutate((db) => {
    db.users = db.users.filter((u) => u.id !== id);
  });
}

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

/* ------------------------------------------------------------------ */
/* Garanti kayitlari                                                   */
/* ------------------------------------------------------------------ */

export function registerWarranty(record: {
  serialNumber: string;
  productId: string;
  ownerName: string;
  email: string;
  phone: string;
  purchaseDate: string;
  dealerName: string;
  extended: boolean;
}): void {
  mutate((db) => {
    const months = db.products.find((p) => p.id === record.productId)?.warrantyMonths ?? 24;
    const bonus = record.extended ? 12 : 0;
    const expires = new Date(record.purchaseDate);
    expires.setMonth(expires.getMonth() + months + bonus);
    db.warranties.unshift({
      ...record,
      id: uid("w"),
      registeredAt: nowIso(),
      expiresAt: expires.toISOString().slice(0, 10),
    });
  });
}

export function findWarranty(serialNumber: string, db: ZenweldDatabase = getSnapshot()) {
  return db.warranties.find(
    (w) => w.serialNumber.toLowerCase() === serialNumber.toLowerCase().trim(),
  );
}


/* ------------------------------------------------------------------ */
/* Etkinlikler                                                         */
/* ------------------------------------------------------------------ */

export function listEvents(db: ZenweldDatabase = getSnapshot()): ZenweldEvent[] {
  return db.events.filter((e) => e.active);
}

export function listAllEvents(db: ZenweldDatabase = getSnapshot()): ZenweldEvent[] {
  return db.events;
}

export function findEventById(
  id: string,
  db: ZenweldDatabase = getSnapshot(),
): ZenweldEvent | undefined {
  return db.events.find((e) => e.id === id);
}

export function findEventBySlug(
  slug: string,
  db: ZenweldDatabase = getSnapshot(),
): ZenweldEvent | undefined {
  return db.events.find((e) => e.slug === slug);
}

/** Baslangic tarihine gore yeniden eskiye siralar. */
function sortEvents(list: ZenweldEvent[]): void {
  list.sort((a, b) => b.startDate.localeCompare(a.startDate));
}

export function saveEvent(event: ZenweldEvent): void {
  mutate((db) => {
    const idx = db.events.findIndex((e) => e.id === event.id);
    if (idx >= 0) db.events[idx] = event;
    else db.events.unshift(event);
    sortEvents(db.events);
  });
}

export function createEvent(partial: Partial<ZenweldEvent>): ZenweldEvent {
  const id = partial.id ?? uid("e");
  const today = nowIso().slice(0, 10);
  const event: ZenweldEvent = {
    id,
    slug: partial.slug ?? id,
    title: partial.title ?? { tr: "", en: "" },
    summary: partial.summary ?? { tr: "", en: "" },
    description: partial.description ?? { tr: "", en: "" },
    startDate: partial.startDate ?? today,
    endDate: partial.endDate ?? partial.startDate ?? today,
    venue: partial.venue ?? { tr: "", en: "" },
    city: partial.city ?? "",
    country: partial.country ?? "Türkiye",
    logoUrl: partial.logoUrl ?? "",
    images: partial.images ?? [],
    websiteUrl: partial.websiteUrl,
    booth: partial.booth,
    featured: partial.featured ?? false,
    active: partial.active ?? true,
  };
  mutate((db) => {
    db.events.unshift(event);
    sortEvents(db.events);
  });
  return event;
}

export function deleteEvent(id: string): void {
  mutate((db) => {
    db.events = db.events.filter((e) => e.id !== id);
  });
}

/* ------------------------------------------------------------------ */
/* Haberler                                                            */
/* ------------------------------------------------------------------ */

export function listNews(db: ZenweldDatabase = getSnapshot()): NewsItem[] {
  return db.news.filter((n) => n.active);
}

export function listAllNews(db: ZenweldDatabase = getSnapshot()): NewsItem[] {
  return db.news;
}

export function findNewsById(
  id: string,
  db: ZenweldDatabase = getSnapshot(),
): NewsItem | undefined {
  return db.news.find((n) => n.id === id);
}

export function findNewsBySlug(
  slug: string,
  db: ZenweldDatabase = getSnapshot(),
): NewsItem | undefined {
  return db.news.find((n) => n.slug === slug);
}

/** Yayin tarihine gore yeniden eskiye siralar. */
function sortNews(list: NewsItem[]): void {
  list.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export function saveNews(item: NewsItem): void {
  mutate((db) => {
    const idx = db.news.findIndex((n) => n.id === item.id);
    if (idx >= 0) db.news[idx] = item;
    else db.news.unshift(item);
    sortNews(db.news);
  });
}

export function createNews(partial: Partial<NewsItem>): NewsItem {
  const id = partial.id ?? uid("n");
  const item: NewsItem = {
    id,
    slug: partial.slug ?? id,
    title: partial.title ?? { tr: "", en: "" },
    summary: partial.summary ?? { tr: "", en: "" },
    body: partial.body ?? { tr: "", en: "" },
    coverUrl: partial.coverUrl ?? "",
    category: partial.category ?? { tr: "Kurumsal", en: "Corporate" },
    publishedAt: partial.publishedAt ?? nowIso(),
    featured: partial.featured ?? false,
    active: partial.active ?? true,
  };
  mutate((db) => {
    db.news.unshift(item);
    sortNews(db.news);
  });
  return item;
}

export function deleteNews(id: string): void {
  mutate((db) => {
    db.news = db.news.filter((n) => n.id !== id);
  });
}
