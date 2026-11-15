import { sql } from "drizzle-orm";
import { bigint, check, index, inet, integer, jsonb, pgTable, text, uniqueIndex, type AnyPgColumn } from "drizzle-orm/pg-core";
import { oneOf, tstz } from "./columns";
import { users } from "./users";

/**
 * E-POSTALAR, KAYIT NUMARALARI VE DEGISIKLIK KAYDI
 * (docs/VERITABANI.md › 11, KARARLAR K-81)
 */

/**
 * E-posta turleri (Panel › E-posta'nin sekmeleri; packages/data › email.ts
 * › EMAIL_KINDS ile ayni liste, tests/db/sema.test.ts karsilastirir).
 */
export const EMAIL_TYPES = [
  "siparis",
  "iade",
  "teklif",
  "servis",
  "garanti",
  "yorum",
  "uye",
  "iletisim",
  "urun-destek",
  "bayilik",
  "sifre-sifirlama",
  "bulten",
] as const;

/**
 * E-posta turunun adresleri (KARARLAR K-116). Satir yoksa, gonderici ya da
 * alici bossa varsayilan adres (SUPPORT_EMAIL, yoksa info@zenweld.com).
 */
export const emailSettings = pgTable(
  "email_settings",
  {
    type: text("type").primaryKey(),
    /** Gonderici adres */
    sender: text("sender"),
    /** Zenweld'e giden e-postanin alicilari */
    recipients: text("recipients").array().notNull().default(sql`'{}'::text[]`),
    updatedAt: tstz("updated_at").notNull().defaultNow(),
    updatedBy: text("updated_by").references(() => users.id, { onDelete: "set null" }),
  },
  (t) => [
    check("email_settings_type", oneOf(t.type, EMAIL_TYPES)),
    check("email_settings_not_empty", sql`${t.sender} IS NOT NULL OR cardinality(${t.recipients}) >= 1`),
  ],
);

/**
 * Yazismalar (KARARLAR K-81, K-116): sitenin gonderdigi her e-posta (form
 * bildirimi, musteriye giden, panelden yazilan) ve posta kutusundan panele
 * alinan yanitlar; metniyle.
 */
export const emailLog = pgTable(
  "email_log",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    type: text("type").notNull(),
    /** out: siteden giden; in: posta kutusundan gelen */
    direction: text("direction").notNull().default("out"),
    /** Formun gonderildigi sayfa */
    sourcePath: text("source_path"),
    entityType: text("entity_type"),
    entityId: text("entity_id"),
    fromAddress: text("from_address"),
    recipients: text("recipients").array().notNull(),
    replyTo: text("reply_to"),
    subject: text("subject").notNull(),
    /** Duz metin; K-116'dan once gonderilenlerde bos */
    body: text("body"),
    status: text("status").notNull(),
    providerMessageId: text("provider_message_id"),
    /** E-postanin Message-ID basligi (yaniti eslestirmek ve ayni e-postayi iki kez almamak icin) */
    messageId: text("message_id"),
    /** Yanitlanan e-posta */
    parentId: bigint("parent_id", { mode: "number" }).references((): AnyPgColumn => emailLog.id, { onDelete: "set null" }),
    /** Gelen e-postanin eklerinin adlari; dosyalar posta kutusunda kalir */
    attachments: text("attachments").array().notNull().default(sql`'{}'::text[]`),
    /** Panelden gonderen yonetici (kopya ad; hesap silinse de okunur) */
    actorUserId: text("actor_user_id").references(() => users.id, { onDelete: "set null" }),
    actorName: text("actor_name"),
    error: text("error"),
    createdAt: tstz("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("email_log_type").on(t.type, t.createdAt.desc()),
    index("email_log_entity").on(t.entityType, t.entityId),
    index("email_log_message").on(t.messageId),
    uniqueIndex("email_log_incoming").on(t.messageId).where(sql`${t.direction} = 'in'`),
    check("email_log_type", oneOf(t.type, EMAIL_TYPES)),
    check("email_log_direction", oneOf(t.direction, ["out", "in"])),
    check("email_log_status", oneOf(t.status, ["sent", "failed", "skipped", "received"])),
    check("email_log_received", sql`(${t.direction} = 'in') = (${t.status} = 'received')`),
  ],
);

/**
 * Posta kutusu okumasinin yeri (KARARLAR K-116): kutu basina en son okunan
 * e-postanin sira numarasi (IMAP UID) ve son okuma.
 */
export const mailboxState = pgTable("mailbox_state", {
  /** "imap:info@zenweld.com/INBOX" ya da "klasor:/yol" */
  mailbox: text("mailbox").primaryKey(),
  uidValidity: bigint("uid_validity", { mode: "number" }),
  lastUid: bigint("last_uid", { mode: "number" }).notNull().default(0),
  checkedAt: tstz("checked_at"),
  /** Son okumanin hatasi; basariliysa bos */
  lastError: text("last_error"),
});

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
