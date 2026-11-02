import { sql } from "drizzle-orm";
import { bigint, boolean, check, date, integer, jsonb, pgTable, smallint, text } from "drizzle-orm/pg-core";
import type { AboutSection, AboutStat, SeoFields } from "@zenweld/data";
import { DOCUMENT_SECTIONS, oneOf, timestamps, tstz } from "./columns";
import { products } from "./catalog";

/**
 * ICERIK (docs/VERITABANI.md › 9)
 */

export const blogPosts = pgTable("blog_posts", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique("blog_posts_slug"),
  title: text("title").notNull(),
  excerpt: text("excerpt").notNull(),
  body: text("body").notNull(),
  coverUrl: text("cover_url").notNull(),
  category: text("category").notNull(),
  author: text("author").notNull(),
  publishedAt: tstz("published_at").notNull(),
  active: boolean("active").notNull().default(true),
  seo: jsonb("seo").$type<SeoFields>(),
  ...timestamps(),
});

export const news = pgTable("news", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique("news_slug"),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  body: text("body").notNull(),
  coverUrl: text("cover_url").notNull(),
  images: jsonb("images").$type<string[]>().notNull().default([]),
  publishedAt: tstz("published_at").notNull(),
  active: boolean("active").notNull().default(true),
  seo: jsonb("seo").$type<SeoFields>(),
  ...timestamps(),
});

export const events = pgTable(
  "events",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull().unique("events_slug"),
    title: text("title").notNull(),
    summary: text("summary").notNull(),
    description: text("description").notNull(),
    startDate: date("start_date", { mode: "string" }).notNull(),
    endDate: date("end_date", { mode: "string" }).notNull(),
    venue: text("venue").notNull(),
    city: text("city").notNull(),
    country: text("country").notNull(),
    logoUrl: text("logo_url").notNull(),
    images: jsonb("images").$type<string[]>().notNull().default([]),
    websiteUrl: text("website_url"),
    active: boolean("active").notNull().default(true),
    seo: jsonb("seo").$type<SeoFields>(),
    ...timestamps(),
  },
  (t) => [check("events_dates", sql`${t.endDate} >= ${t.startDate}`)],
);

export const faqs = pgTable(
  "faqs",
  {
    id: text("id").primaryKey(),
    question: text("question").notNull(),
    answer: text("answer").notNull(),
    topic: text("topic").notNull(),
    position: integer("position").notNull(),
    ...timestamps(),
  },
  (t) => [check("faqs_topic", oneOf(t.topic, ["genel", "garanti", "siparis", "teknik"]))],
);

export const salesReps = pgTable("sales_reps", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  region: text("region").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  photoUrl: text("photo_url"),
  position: integer("position").notNull(),
  active: boolean("active").notNull().default(true),
  ...timestamps(),
});

/** Yasal metinler: silinemez; adres koddaki eslemeden (packages/data/src/legal.ts). */
export const legalPages = pgTable("legal_pages", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  updatedAt: tstz("updated_at").notNull().defaultNow(),
});

/** Hakkimizda: tek satir. */
export const aboutPage = pgTable(
  "about_page",
  {
    id: smallint("id").primaryKey().default(1),
    heroTitle: text("hero_title").notNull(),
    heroSubtitle: text("hero_subtitle").notNull(),
    heroImage: text("hero_image"),
    stats: jsonb("stats").$type<AboutStat[]>().notNull().default([]),
    sections: jsonb("sections").$type<AboutSection[]>().notNull().default([]),
    updatedAt: tstz("updated_at").notNull().defaultNow(),
  },
  (t) => [check("about_page_single", sql`${t.id} = 1`)],
);

/** Sabit sayfalarin arama bilgileri (Icerik › Sayfa SEO). */
export const pageSeo = pgTable(
  "page_seo",
  {
    path: text("path").primaryKey(),
    title: text("title"),
    description: text("description"),
    updatedAt: tstz("updated_at").notNull().defaultNow(),
  },
  (t) => [check("page_seo_path", sql`${t.path} LIKE '/%'`)],
);

/** Belge sayfalarinin basligi ve aciklamasi. */
export const documentPages = pgTable(
  "document_pages",
  {
    section: text("section").primaryKey(),
    title: text("title").notNull(),
    subtitle: text("subtitle").notNull(),
    updatedAt: tstz("updated_at").notNull().defaultNow(),
  },
  (t) => [check("document_pages_section", oneOf(t.section, DOCUMENT_SECTIONS))],
);

export const documents = pgTable(
  "documents",
  {
    id: text("id").primaryKey(),
    section: text("section").notNull(),
    title: text("title").notNull(),
    productId: text("product_id").references(() => products.id, { onDelete: "set null" }),
    /** Parti sertifikalarinda */
    lotNumber: text("lot_number"),
    fileName: text("file_name").notNull(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: bigint("size_bytes", { mode: "number" }).notNull(),
    /** Dosya deposundaki yol */
    fileKey: text("file_key").notNull(),
    active: boolean("active").notNull().default(true),
    /** Sitedeki sira */
    position: integer("position").notNull(),
    ...timestamps(),
  },
  (t) => [check("documents_section", oneOf(t.section, DOCUMENT_SECTIONS))],
);
