import { and, desc, eq, gte, ilike, lt, or, sql, type SQL } from "drizzle-orm";
import type { AuditDb } from "./audit";
import * as s from "./schema";

/**
 * PANEL › ISLEM KAYDI VE E-POSTA KAYDI (veritabani modu; Asama 5, 6. alan;
 * KARARLAR K-81, K-98, K-99)
 *
 * Iki ekran da yalnizca okur: islem kaydi (audit_log) panelde yapilan her
 * degisikligi ve panele giris/cikisi; e-posta kaydi (email_log) sitenin
 * gonderdigi (ya da gonderemedigi) her e-postayi gosterir. En yeni kayit
 * once, sayfa basina 50 kayit; "daha eski" icin son kaydin numarasi
 * (before) verilir. Suzgecler: tur, yonetici / durum, tarih araligi
 * (Turkiye gunu), metin.
 */

export const LOG_PAGE_SIZE = 50;

export interface AuditLogRow {
  id: number;
  at: string;
  actorUserId?: string;
  actorName: string;
  action: "create" | "update" | "delete" | "login" | "logout";
  entityType: string;
  entityId: string;
  entityLabel?: string;
  changes?: Record<string, unknown>;
  ip?: string;
}

export interface EmailLogRow {
  id: number;
  at: string;
  type: string;
  sourcePath?: string;
  entityType?: string;
  entityId?: string;
  recipients: string[];
  replyTo?: string;
  subject: string;
  status: "sent" | "failed" | "skipped";
  error?: string;
}

export interface LogPage<T> {
  entries: T[];
  /** Daha eski kayit var mi (bir sonraki sayfa: son kaydin numarasiyla) */
  more: boolean;
}

interface CommonFilter {
  /** Turkiye gunu (YYYY-AA-GG), dahil */
  from?: string;
  /** Turkiye gunu (YYYY-AA-GG), dahil */
  to?: string;
  /** Aranan metin */
  q?: string;
  /** Bu numaradan eski kayitlar (sayfalama) */
  before?: number;
}

export interface AuditLogFilter extends CommonFilter {
  entityType?: string;
  actorUserId?: string;
  action?: string;
}

export interface EmailLogFilter extends CommonFilter {
  type?: string;
  status?: string;
}

const DAY = /^\d{4}-\d{2}-\d{2}$/;
/** Turkiye gununun basi (UTC+3; Turkiye'de yaz saati yok). */
export const turkeyDayStart = (day: string) => new Date(`${day}T00:00:00+03:00`);
const nextDay = (day: string) => new Date(turkeyDayStart(day).getTime() + 24 * 60 * 60 * 1000);
const validDay = (day?: string) => (day && DAY.test(day) && !Number.isNaN(turkeyDayStart(day).getTime()) ? day : undefined);

/** ILIKE icin: % ve _ harfiyen aranir. */
const like = (q: string) => `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;

function common(column: { at: Parameters<typeof gte>[0]; id: Parameters<typeof lt>[0] }, filter: CommonFilter): (SQL | undefined)[] {
  const from = validDay(filter.from);
  const to = validDay(filter.to);
  return [
    from ? gte(column.at, turkeyDayStart(from)) : undefined,
    to ? lt(column.at, nextDay(to)) : undefined,
    filter.before && Number.isSafeInteger(filter.before) ? lt(column.id, filter.before) : undefined,
  ];
}

const opt = <T>(value: T | null) => value ?? undefined;

export async function readAuditLog(db: AuditDb, filter: AuditLogFilter = {}, limit = LOG_PAGE_SIZE): Promise<LogPage<AuditLogRow>> {
  const t = s.auditLog;
  const q = filter.q?.trim().slice(0, 100);
  const rows = await db
    .select({
      id: t.id,
      at: t.at,
      actorUserId: t.actorUserId,
      actorName: t.actorName,
      action: t.action,
      entityType: t.entityType,
      entityId: t.entityId,
      entityLabel: t.entityLabel,
      changes: t.changes,
      ip: sql<string | null>`host(${t.ip})`,
    })
    .from(t)
    .where(
      and(
        filter.entityType ? eq(t.entityType, filter.entityType) : undefined,
        filter.actorUserId ? eq(t.actorUserId, filter.actorUserId) : undefined,
        filter.action ? eq(t.action, filter.action) : undefined,
        q ? or(ilike(t.entityLabel, like(q)), ilike(t.entityId, like(q)), ilike(t.actorName, like(q))) : undefined,
        ...common({ at: t.at, id: t.id }, filter),
      ),
    )
    .orderBy(desc(t.id))
    .limit(limit + 1);
  return {
    more: rows.length > limit,
    entries: rows.slice(0, limit).map((r) => ({
      id: r.id,
      at: r.at.toISOString(),
      actorUserId: opt(r.actorUserId),
      actorName: r.actorName,
      action: r.action as AuditLogRow["action"],
      entityType: r.entityType,
      entityId: r.entityId,
      entityLabel: opt(r.entityLabel),
      changes: (r.changes as Record<string, unknown> | null) ?? undefined,
      ip: opt(r.ip),
    })),
  };
}

/** Islem kaydinin suzgecleri: kayitta gecen turler ve yoneticiler. */
export async function auditLogFacets(db: AuditDb): Promise<{ entityTypes: string[]; actors: { id: string; name: string }[] }> {
  const t = s.auditLog;
  const types = await db.selectDistinct({ entityType: t.entityType }).from(t).orderBy(t.entityType);
  const actors = await db
    .select({ id: t.actorUserId, name: sql<string>`(array_agg(${t.actorName} ORDER BY ${t.id} DESC))[1]` })
    .from(t)
    .where(sql`${t.actorUserId} IS NOT NULL`)
    .groupBy(t.actorUserId);
  return {
    entityTypes: types.map((r) => r.entityType),
    actors: actors
      .map((a) => ({ id: a.id!, name: a.name }))
      .sort((a, b) => a.name.localeCompare(b.name, "tr")),
  };
}

export async function readEmailLog(db: AuditDb, filter: EmailLogFilter = {}, limit = LOG_PAGE_SIZE): Promise<LogPage<EmailLogRow>> {
  const t = s.emailLog;
  const q = filter.q?.trim().slice(0, 100);
  const rows = await db
    .select()
    .from(t)
    .where(
      and(
        filter.type ? eq(t.type, filter.type) : undefined,
        filter.status ? eq(t.status, filter.status) : undefined,
        q
          ? or(
              ilike(sql`array_to_string(${t.recipients}, ' ')`, like(q)),
              ilike(t.replyTo, like(q)),
              ilike(t.subject, like(q)),
              ilike(t.entityId, like(q)),
            )
          : undefined,
        ...common({ at: t.createdAt, id: t.id }, filter),
      ),
    )
    .orderBy(desc(t.id))
    .limit(limit + 1);
  return {
    more: rows.length > limit,
    entries: rows.slice(0, limit).map((r) => ({
      id: r.id,
      at: r.createdAt.toISOString(),
      type: r.type,
      sourcePath: opt(r.sourcePath),
      entityType: opt(r.entityType),
      entityId: opt(r.entityId),
      recipients: r.recipients,
      replyTo: opt(r.replyTo),
      subject: r.subject,
      status: r.status as EmailLogRow["status"],
      error: opt(r.error),
    })),
  };
}
