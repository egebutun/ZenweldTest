import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  foreignKey,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import type { ProductImage, SeoFields, SpecRow } from "@zenweld/data";
import { SECTIONS, money, oneOf, percent, timestamps, trKey, tstz } from "./columns";

/**
 * KATALOG (docs/VERITABANI.md › 3. Katalog)
 */

export const categoryGroups = pgTable(
  "category_groups",
  {
    id: text("id").primaryKey(),
    section: text("section").notNull(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    aboutText: text("about_text"),
    image: text("image"),
    position: integer("position").notNull(),
    /** Kategori tablosundaki numara ("1.2"); kullanilmiyor */
    code: text("code"),
    seo: jsonb("seo").$type<SeoFields>(),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex("category_groups_section_slug").on(t.section, t.slug),
    check("category_groups_section", oneOf(t.section, SECTIONS)),
  ],
);

export const categories = pgTable(
  "categories",
  {
    id: text("id").primaryKey(),
    /** Grup silinemez: icinde kategori varken (engeller) */
    groupId: text("group_id")
      .notNull()
      .references(() => categoryGroups.id, { onDelete: "restrict" }),
    slug: text("slug").notNull().unique("categories_slug"),
    name: text("name").notNull(),
    description: text("description").notNull(),
    aboutText: text("about_text"),
    image: text("image"),
    /** Kullanilmiyor */
    icon: text("icon"),
    /** "1.2.3"; kullanilmiyor */
    code: text("code"),
    position: integer("position").notNull(),
    seo: jsonb("seo").$type<SeoFields>(),
    ...timestamps(),
  },
  (t) => [index("categories_group").on(t.groupId)],
);

export const optionDefinitions = pgTable(
  "option_definitions",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    position: integer("position").notNull(),
    ...timestamps(),
  },
  (t) => [uniqueIndex("option_definitions_name_tr").on(trKey(t.name))],
);

export const optionValues = pgTable(
  "option_values",
  {
    optionDefinitionId: text("option_definition_id")
      .notNull()
      .references(() => optionDefinitions.id, { onDelete: "cascade" }),
    /** Degerin ilk adindan uretilir ("4-m") ve degismez */
    id: text("id").notNull(),
    label: text("label").notNull(),
    position: integer("position").notNull(),
  },
  (t) => [
    primaryKey({ name: "option_values_pk", columns: [t.optionDefinitionId, t.id] }),
    uniqueIndex("option_values_label_tr").on(t.optionDefinitionId, trKey(t.label)),
  ],
);

