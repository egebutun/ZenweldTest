import { sql } from "drizzle-orm";
import { boolean, check, index, inet, integer, pgTable, primaryKey, text, uniqueIndex } from "drizzle-orm/pg-core";
import { oneOf, timestamps, tstz } from "./columns";
import { products } from "./catalog";

/**
 * UYELER VE OTURUMLAR (docs/VERITABANI.md › 5)
 */

export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey(),
    role: text("role").notNull(),
    status: text("status").notNull().default("active"),
    email: text("email").notNull(),
    /** Guclu ozet (argon2id) */
    passwordHash: text("password_hash").notNull(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    phone: text("phone").notNull(),
    companyName: text("company_name"),
    taxOffice: text("tax_office"),
    taxNumber: text("tax_number"),
    sector: text("sector"),
    city: text("city"),
    newsletter: boolean("newsletter").notNull().default(false),
    ...timestamps(),
    lastLoginAt: tstz("last_login_at"),
    /** Sifre degisince diger oturumlar kapanir */
    passwordChangedAt: tstz("password_changed_at"),
    /** Yanlis sifre sayaci (KARARLAR K-94): son 15 dakikadaki yanlis deneme */
    failedLoginCount: integer("failed_login_count").notNull().default(0),
    /** Sayilan ilk yanlis denemenin ani */
    failedLoginSince: tstz("failed_login_since"),
    /** Bu ana kadar giris yapilamaz */
    loginLockedUntil: tstz("login_locked_until"),
  },
  (t) => [
    uniqueIndex("users_email").on(sql`lower(${t.email})`),
    check("users_role", oneOf(t.role, ["individual", "business", "admin"])),
    check("users_status", oneOf(t.status, ["active", "suspended"])),
  ],
);

export const addresses = pgTable(
  "addresses",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    fullName: text("full_name").notNull(),
    phone: text("phone").notNull(),
    city: text("city").notNull(),
    district: text("district").notNull(),
    line: text("line").notNull(),
    isDefault: boolean("is_default").notNull().default(false),
    ...timestamps(),
  },
  (t) => [
    index("addresses_user").on(t.userId),
    // Uye basina en fazla bir varsayilan; "tam bir" kuralini kayit katmani saglar.
    uniqueIndex("addresses_one_default").on(t.userId).where(sql`${t.isDefault}`),
  ],
);

/** Sunucu oturumu; site ve panel oturumu ayridir. */
export const sessions = pgTable(
  "sessions",
  {
    /** Oturum belirtecinin ozeti; belirtecin kendisi yalnizca cerezde */
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    scope: text("scope").notNull(),
    createdAt: tstz("created_at").notNull().defaultNow(),
    expiresAt: tstz("expires_at").notNull(),
    lastSeenAt: tstz("last_seen_at").notNull().defaultNow(),
    ip: inet("ip"),
    userAgent: text("user_agent"),
  },
  (t) => [index("sessions_user").on(t.userId), check("sessions_scope", oneOf(t.scope, ["site", "admin"]))],
);

export const passwordResetTokens = pgTable("password_reset_tokens", {
  tokenHash: text("token_hash").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: tstz("created_at").notNull().defaultNow(),
  expiresAt: tstz("expires_at").notNull(),
  /** Tek kullanimlik */
  usedAt: tstz("used_at"),
});

export const favourites = pgTable(
  "favourites",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    createdAt: tstz("created_at").notNull().defaultNow(),
  },
  (t) => [primaryKey({ name: "favourites_pk", columns: [t.userId, t.productId] })],
);
