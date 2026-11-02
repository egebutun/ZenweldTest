import { sql } from "drizzle-orm";
import { bigint, boolean, check, index, integer, numeric, pgTable, text, uniqueIndex } from "drizzle-orm/pg-core";
import { money, oneOf, timestamps, tstz } from "./columns";
import { categories, products } from "./catalog";
import { orders } from "./sales";
import { users } from "./users";

/**
 * KUPONLAR (docs/VERITABANI.md › 7)
 *
 * Tablolar hazir; sitede ve panelde kupon ozelligi henuz yok
 * (YAPILACAKLAR › Kuponlar).
 */

export const coupons = pgTable(
  "coupons",
  {
    id: text("id").primaryKey(),
    /** Musterinin yazdigi kod; buyuk/kucuk harf duyarsiz benzersiz */
    code: text("code").notNull(),
    /** Panelde taniyabilmek icin ad ya da not */
    name: text("name"),
    /** percent: yuzde; amount: sabit TL */
    discountType: text("discount_type").notNull(),
    discountValue: numeric("discount_value", { precision: 12, scale: 2, mode: "number" }).notNull(),
    /** En az sepet tutari (KDV dahil) */
    minCartTotal: money("min_cart_total"),
    startsAt: tstz("starts_at"),
    endsAt: tstz("ends_at"),
    /** Toplam kullanim siniri; bossa sinirsiz */
    totalUsageLimit: integer("total_usage_limit"),
    /** Kisi basi kullanim siniri; bossa sinirsiz */
    perUserLimit: integer("per_user_limit"),
    /** all: butun urunler; targets: yalnizca coupon_targets'taki urun ve kategoriler */
    scope: text("scope").notNull().default("all"),
    active: boolean("active").notNull().default(true),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex("coupons_code").on(sql`upper(${t.code})`),
    check("coupons_discount_type", oneOf(t.discountType, ["percent", "amount"])),
    check(
      "coupons_discount_value",
      sql`${t.discountValue} > 0 AND (${t.discountType} <> 'percent' OR ${t.discountValue} <= 100)`,
    ),
    check("coupons_scope", oneOf(t.scope, ["all", "targets"])),
    check("coupons_dates", sql`${t.endsAt} IS NULL OR ${t.startsAt} IS NULL OR ${t.endsAt} > ${t.startsAt}`),
    check("coupons_limits", sql`coalesce(${t.totalUsageLimit}, 1) >= 1 AND coalesce(${t.perUserLimit}, 1) >= 1`),
  ],
);

/** Kupon belirli urun ya da kategorilere ozelse bunlarin listesi (scope = targets). */
export const couponTargets = pgTable(
  "coupon_targets",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    couponId: text("coupon_id")
      .notNull()
      .references(() => coupons.id, { onDelete: "cascade" }),
    productId: text("product_id").references(() => products.id, { onDelete: "cascade" }),
    categoryId: text("category_id").references(() => categories.id, { onDelete: "cascade" }),
  },
  (t) => [
    check("coupon_targets_one", sql`num_nonnulls(${t.productId}, ${t.categoryId}) = 1`),
    uniqueIndex("coupon_targets_product").on(t.couponId, t.productId).where(sql`${t.productId} IS NOT NULL`),
    uniqueIndex("coupon_targets_category").on(t.couponId, t.categoryId).where(sql`${t.categoryId} IS NOT NULL`),
  ],
);

/** Kim, hangi sipariste, ne kadar indirim aldi. */
export const couponRedemptions = pgTable(
  "coupon_redemptions",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    /** Kullanilmis kupon silinemez (engeller); pasife alinir */
    couponId: text("coupon_id")
      .notNull()
      .references(() => coupons.id, { onDelete: "restrict" }),
    /** Kopya */
    couponCode: text("coupon_code").notNull(),
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
    orderId: text("order_id")
      .notNull()
      .unique("coupon_redemptions_order")
      .references(() => orders.id, { onDelete: "restrict" }),
    /** Uygulanan indirim (KDV dahil) */
    discountAmount: money("discount_amount").notNull(),
    createdAt: tstz("created_at").notNull().defaultNow(),
    /** Siparis iptal edilince dolar; kullanim sinirlarinda sayilmaz */
    releasedAt: tstz("released_at"),
  },
  (t) => [
    index("coupon_redemptions_coupon_user").on(t.couponId, t.userId),
    check("coupon_redemptions_amount", sql`${t.discountAmount} > 0`),
  ],
);
