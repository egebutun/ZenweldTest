import { sql } from "drizzle-orm";
import { check, index, integer, jsonb, pgTable, primaryKey, text } from "drizzle-orm/pg-core";
import type { OrderAddress, OrderInvoice } from "@zenweld/data";
import { money, oneOf, percent, timestamps, tstz } from "./columns";
import { products } from "./catalog";
import { users } from "./users";
import { paymentPos } from "./settings";

/**
 * TEKLIFLER, SIPARISLER VE IADELER (docs/VERITABANI.md › 6 ve 7)
 */

export const quotes = pgTable(
  "quotes",
  {
    id: text("id").primaryKey(),
    /** TKL-<yil>-<4 hane> */
    code: text("code").notNull().unique("quotes_code"),
    /** Ziyaretcide bos */
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
    status: text("status").notNull().default("new"),
    companyName: text("company_name").notNull(),
    contactName: text("contact_name").notNull(),
    email: text("email").notNull(),
    phone: text("phone").notNull(),
    taxNumber: text("tax_number"),
    city: text("city").notNull(),
    paymentPreference: text("payment_preference").notNull(),
    termDays: integer("term_days"),
    message: text("message"),
    assignedTo: text("assigned_to"),
    adminNote: text("admin_note"),
    ...timestamps(),
  },
  (t) => [
    index("quotes_user").on(t.userId),
    index("quotes_created").on(t.createdAt.desc()),
    check("quotes_status", oneOf(t.status, ["new", "reviewing", "sent", "won", "lost"])),
    check("quotes_payment_preference", oneOf(t.paymentPreference, ["vadeli", "cek", "havale", "belirsiz"])),
  ],
);

export const quoteItems = pgTable(
  "quote_items",
  {
    quoteId: text("quote_id")
      .notNull()
      .references(() => quotes.id, { onDelete: "cascade" }),
    line: integer("line").notNull(),
    productId: text("product_id").references(() => products.id, { onDelete: "set null" }),
    variantId: text("variant_id"),
    /** Kopya: teklif anindaki ad, kod ve secenek */
    productName: text("product_name").notNull(),
    sku: text("sku"),
    variantLabel: text("variant_label"),
    quantity: integer("quantity").notNull(),
    /** Kullanilmiyor */
    note: text("note"),
  },
  (t) => [
    primaryKey({ name: "quote_items_pk", columns: [t.quoteId, t.line] }),
    check("quote_items_quantity", sql`${t.quantity} >= 1`),
  ],
);

export const orders = pgTable(
  "orders",
  {
    id: text("id").primaryKey(),
    /** SIP-<yil>-<5 hane> */
    code: text("code").notNull().unique("orders_code"),
    /** Siparis yalnizca uyeden; uye silinse de siparis kalir */
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
    status: text("status").notNull(),
    customerName: text("customer_name").notNull(),
    email: text("email").notNull(),
    phone: text("phone").notNull(),
    /** Kopya */
    shippingAddress: jsonb("shipping_address").$type<OrderAddress>().notNull(),
    /** Kopya: tur, ad ya da firma, T.C. kimlik no ya da vergi bilgisi, adres */
    invoice: jsonb("invoice").$type<OrderInvoice>().notNull(),
    subtotal: money("subtotal").notNull(),
    vat: money("vat").notNull(),
    shipping: money("shipping").notNull(),
    installmentFee: money("installment_fee").notNull().default(0),
    total: money("total").notNull(),
    paymentMethod: text("payment_method").notNull(),
    installments: integer("installments"),
    cardBrand: text("card_brand"),
    cardProgram: text("card_program"),
    /** Kart numarasi hic saklanmaz */
    cardLast4: text("card_last4"),
    posId: text("pos_id").references(() => paymentPos.id, { onDelete: "set null" }),
    /** Kopya */
    posName: text("pos_name"),
    /** Kopya: bankanin kestigi oran */
    commissionPercent: percent("commission_percent"),
    paidAt: tstz("paid_at"),
    /** Havalede son odeme ani */
    dueAt: tstz("due_at"),
    carrier: text("carrier"),
    trackingNumber: text("tracking_number"),
    shippedAt: tstz("shipped_at"),
    deliveredAt: tstz("delivered_at"),
    customerNote: text("customer_note"),
    adminNote: text("admin_note"),
    termsAcceptedAt: tstz("terms_accepted_at").notNull(),
    ...timestamps(),
  },
  (t) => [
    index("orders_user").on(t.userId, t.createdAt.desc()),
    index("orders_created").on(t.createdAt.desc()),
    index("orders_awaiting_payment").on(t.dueAt).where(sql`${t.status} = 'awaiting_payment'`),
    check(
      "orders_status",
      oneOf(t.status, ["awaiting_payment", "preparing", "shipped", "delivered", "cancelled"]),
    ),
    check("orders_payment_method", oneOf(t.paymentMethod, ["card", "transfer"])),
    check("orders_card_last4", sql`${t.cardLast4} ~ '^[0-9]{4}$'`),
  ],
);

