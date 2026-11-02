import { boolean, check, integer, jsonb, pgTable, text, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { oneOf, timestamps, tstz } from "./columns";
import { users } from "./users";

/**
 * AYARLAR VE ODEME (docs/VERITABANI.md › 10)
 *
 * POS API anahtari ve sifresi burada YOKTUR; yalnizca sunucuda ortam
 * degiskenidir (CLAUDE.md › Guvenlik).
 */

/** Musteriye sunulan taksit: { count, rate_percent, enabled } */
export interface PosInstallmentRow {
  count: number;
  rate_percent: number;
  enabled: boolean;
}

/** Bankanin kestigi oran: { count, rate_percent } (count 1 = tek cekim) */
export interface PosCommissionRow {
  count: number;
  rate_percent: number;
}

export const settings = pgTable(
  "settings",
  {
    key: text("key").primaryKey(),
    value: jsonb("value").notNull(),
    updatedAt: tstz("updated_at").notNull().defaultNow(),
    updatedBy: text("updated_by").references(() => users.id, { onDelete: "set null" }),
  },
  (t) => [check("settings_key", oneOf(t.key, ["shop", "stock", "rich_text"]))],
);

/** Banka sanal POS'lari (settings.shop.pos). */
export const paymentPos = pgTable(
  "payment_pos",
  {
    id: text("id").primaryKey(),
    bankShortName: text("bank_short_name").notNull(),
    name: text("name").notNull(),
    /** Kart programi (Bonus, World ...); bossa program yok */
    program: text("program"),
    /** Uye isyeri numarasi */
    merchantNo: text("merchant_no").notNull(),
    posName: text("pos_name").notNull(),
    active: boolean("active").notNull().default(true),
    /** Programi eslesmeyen kartlar buradan tek cekim */
    isDefault: boolean("is_default").notNull().default(false),
    /** Ayni programda ustteki gecerli */
    position: integer("position").notNull(),
    installments: jsonb("installments").$type<PosInstallmentRow[]>().notNull().default([]),
    commissions: jsonb("commissions").$type<PosCommissionRow[]>().notNull().default([]),
    ...timestamps(),
  },
  (t) => [uniqueIndex("payment_pos_one_default").on(t.isDefault).where(sql`${t.isDefault}`)],
);

/** Kargo firmalari (settings.shop.carriers); siparise takip no girilirken secilir. */
export const carriers = pgTable("carriers", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique("carriers_name"),
  /** Takip sayfasi: {takip} yerine takip numarasi yazilir; bossa baglanti verilmez */
  trackingUrl: text("tracking_url"),
  active: boolean("active").notNull().default(true),
  position: integer("position").notNull(),
  ...timestamps(),
});

/** Havale hesaplari (settings.shop.bankAccounts). */
export const bankAccounts = pgTable("bank_accounts", {
  id: text("id").primaryKey(),
  bankName: text("bank_name").notNull(),
  accountHolder: text("account_holder").notNull(),
  iban: text("iban").notNull(),
  position: integer("position").notNull(),
  ...timestamps(),
});