/** Kategoride urune secenek eklenirken listelenen tanimlar (categories.optionIds). */
export const categoryOptionDefinitions = pgTable(
  "category_option_definitions",
  {
    categoryId: text("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    optionDefinitionId: text("option_definition_id")
      .notNull()
      .references(() => optionDefinitions.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
  },
  (t) => [primaryKey({ name: "category_option_definitions_pk", columns: [t.categoryId, t.optionDefinitionId] })],
);

/** Kategori filtreleri (categories.filters, KARARLAR K-76). */
export const categoryFilters = pgTable(
  "category_filters",
  {
    categoryId: text("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    /** Ilk addan uretilir, degismez; adreste kullanilir ("model-serisi") */
    id: text("id").notNull(),
    name: text("name").notNull(),
    position: integer("position").notNull(),
  },
  (t) => [
    primaryKey({ name: "category_filters_pk", columns: [t.categoryId, t.id] }),
    uniqueIndex("category_filters_name_tr").on(t.categoryId, trKey(t.name)),
  ],
);

export const categoryFilterValues = pgTable(
  "category_filter_values",
  {
    categoryId: text("category_id").notNull(),
    filterId: text("filter_id").notNull(),
    id: text("id").notNull(),
    label: text("label").notNull(),
    position: integer("position").notNull(),
  },
  (t) => [
    primaryKey({ name: "category_filter_values_pk", columns: [t.categoryId, t.filterId, t.id] }),
    foreignKey({
      name: "category_filter_values_filter_fk",
      columns: [t.categoryId, t.filterId],
      foreignColumns: [categoryFilters.categoryId, categoryFilters.id],
    }).onDelete("cascade"),
    uniqueIndex("category_filter_values_label_tr").on(t.categoryId, t.filterId, trKey(t.label)),
  ],
);

export const products = pgTable(
  "products",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull().unique("products_slug"),
    /** Urun kodu (SAP kodu, K-72); tek havuzda benzersizligi sku_codes saglar */
    sku: text("sku").notNull(),
    name: text("name").notNull(),
    /** Kategori silinemez: icinde urun varken (engeller) */
    categoryId: text("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    modelCode: text("model_code"),
    brand: text("brand"),
    shortDescription: text("short_description").notNull().default(""),
    description: text("description").notNull().default(""),
    /** KDV haric NORMAL fiyat; kampanya gosterimde uygulanir */
    priceExVat: money("price_ex_vat").notNull(),
    vatRate: percent("vat_rate").notNull(),
    currency: text("currency").notNull().default("TRY"),
    discountPercent: integer("discount_percent"),
    discountStartsAt: tstz("discount_starts_at"),
    discountEndsAt: tstz("discount_ends_at"),
    images: jsonb("images").$type<ProductImage[]>().notNull().default([]),
    specs: jsonb("specs").$type<SpecRow[]>().notNull().default([]),
    inTheBox: jsonb("in_the_box").$type<string[]>().notNull().default([]),
    highlights: jsonb("highlights").$type<string[]>().notNull().default([]),
    /** Eski Urun Secici ve arama icin; Urun Secici yeniden kurulunca kalkar (K-69) */
    processes: text("processes").array(),
    isNew: boolean("is_new").notNull().default(false),
    position: integer("position"),
    manualUrl: text("manual_url"),
    warrantyMonths: integer("warranty_months").notNull(),
    active: boolean("active").notNull().default(true),
    seo: jsonb("seo").$type<SeoFields>(),
    ...timestamps(),
  },
  (t) => [
    index("products_category").on(t.categoryId),
    check("products_price", sql`${t.priceExVat} >= 0`),
    check("products_currency", sql`${t.currency} = 'TRY'`),
    check("products_discount_percent", sql`${t.discountPercent} BETWEEN 1 AND 90`),
    check(
      "products_discount_dates",
      sql`${t.discountEndsAt} IS NULL OR ${t.discountStartsAt} IS NULL OR ${t.discountEndsAt} > ${t.discountStartsAt}`,
    ),
  ],
);

/** Urunun kullandigi secenek tanimlari, sayfadaki sirasiyla (en fazla 3). */
export const productOptions = pgTable(
  "product_options",
  {
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    /** Bir urunde kullanilan tanim silinemez (engeller) */
    optionDefinitionId: text("option_definition_id")
      .notNull()
      .references(() => optionDefinitions.id, { onDelete: "restrict" }),
    position: integer("position").notNull(),
  },
  (t) => [
    primaryKey({ name: "product_options_pk", columns: [t.productId, t.optionDefinitionId] }),
    uniqueIndex("product_options_position").on(t.productId, t.position),
    check("product_options_max3", sql`${t.position} BETWEEN 0 AND 2`),
  ],
);

/** Satilan kombinasyonlar (options.variants). */
export const productVariants = pgTable(
  "product_variants",
  {
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    /** Urun icindeki kimlik ("su_8-m"); degismez */
    id: text("id").notNull(),
    /** Degerlerin sirali yazimi; bir kombinasyon bir urunde bir kez */
    combinationKey: text("combination_key").notNull(),
    sku: text("sku").notNull(),
    priceDeltaExVat: money("price_delta_ex_vat").notNull().default(0),
    specOverrides: jsonb("spec_overrides").$type<SpecRow[]>(),
    inTheBox: jsonb("in_the_box").$type<string[]>(),
    image: text("image"),
    position: integer("position").notNull(),
  },
  (t) => [
    primaryKey({ name: "product_variants_pk", columns: [t.productId, t.id] }),
    uniqueIndex("product_variants_combination").on(t.productId, t.combinationKey),
  ],
);

/** Kombinasyonun degerleri: urunun her seceneginden bir deger. */
export const productVariantValues = pgTable(
  "product_variant_values",
  {
    productId: text("product_id").notNull(),
    variantId: text("variant_id").notNull(),
    optionDefinitionId: text("option_definition_id").notNull(),
    optionValueId: text("option_value_id").notNull(),
  },
  (t) => [
    primaryKey({ name: "product_variant_values_pk", columns: [t.productId, t.variantId, t.optionDefinitionId] }),
    foreignKey({
      name: "product_variant_values_variant_fk",
      columns: [t.productId, t.variantId],
      foreignColumns: [productVariants.productId, productVariants.id],
    }).onDelete("cascade"),
    // Tanim urunde secili olmali; urunden cikarilinca degerleri de silinir.
    foreignKey({
      name: "product_variant_values_option_fk",
      columns: [t.productId, t.optionDefinitionId],
      foreignColumns: [productOptions.productId, productOptions.optionDefinitionId],
    }).onDelete("cascade"),
    // Bir urunde kullanilan deger silinemez (engeller).
    foreignKey({
      name: "product_variant_values_value_fk",
      columns: [t.optionDefinitionId, t.optionValueId],
      foreignColumns: [optionValues.optionDefinitionId, optionValues.id],
    }).onDelete("restrict"),
  ],
);

/** Urunun kategori filtrelerindeki degerleri (filterValues). */
export const productFilterValues = pgTable(
  "product_filter_values",
  {
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    categoryId: text("category_id").notNull(),
    filterId: text("filter_id").notNull(),
    valueId: text("value_id").notNull(),
  },
  (t) => [
    primaryKey({ name: "product_filter_values_pk", columns: [t.productId, t.filterId, t.valueId] }),
    foreignKey({
      name: "product_filter_values_value_fk",
      columns: [t.categoryId, t.filterId, t.valueId],
      foreignColumns: [categoryFilterValues.categoryId, categoryFilterValues.filterId, categoryFilterValues.id],
    }).onDelete("cascade"),
    index("product_filter_values_value").on(t.categoryId, t.filterId, t.valueId),
  ],
);

/**
 * Urun ve varyant kodlarinin tek havuzu. Tetikleyiciler doldurur
 * (migrations/0001_kurallar.sql); ayni kod ikinci kez girilemez.
 */
export const skuCodes = pgTable(
  "sku_codes",
  {
    /** Bosluklari atilmis, buyuk harfe cevrilmis kod */
    code: text("code").primaryKey(),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    /** Bos metin = urunun kendi kodu */
    variantId: text("variant_id").notNull().default(""),
  },
  (t) => [uniqueIndex("sku_codes_owner").on(t.productId, t.variantId)],
);

/** Eski linkler (previousSlugs, previousPaths). */
export const redirects = pgTable(
  "redirects",
  {
    oldPath: text("old_path").primaryKey(),
    targetType: text("target_type").notNull(),
    targetId: text("target_id").notNull(),
    /** Secenege donusturulmus eski urun: o secenekle acilir */
    variantId: text("variant_id"),
    createdAt: tstz("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("redirects_target").on(t.targetType, t.targetId),
    check("redirects_target_type", oneOf(t.targetType, ["product", "category", "group", "blog", "news", "event"])),
    check("redirects_old_path", sql`${t.oldPath} LIKE '/%'`),
  ],
);
