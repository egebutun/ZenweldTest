import { sql } from "drizzle-orm";
import { boolean, check, date, index, jsonb, pgTable, smallint, text, uniqueIndex } from "drizzle-orm/pg-core";
import type { ReviewMedia } from "@zenweld/data";
import { oneOf, subsetOf, timestamps, tstz } from "./columns";
import { categories, products } from "./catalog";
import { users } from "./users";

/**
 * SERVIS TALEPLERI, GARANTILER, YORUMLAR (docs/VERITABANI.md › 8)
 */

export const serviceRequests = pgTable(
  "service_requests",
  {
    id: text("id").primaryKey(),
    /** SRV-<yil>-<4 hane> */
    code: text("code").notNull().unique("service_requests_code"),
    status: text("status").notNull().default("new"),
    categoryId: text("category_id").references(() => categories.id, { onDelete: "set null" }),
    productId: text("product_id").references(() => products.id, { onDelete: "set null" }),
    /** Kopya */
    productName: text("product_name").notNull(),
    reasons: text("reasons").array().notNull(),
    complaint: text("complaint").notNull(),
    companyName: text("company_name").notNull(),
    address: text("address").notNull(),
    city: text("city").notNull(),
    district: text("district").notNull(),
    email: text("email").notNull(),
    phone: text("phone").notNull(),
    contactName: text("contact_name").notNull(),
    contactGsm: text("contact_gsm").notNull(),
    /** Giris yapmissa */
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
    adminNote: text("admin_note"),
    ...timestamps(),
  },
  (t) => [
    index("service_requests_created").on(t.createdAt.desc()),
    check("service_requests_status", oneOf(t.status, ["new", "in_progress", "done"])),
    check("service_requests_reasons", subsetOf(t.reasons, ["kurulum", "bakim", "onarim", "egitim"])),
  ],
);

export const warranties = pgTable(
  "warranties",
  {
    id: text("id").primaryKey(),
    serialNumber: text("serial_number").notNull(),
    categoryId: text("category_id").references(() => categories.id, { onDelete: "set null" }),
    productId: text("product_id").references(() => products.id, { onDelete: "set null" }),
    /** Kopya; urun silinse de model okunur */
    productName: text("product_name"),
    ownerName: text("owner_name").notNull(),
    /** Uyeye e-postayla eslesir */
    email: text("email").notNull(),
    phone: text("phone").notNull(),
    city: text("city").notNull(),
    postalCode: text("postal_code").notNull(),
    address: text("address").notNull(),
    /** Satan firmanin vergi no */
    sellerTaxNumber: text("seller_tax_number").notNull(),
    registeredAt: tstz("registered_at").notNull(),
    expiresAt: date("expires_at", { mode: "string" }).notNull(),
    extended: boolean("extended").notNull().default(false),
    updatedAt: tstz("updated_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("warranties_serial").on(sql`upper(${t.serialNumber})`),
    index("warranties_email").on(sql`lower(${t.email})`),
  ],
);

export const reviews = pgTable(
  "reviews",
  {
    id: text("id").primaryKey(),
    productId: text("product_id").references(() => products.id, { onDelete: "set null" }),
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
    authorName: text("author_name").notNull(),
    rating: smallint("rating").notNull(),
    title: text("title"),
    body: text("body").notNull(),
    /** Dosyalar dosya deposunda */
    media: jsonb("media").$type<ReviewMedia[]>().notNull().default([]),
    verifiedPurchase: boolean("verified_purchase"),
    /** Yalnizca onaylilar yayinda */
    approved: boolean("approved").notNull().default(false),
    /** Anasayfa seridi (en fazla 10; kayit katmani saglar) */
    featured: boolean("featured").notNull().default(false),
    ...timestamps(),
  },
  (t) => [
    index("reviews_product").on(t.productId),
    check("reviews_rating", sql`${t.rating} BETWEEN 1 AND 5`),
  ],
);
