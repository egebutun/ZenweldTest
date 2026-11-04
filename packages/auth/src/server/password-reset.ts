import { createHash, randomBytes } from "node:crypto";
import { and, desc, eq, gt, isNull, sql } from "drizzle-orm";
import { schema } from "@zenweld/db";
import { AUTH_ERRORS, NO_FAILED_LOGINS, passwordProblem } from "../rules";
import type { AccountFailure } from "./accounts";
import { hashPassword } from "./password";
import { SESSION_RULES, deleteUserSessions, type AuthDb } from "./session";

/**
 * SIFRE SIFIRLAMA (yalnizca sunucu; Asama 4.4, KARARLAR K-95)
 *
 * - Baglanti tek kullanimliktir ve 1 saat gecerlidir. Veritabaninda
 *   anahtarin kendisi degil ozeti (sha256) durur.
 * - Ayni hesap icin 15 dakikada en fazla bir baglanti uretilir; yeni
 *   baglanti eskilerini gecersiz kilar.
 * - Yalnizca sitenin aktif uyeleri (bireysel, kurumsal) icin; yonetici
 *   sifresi npm run yonetici:olustur ile degisir.
 * - Istek yapan, hesabin olup olmadigini ogrenemez: cagiran her durumda
 *   ayni yaniti verir.
 * - Sifre degisince uyenin butun oturumlari kapanir; yanlis sifre sayaci ve
 *   kilit sifirlanir.
 */

export const RESET_RULES = { lifetimeMs: 60 * 60_000, cooldownMs: 15 * 60_000 };

const digest = (token: string) => createHash("sha256").update(token).digest("hex");

/**
 * Baglanti uretilebiliyorsa anahtar ve uyenin e-postasi; yoksa null (hesap
 * yok, uygun degil ya da cok sik). Cagiran bir islem (transaction) icinde
 * cagirir.
 */
export async function requestPasswordReset(
  db: AuthDb,
  email: unknown,
  now = new Date(),
): Promise<{ token: string; email: string; firstName: string; expiresAt: Date } | null> {
  const wanted = typeof email === "string" ? email.trim().toLowerCase() : "";
  if (!wanted) return null;
  // Uye satiri kilitlenir: ayni anda gelen iki istek iki baglanti uretmesin.
  const [found] = await db
    .select()
    .from(schema.users)
    .where(sql`lower(${schema.users.email}) = ${wanted}`)
    .for("update");
  if (!found || found.status !== "active" || !SESSION_RULES.site.roles.includes(found.role)) return null;

  const [latest] = await db
    .select({ createdAt: schema.passwordResetTokens.createdAt })
    .from(schema.passwordResetTokens)
    .where(eq(schema.passwordResetTokens.userId, found.id))
    .orderBy(desc(schema.passwordResetTokens.createdAt))
    .limit(1);
  if (latest && now.getTime() - latest.createdAt.getTime() < RESET_RULES.cooldownMs) return null;

  await db.delete(schema.passwordResetTokens).where(eq(schema.passwordResetTokens.userId, found.id));
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(now.getTime() + RESET_RULES.lifetimeMs);
  await db.insert(schema.passwordResetTokens).values({ tokenHash: digest(token), userId: found.id, createdAt: now, expiresAt });
  return { token, email: found.email, firstName: found.firstName, expiresAt };
}

/** Baglantidaki anahtarla yeni sifre. Cagiran bir islem (transaction) icinde cagirir. */
export async function resetPassword(
  db: AuthDb,
  input: { token?: unknown; password?: unknown },
  now = new Date(),
): Promise<{ ok: true } | AccountFailure> {
  const token = typeof input.token === "string" ? input.token : "";
  const [row] = token
    ? await db
        .select({ reset: schema.passwordResetTokens, user: schema.users })
        .from(schema.passwordResetTokens)
        .innerJoin(schema.users, eq(schema.users.id, schema.passwordResetTokens.userId))
        .where(
          and(
            eq(schema.passwordResetTokens.tokenHash, digest(token)),
            isNull(schema.passwordResetTokens.usedAt),
            gt(schema.passwordResetTokens.expiresAt, now),
          ),
        )
        .for("update")
    : [];
  if (!row || row.user.status !== "active" || !SESSION_RULES.site.roles.includes(row.user.role)) {
    return { ok: false, status: 400, error: AUTH_ERRORS.resetLinkInvalid };
  }
  const password = typeof input.password === "string" ? input.password : "";
  const problem = passwordProblem(password);
  if (problem) return { ok: false, status: 400, error: problem };

  await db
    .update(schema.users)
    .set({
      passwordHash: await hashPassword(password),
      passwordChangedAt: now,
      updatedAt: now,
      failedLoginCount: NO_FAILED_LOGINS.failedCount,
      failedLoginSince: NO_FAILED_LOGINS.failedSince,
      loginLockedUntil: NO_FAILED_LOGINS.lockedUntil,
    })
    .where(eq(schema.users.id, row.user.id));
  await db
    .update(schema.passwordResetTokens)
    .set({ usedAt: now })
    .where(eq(schema.passwordResetTokens.tokenHash, row.reset.tokenHash));
  await deleteUserSessions(db, row.user.id);
  return { ok: true };
}