export const orderItems = pgTable(
  "order_items",
  {
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    /** Sira; iade satirlari buna baglanir */
    line: integer("line").notNull(),
    productId: text("product_id").references(() => products.id, { onDelete: "set null" }),
    variantId: text("variant_id"),
    /** Kopya */
    productName: text("product_name").notNull(),
    sku: text("sku").notNull(),
    variantLabel: text("variant_label"),
    quantity: integer("quantity").notNull(),
    /** Indirim uygulanmis, KDV haric */
    unitPriceExVat: money("unit_price_ex_vat").notNull(),
    vatRate: percent("vat_rate").notNull(),
    /** KDV dahil */
    unitPrice: money("unit_price").notNull(),
  },
  (t) => [
    primaryKey({ name: "order_items_pk", columns: [t.orderId, t.line] }),
    index("order_items_product").on(t.productId),
    check("order_items_quantity", sql`${t.quantity} >= 1`),
  ],
);

/** Siparisin zaman cizelgesi (orders.history). */
export const orderStatusHistory = pgTable(
  "order_status_history",
  {
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    seq: integer("seq").notNull(),
    status: text("status").notNull(),
    at: tstz("at").notNull(),
    note: text("note"),
    /** Yonetici; sistemin yaptigi degisiklikte bos */
    changedBy: text("changed_by").references(() => users.id, { onDelete: "set null" }),
  },
  (t) => [primaryKey({ name: "order_status_history_pk", columns: [t.orderId, t.seq] })],
);

/** Banka POS islemleri; POS baglaninca kesinlesecek. */
export const paymentTransactions = pgTable(
  "payment_transactions",
  {
    id: text("id").primaryKey(),
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "restrict" }),
    posId: text("pos_id").references(() => paymentPos.id, { onDelete: "set null" }),
    kind: text("kind").notNull(),
    amount: money("amount").notNull(),
    installments: integer("installments"),
    status: text("status").notNull(),
    /** Bankanin islem numarasi */
    providerRef: text("provider_ref"),
    errorCode: text("error_code"),
    errorMessage: text("error_message"),
    /** Bankanin yaniti (kart bilgisi cikarilmis) */
    raw: jsonb("raw"),
    createdAt: tstz("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("payment_transactions_order").on(t.orderId),
    check("payment_transactions_kind", oneOf(t.kind, ["sale", "refund", "cancel"])),
    check("payment_transactions_status", oneOf(t.status, ["pending", "success", "failed"])),
  ],
);

export const returnRequests = pgTable(
  "return_requests",
  {
    id: text("id").primaryKey(),
    /** IAD-<yil>-<4 hane> */
    code: text("code").notNull().unique("return_requests_code"),
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "restrict" }),
    /** Kopya */
    orderCode: text("order_code").notNull(),
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
    customerName: text("customer_name").notNull(),
    email: text("email").notNull(),
    phone: text("phone").notNull(),
    reason: text("reason").notNull(),
    note: text("note"),
    status: text("status").notNull().default("new"),
    adminNote: text("admin_note"),
    ...timestamps(),
  },
  (t) => [
    index("return_requests_order").on(t.orderId),
    check("return_requests_reason", oneOf(t.reason, ["changed_mind", "defective", "wrong_item", "other"])),
    check("return_requests_status", oneOf(t.status, ["new", "reviewing", "approved", "rejected"])),
  ],
);

export const returnRequestItems = pgTable(
  "return_request_items",
  {
    returnRequestId: text("return_request_id")
      .notNull()
      .references(() => returnRequests.id, { onDelete: "cascade" }),
    /** Siparisin satir sirasi (order_items.line) */
    orderLine: integer("order_line").notNull(),
    productId: text("product_id").references(() => products.id, { onDelete: "set null" }),
    /** Kopya */
    productName: text("product_name").notNull(),
    sku: text("sku").notNull(),
    variantLabel: text("variant_label"),
    quantity: integer("quantity").notNull(),
  },
  (t) => [
    primaryKey({ name: "return_request_items_pk", columns: [t.returnRequestId, t.orderLine] }),
    check("return_request_items_quantity", sql`${t.quantity} >= 1`),
  ],
);
