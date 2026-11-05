import { boolean, check, index, pgTable, text } from "drizzle-orm/pg-core";
import { oneOf, timestamps, tstz } from "./columns";
import { dealers } from "./network";
import { products } from "./catalog";
import { users } from "./users";

/**
 * BUGUN YALNIZCA E-POSTAYA GIDEN FORMLAR (docs/VERITABANI.md › 11, K-81)
 *
 * E-posta yine gider; kayit e-posta gitmese de alinir. Panel ekranlari:
 * Bayilik Basvurulari, Mesajlar, Welders Club (Asama 5, 2. alan; K-100).
 */

/** Bayilik Basvurusu. */
export const dealerApplications = pgTable(
  "dealer_applications",
  {
    id: text("id").primaryKey(),
    status: text("status").notNull().default("new"),
    companyName: text("company_name").notNull(),
    /** Formda tek alan: "Vergi dairesi / no" */
    taxInfo: text("tax_info"),
    city: text("city"),
    /** Faaliyet alani */
    sector: text("sector"),
    /** Sektordeki yil: 0-2, 3-5, 6-10, 10+ */
    yearsInSector: text("years_in_sector"),
    /** Calistigi markalar */
    brands: text("brands"),
    hasShowroom: boolean("has_showroom"),
    hasService: boolean("has_service"),
    contactName: text("contact_name"),
    email: text("email").notNull(),
    phone: text("phone"),
    message: text("message"),
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
    /** Basvuru onaylanip bayi kaydi acilinca */
    dealerId: text("dealer_id").references(() => dealers.id, { onDelete: "set null" }),
    adminNote: text("admin_note"),
    ...timestamps(),
  },
  (t) => [
    index("dealer_applications_created").on(t.createdAt.desc()),
    check("dealer_applications_status", oneOf(t.status, ["new", "reviewing", "approved", "rejected"])),
    check("dealer_applications_years", oneOf(t.yearsInSector, ["0-2", "3-5", "6-10", "10+"])),
  ],
);

/** Iletisim formu ve urun sayfasindaki destek sorusu. */
export const supportMessages = pgTable(
  "support_messages",
  {
    id: text("id").primaryKey(),
    /** iletisim: Iletisim formu; urun-destek: urun sayfasindaki soru */
    type: text("type").notNull(),
    status: text("status").notNull().default("new"),
    name: text("name"),
    email: text("email"),
    phone: text("phone"),
    /** Iletisim formunda konu */
    subject: text("subject"),
    message: text("message").notNull(),
    productId: text("product_id").references(() => products.id, { onDelete: "set null" }),
    /** Kopya: sorunun soruldugu urun ve kodu */
    productName: text("product_name"),
    productSku: text("product_sku"),
    /** Formun gonderildigi sayfa */
    pageUrl: text("page_url"),
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
    adminNote: text("admin_note"),
    ...timestamps(),
  },
  (t) => [
    index("support_messages_type").on(t.type, t.createdAt.desc()),
    check("support_messages_type", oneOf(t.type, ["iletisim", "urun-destek"])),
    check("support_messages_status", oneOf(t.status, ["new", "read", "answered"])),
  ],
);

/** Welders Club katilim. */
export const weldersClubSignups = pgTable(
  "welders_club_signups",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    city: text("city"),
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
    /** Kulupten ayrilmak isteyen panelde pasife alinir; kayit silinmez (K-100) */
    leftAt: tstz("left_at"),
    createdAt: tstz("created_at").notNull().defaultNow(),
    updatedAt: tstz("updated_at").notNull().defaultNow(),
  },
  (t) => [index("welders_club_signups_created").on(t.createdAt.desc())],
);
