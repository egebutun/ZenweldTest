import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, lt, ne } from "drizzle-orm";
import type { NodePgQueryResultHKT } from "drizzle-orm/node-postgres";
import type { PgDatabase } from "drizzle-orm/pg-core";
import { schema } from "@zenweld/db";

/**
 * OTURUMLAR (yalnizca sunucu; KARARLAR K-94, docs/SUNUCU.md › 7 ›
 * Sifre ve oturum)
 *
 * - Oturum anahtari 32 rastgele bayttir; tarayiciya yalnizca sunucunun
 *   okuyabildigi cerezle verilir. Veritabaninda anahtarin kendisi degil
 *   ozeti (sha256) durur: veritabani okunsa da oturum calinmaz.
 * - Site ve panel oturumlari ayridir (scope). Site oturumu yalnizca bireysel
 *   ve kurumsal uyeye, panel oturumu yalnizca yoneticiye acilir.
 * - Sure: site 30 gun ve kullanildikca uzar; panel girisinden 8 saat sonra
 *   biter, uzamaz.
 * - Uye askiya alinirsa ya da rolu degisirse oturum gecersizdir. Sifre
 *   degisince diger oturumlar deleteUserSessions ile kapatilir.
 */

/** Baglanti ya da islem (transaction). */
export type AuthDb = PgDatabase<NodePgQueryResultHKT, typeof schema>;
type Database = AuthDb;
export type SessionScope = "site" | "admin";

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

export const SESSION_RULES: Record<SessionScope, { lifetimeMs: number; sliding: boolean; roles: string[] }> = {
  site: { lifetimeMs: 30 * DAY, sliding: true, roles: ["individual", "business"] },
  admin: { lifetimeMs: 8 * HOUR, sliding: false, roles: ["admin"] },
};

/** Kayan oturumun suresi en fazla bu siklikla uzatilir (her istekte yazilmasin). */
const EXTEND_EVERY_MS = HOUR;

const digest = (token: string) => createHash("sha256").update(token).digest("hex");

export interface NewSession {
  /** Cereze yazilacak anahtar; baska yerde saklanmaz. */
  token: string;
  expiresAt: Date;
}

export async function createSession(
  db: Database,
  userId: string,
  scope: SessionScope,
  client: { ip?: string; userAgent?: string } = {},
  now = new Date(),
): Promise<NewSession> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(now.getTime() + SESSION_RULES[scope].lifetimeMs);
  // Uyenin suresi dolmus eski oturumlari temizlenir.
  await db
    .delete(schema.sessions)
    .where(and(eq(schema.sessions.userId, userId), lt(schema.sessions.expiresAt, now)));
  await db.insert(schema.sessions).values({
    id: digest(token),
    userId,
    scope,
    createdAt: now,
    lastSeenAt: now,
    expiresAt,
    ip: client.ip ?? null,
    userAgent: client.userAgent?.slice(0, 500) ?? null,
  });
  return { token, expiresAt };
}

export type SessionUser = typeof schema.users.$inferSelect;

/**
 * Cerezdeki anahtarin oturumu ve uyesi; gecersizse null. Kayan oturumun
 * suresi gerekirse uzatilir (yeni bitis ani doner, cerez de uzatilmali).
 */
export async function readSession(
  db: Database,
  token: string | undefined,
  scope: SessionScope,
  now = new Date(),
): Promise<{ user: SessionUser; sessionId: string; expiresAt: Date } | null> {
  if (!token) return null;
  const id = digest(token);
  const [row] = await db
    .select({ session: schema.sessions, user: schema.users })
    .from(schema.sessions)
    .innerJoin(schema.users, eq(schema.users.id, schema.sessions.userId))
    .where(and(eq(schema.sessions.id, id), eq(schema.sessions.scope, scope), gt(schema.sessions.expiresAt, now)));
  if (!row) return null;
  const { session, user } = row;
  const rules = SESSION_RULES[scope];
  if (user.status !== "active" || !rules.roles.includes(user.role)) return null;

  let expiresAt = session.expiresAt;
  if (rules.sliding && now.getTime() - session.lastSeenAt.getTime() >= EXTEND_EVERY_MS) {
    expiresAt = new Date(now.getTime() + rules.lifetimeMs);
    await db.update(schema.sessions).set({ lastSeenAt: now, expiresAt }).where(eq(schema.sessions.id, id));
  }
  return { user, sessionId: id, expiresAt };
}

/** Cikis: bu oturum kapanir. */
export async function deleteSession(db: Database, token: string | undefined): Promise<void> {
  if (token) await db.delete(schema.sessions).where(eq(schema.sessions.id, digest(token)));
}

/**
 * Uyenin oturumlarini kapatir (sifre degisince, askiya alininca, hesap
 * silinince); keepSessionId verilirse o oturum acik kalir.
 */
export async function deleteUserSessions(db: Database, userId: string, keepSessionId?: string): Promise<number> {
  const removed = await db
    .delete(schema.sessions)
    .where(and(eq(schema.sessions.userId, userId), keepSessionId ? ne(schema.sessions.id, keepSessionId) : undefined))
    .returning({ id: schema.sessions.id });
  return removed.length;
}
