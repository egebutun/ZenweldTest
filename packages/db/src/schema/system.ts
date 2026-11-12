import { sql } from "drizzle-orm";
import { bigint, check, index, inet, integer, jsonb, pgTable, text } from "drizzle-orm/pg-core";
import { oneOf, tstz } from "./columns";
import { users } from "./users";

/**
 * E-POSTALAR, KAYIT NUMARALARI VE DEGISIKLIK KAYDI
 * (docs/VERITABANI.md › 11, KARARLAR K-81)
 */

/** Zenweld'e giden e-postalarin turleri (IS-KURALLARI › Form e-postalari). */
export const EMAIL_TYPES = [
  "iletisim",
  "bayilik",
  "urun-destek",
  "teklif",
  "servis",
  "garanti",
  "yorum",
  "uye",
  "siparis",
  "iade",
] as const;

/** Musteriye giden e-postalarin turleri; yalnizca email_log'da (alicisi musteridir). */
export const CUSTOMER_EMAIL_TYPES = ["sifre-sifirlama"] as const;

/** E-postalarin alicilari, tur basina. Satir yoksa varsayilan adres (SUPPORT_EMAIL). */
export const emailRecipients = pgTable(
  "email_recipients",
  {
    type: text("type").primaryKey(),
    recipients: text("recipients").array().notNull(),
    updatedAt: tstz("updated_at").notNull().defaultNow(),
    updatedBy: text("updated_by").references(() => users.id, { onDelete: "set null" }),
  },
  (t) => [
    check("email_recipients_type", oneOf(t.type, EMAIL_TYPES)),
    check("email_recipients_not_empty", sql`cardinality(${t.recipients}) >= 1`),
  ],
);

/** Gonderilen her e-posta: hangi ozellik ve sayfa icin gonderildigi. Metni saklanmaz. */
export const emailLog = pgTable(
  "email_log",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    type: text("type").notNull(),
    /** Formun gonderildigi sayfa */
    sourcePath: text("source_path"),
    entityType: text("entity_type"),
    entityId: text("entity_id"),
    recipients: text("recipients").array().notNull(),
    replyTo: text("reply_to"),
    subject: text("subject").notNull(),
    status: text("status").notNull(),
    providerMessageId: text("provider_message_id"),
    error: text("error"),
    createdAt: tstz("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("email_log_type").on(t.type, t.createdAt.desc()),
    index("email_log_entity").on(t.entityType, t.entityId),
    check("email_log_type", oneOf(t.type, [...EMAIL_TYPES, ...CUSTOMER_EMAIL_TYPES])),
    check("email_log_status", oneOf(t.status, ["sent", "failed", "skipped"])),
  ],
);

/** Son verilen kayit numaralari ("TKL-2026-" -> 49). */
export const recordCounters = pgTable(
  "record_counters",
  {
    prefix: text("prefix").primaryKey(),
    lastNumber: integer("last_number").notNull(),
  },
  (t) => [check("record_counters_positive", sql`${t.lastNumber} >= 0`)],
);

/**
 * Panel degisiklik kaydi. Yalnizca eklenir; degistirilemez, elle
 * silinemez; 2 yildan eski kayitlar her gun silinir
 * (migrations/0001_kurallar.sql › purge_audit_log).
 */
export const auditLog = pgTable(
  "audit_log",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    at: tstz("at").notNull().defaultNow(),
    /** Baglantisiz: kayit degistirilemedigi icin yonetici silinse de kimlik kalir */
    actorUserId: text("actor_user_id"),
    /** Kopya; yonetici silinse de okunur */
    actorName: text("actor_name").notNull(),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    entityLabel: text("entity_label"),
    /** Degisen alanlar: { alan: [eski, yeni] }; silmede kaydin son hali */
    changes: jsonb("changes"),
    ip: inet("ip"),
  },
  (t) => [
    index("audit_log_entity").on(t.entityType, t.entityId, t.at.desc()),
    index("audit_log_at").on(t.at.desc()),
    check("audit_log_action", oneOf(t.action, ["create", "update", "delete", "login", "logout"])),
  ],
);
