import type { NodePgQueryResultHKT } from "drizzle-orm/node-postgres";
import type { PgDatabase } from "drizzle-orm/pg-core";
import * as s from "./schema";

/**
 * PANEL DEGISIKLIK KAYDI — audit_log (KARARLAR K-81, K-99; VERITABANI.md)
 *
 * Panelde yapilan her degisiklik ve panele giris/cikis yazilir. Kayit,
 * degisiklikle ayni islemde (transaction) yazilir: degisiklik yapilip kaydi
 * dusmemesi olamaz. Sifre ozeti ve oturum bilgisi yazilmaz.
 */

export type AuditDb = PgDatabase<NodePgQueryResultHKT, typeof s>;

/** Islemi yapan yonetici (panel oturumundan). */
export interface Actor {
  id: string;
  name: string;
  ip?: string;
}

export type AuditAction = "create" | "update" | "delete" | "login" | "logout";

/** Degisen alanlar: { alan: [eski, yeni] }. */
export type AuditChanges = Record<string, [unknown, unknown]>;

export interface AuditEntry {
  action: AuditAction;
  /** Tablo adi (orders, coupons...); giris/cikista users */
  entityType: string;
  entityId: string;
  /** Okunur ad (siparis no, kupon kodu) */
  entityLabel?: string;
  /** Guncellemede degisen alanlar; olusturmada ve silmede kaydin hali */
  changes?: Record<string, unknown>;
}

export async function writeAudit(db: AuditDb, actor: Actor, entry: AuditEntry, at: Date): Promise<void> {
  await db.insert(s.auditLog).values({
    at,
    actorUserId: actor.id,
    actorName: actor.name,
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId,
    entityLabel: entry.entityLabel ?? null,
    changes: entry.changes ?? null,
    ip: actor.ip ?? null,
  });
}

/**
 * Iki halin farki: yalnizca degisen alanlar ({ alan: [eski, yeni] }).
 * Bos alan (undefined) null yazilir; diziler ve nesneler icerikleriyle
 * karsilastirilir.
 */
export function changedFields<T extends object>(before: T, after: T, keys: readonly (keyof T & string)[]): AuditChanges {
  const changes: AuditChanges = {};
  for (const key of keys) {
    const old = before[key] ?? null;
    const now = after[key] ?? null;
    if (JSON.stringify(old) !== JSON.stringify(now)) changes[key] = [old, now];
  }
  return changes;
}
