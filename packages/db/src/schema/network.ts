import { sql } from "drizzle-orm";
import { boolean, check, index, integer, jsonb, numeric, pgTable, primaryKey, text } from "drizzle-orm/pg-core";
import type { StockRow } from "@zenweld/data";
import { money, oneOf, subsetOf, timestamps, tstz } from "./columns";
import { products } from "./catalog";

/**
 * BAYILER, ONLINE SATICILAR VE STOK (docs/VERITABANI.md › 4; stok
 * tablolari docs/STOK.md › Backend'e gecis ile ayni)
 */

export const retailers = pgTable("retailers", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  websiteUrl: text("website_url").notNull(),
  logoText: text("logo_text").notNull(),
  /** Kullanilmiyor */
  logoUrl: text("logo_url"),
  isOwnStore: boolean("is_own_store").notNull().default(false),
  city: text("city"),
  active: boolean("active").notNull().default(true),
  ...timestamps(),
});

export const dealers = pgTable(
  "dealers",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    city: text("city").notNull(),
    district: text("district").notNull(),
    address: text("address").notNull(),
    phone: text("phone").notNull(),
    whatsapp: text("whatsapp"),
    /** Kullanilmiyor */
    email: text("email"),
    lat: numeric("lat", { precision: 9, scale: 6, mode: "number" }).notNull(),
    lng: numeric("lng", { precision: 9, scale: 6, mode: "number" }).notNull(),
    badges: text("badges").array().notNull().default(sql`ARRAY[]::text[]`),
    workingHours: text("working_hours").notNull(),
    /** Bayinin online magazasi: bire bir */
    retailerId: text("retailer_id")
      .unique("dealers_retailer")
      .references(() => retailers.id, { onDelete: "set null" }),
    active: boolean("active").notNull().default(true),
    ...timestamps(),
  },
  (t) => [check("dealers_badges", subsetOf(t.badges, ["yetkili-satici", "yetkili-servis"]))],
);

/** Stok dosyasi yuklemesi, elle duzeltme ya da geri alma. */
export const stockImports = pgTable(
  "stock_imports",
  {
    id: text("id").primaryKey(),
    sourceType: text("source_type").notNull(),
    sourceId: text("source_id").notNull(),
    kind: text("kind").notNull(),
    fileName: text("file_name"),
    /** Orijinal dosya (dosya deposu), denetim icin */
    fileKey: text("file_key"),
    note: text("note"),
    createdAt: tstz("created_at").notNull().defaultNow(),
    /** Islemi yapan yonetici */
    createdBy: text("created_by"),
    rows: integer("rows").notNull(),
    matched: integer("matched").notNull(),
    unmatched: integer("unmatched").notNull(),
    invalid: integer("invalid").notNull(),
    added: integer("added").notNull(),
    changed: integer("changed").notNull(),
    zeroed: integer("zeroed").notNull(),
    /** Geri alma icin islemden onceki stok satirlari */
    previous: jsonb("previous").$type<StockRow[]>(),
    revertedAt: tstz("reverted_at"),
  },
  (t) => [
    index("stock_imports_source").on(t.sourceType, t.sourceId, t.createdAt.desc()),
    check("stock_imports_source_type", oneOf(t.sourceType, ["dealer", "retailer"])),
    check("stock_imports_kind", oneOf(t.kind, ["file", "manual", "revert"])),
  ],
);

const stockColumns = () => ({
  productId: text("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  /** Bos metin = urunun tum varyantlari */
  variantId: text("variant_id").notNull().default(""),
  /** Dosyadaki kod */
  sku: text("sku").notNull(),
  quantity: integer("quantity").notNull(),
  /** KDV dahil; sitede gosterilmez */
  price: money("price"),
  url: text("url"),
  updatedAt: tstz("updated_at").notNull(),
  importId: text("import_id").references(() => stockImports.id, { onDelete: "set null" }),
});

export const dealerStock = pgTable(
  "dealer_stock",
  {
    dealerId: text("dealer_id")
      .notNull()
      .references(() => dealers.id, { onDelete: "cascade" }),
    ...stockColumns(),
  },
  (t) => [
    primaryKey({ name: "dealer_stock_pk", columns: [t.dealerId, t.productId, t.variantId] }),
    index("dealer_stock_product").on(t.productId, t.updatedAt).where(sql`${t.quantity} > 0`),
    check("dealer_stock_quantity", sql`${t.quantity} >= 0`),
  ],
);

/** Bir bayiye bagli OLMAYAN online saticilarin stogu. */
export const retailerStock = pgTable(
  "retailer_stock",
  {
    retailerId: text("retailer_id")
      .notNull()
      .references(() => retailers.id, { onDelete: "cascade" }),
    ...stockColumns(),
  },
  (t) => [
    primaryKey({ name: "retailer_stock_pk", columns: [t.retailerId, t.productId, t.variantId] }),
    index("retailer_stock_product").on(t.productId, t.updatedAt).where(sql`${t.quantity} > 0`),
    check("retailer_stock_quantity", sql`${t.quantity} >= 0`),
  ],
);

/** Bayinin kendi urun kodu -> bizim urun/varyant. */
export const skuAliases = pgTable(
  "sku_aliases",
  {
    sourceId: text("source_id").notNull(),
    /** Buyuk harf, bosluksuz */
    code: text("code").notNull(),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    variantId: text("variant_id").notNull().default(""),
  },
  (t) => [primaryKey({ name: "sku_aliases_pk", columns: [t.sourceId, t.code] })],
);
