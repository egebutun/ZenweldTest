import { randomBytes } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import type { User } from "@zenweld/data";
import { schema, userRecord } from "@zenweld/db";
import {
  AUTH_ERRORS,
  NO_FAILED_LOGINS,
  afterFailedLogin,
  isLoginLocked,
  isValidEmail,
  passwordProblem,
  type LoginAttempts,
} from "../rules";
import { checkPassword, hashPassword } from "./password";
import { SESSION_RULES, createSession, deleteUserSessions, type AuthDb, type NewSession, type SessionScope } from "./session";

/**
 * UYELIK ISLEMLERI (yalnizca sunucu; IS-KURALLARI › 16, KARARLAR K-94)
 *
 * Giris, kayit, profil, sifre degistirme ve hesap silme. Giris ve kayit
 * oturum da actigi icin cagiran bir islem (transaction) icinde cagirir;
 * giriste uye satiri kilitlenir, ayni anda gelen yanlis denemeler dogru
 * sayilir. Girdiler tarayicidan geldigi icin burada yeniden denetlenir.
 */

type UserRow = typeof schema.users.$inferSelect;
export type AccountFailure = { ok: false; status: 400 | 401 | 403 | 409 | 429; error: string };
const fail = (status: AccountFailure["status"], error: string): AccountFailure => ({ ok: false, status, error });

export interface ClientInfo {
  ip?: string;
  userAgent?: string;
}

/** Tarayiciya giden uye kaydi: sifre ozeti gonderilmez. */
export function publicUser(row: UserRow): User {
  return { ...userRecord(row), passwordHash: "" };
}

export const newUserId = () => `u-${randomBytes(6).toString("hex")}`;

const text = (value: unknown, max = 200) => (typeof value === "string" ? value.trim().slice(0, max) : "");
const optional = (value: unknown) => text(value) || null;

const byEmail = (email: string) => sql`lower(${schema.users.email}) = ${email.trim().toLowerCase()}`;

const attemptsOf = (u: UserRow): LoginAttempts => ({
  failedCount: u.failedLoginCount,
  failedSince: u.failedLoginSince,
  lockedUntil: u.loginLockedUntil,
});
const attemptColumns = (a: LoginAttempts) => ({
  failedLoginCount: a.failedCount,
  failedLoginSince: a.failedSince,
  loginLockedUntil: a.lockedUntil,
});

/**
 * Giris. Hesap yoksa, bu bolume ait degilse (siteye yonetici, panele uye)
 * ya da sifre yanlissa ayni mesaj doner. Yanlis denemeler sayilir; 15
 * dakikada 10 yanlistan sonra hesap 15 dakika kilitlenir (K-94).
 */
export async function login(
  db: AuthDb,
  input: { email?: unknown; password?: unknown },
  scope: SessionScope,
  client: ClientInfo = {},
  now = new Date(),
): Promise<{ ok: true; user: User; session: NewSession } | AccountFailure> {
  const email = text(input.email, 254);
  if (!email) return fail(401, AUTH_ERRORS.invalidLogin);
  const [found] = await db.select().from(schema.users).where(byEmail(email)).for("update");
  if (!found || !SESSION_RULES[scope].roles.includes(found.role)) return fail(401, AUTH_ERRORS.invalidLogin);
  if (isLoginLocked(attemptsOf(found), now)) return fail(429, AUTH_ERRORS.tooManyAttempts);

  const password = await checkPassword(typeof input.password === "string" ? input.password : "", found.passwordHash);
  if (!password.ok) {
    const next = afterFailedLogin(attemptsOf(found), now);
    await db.update(schema.users).set(attemptColumns(next)).where(eq(schema.users.id, found.id));
    return next.lockedUntil ? fail(429, AUTH_ERRORS.tooManyAttempts) : fail(401, AUTH_ERRORS.invalidLogin);
  }
  if (found.status !== "active") return fail(403, AUTH_ERRORS.suspended);

  const [user] = await db
    .update(schema.users)
    .set({
      ...attemptColumns(NO_FAILED_LOGINS),
      lastLoginAt: now,
      // Eski demo ozeti guclu ozete cevrilir.
      ...(password.upgraded ? { passwordHash: password.upgraded } : {}),
    })
    .where(eq(schema.users.id, found.id))
    .returning();
  return { ok: true, user: publicUser(user), session: await createSession(db, user.id, scope, client, now) };
}

/** Siteye uye olma: bireysel ya da kurumsal; hemen aktif ve oturum acik. */
export async function register(
  db: AuthDb,
  input: Record<string, unknown>,
  client: ClientInfo = {},
  now = new Date(),
): Promise<{ ok: true; user: User; session: NewSession } | AccountFailure> {
  const role = input.role === "business" ? "business" : input.role === "individual" ? "individual" : null;
  const email = text(input.email, 254).toLowerCase();
  const fields = {
    firstName: text(input.firstName),
    lastName: text(input.lastName),
    phone: text(input.phone, 40),
    city: optional(input.city),
    companyName: role === "business" ? optional(input.companyName) : null,
    taxOffice: role === "business" ? optional(input.taxOffice) : null,
    taxNumber: role === "business" ? optional(input.taxNumber) : null,
    sector: role === "business" ? optional(input.sector) : null,
  };
  if (!role) return fail(400, AUTH_ERRORS.failed);
  if (!isValidEmail(email)) return fail(400, AUTH_ERRORS.invalidEmail);
  if (!fields.firstName || !fields.lastName || !fields.phone || (role === "business" && !fields.companyName)) {
    return fail(400, AUTH_ERRORS.missingFields);
  }
  const password = typeof input.password === "string" ? input.password : "";
  const problem = passwordProblem(password);
  if (problem) return fail(400, problem);

  const [taken] = await db.select({ id: schema.users.id }).from(schema.users).where(byEmail(email));
  if (taken) return fail(409, AUTH_ERRORS.emailTaken);
  const [user] = await db
    .insert(schema.users)
    .values({
      id: newUserId(),
      role,
      status: "active",
      email,
      passwordHash: await hashPassword(password),
      ...fields,
      newsletter: input.newsletter === true,
      createdAt: now,
      updatedAt: now,
      lastLoginAt: now,
    })
    .returning();
  return { ok: true, user: publicUser(user), session: await createSession(db, user.id, "site", client, now) };
}

/** Profil: ad, soyad, telefon, sehir; kurumsal uyede firma bilgileri. E-posta degismez. */
export async function updateProfile(
  db: AuthDb,
  userId: string,
  input: Record<string, unknown>,
): Promise<{ ok: true; user: User } | AccountFailure> {
  const [current] = await db.select().from(schema.users).where(eq(schema.users.id, userId));
  if (!current) return fail(401, AUTH_ERRORS.sessionEnded);
  const business = current.role === "business";
  const fields = {
    firstName: text(input.firstName),
    lastName: text(input.lastName),
    phone: text(input.phone, 40),
    city: optional(input.city),
    ...(business
      ? { companyName: optional(input.companyName), taxOffice: optional(input.taxOffice), taxNumber: optional(input.taxNumber) }
      : {}),
  };
  if (!fields.firstName || !fields.lastName || !fields.phone || (business && !fields.companyName)) {
    return fail(400, AUTH_ERRORS.missingFields);
  }
  const [user] = await db
    .update(schema.users)
    .set({ ...fields, updatedAt: new Date() })
    .where(eq(schema.users.id, userId))
    .returning();
  return { ok: true, user: publicUser(user) };
}

/** Sifre degistirme: mevcut sifre dogru olmali; uyenin diger oturumlari kapanir, bu oturum acik kalir. */
export async function changePassword(
  db: AuthDb,
  userId: string,
  sessionId: string,
  input: { current?: unknown; next?: unknown },
): Promise<{ ok: true } | AccountFailure> {
  const [user] = await db.select().from(schema.users).where(eq(schema.users.id, userId));
  if (!user) return fail(401, AUTH_ERRORS.sessionEnded);
  const current = typeof input.current === "string" ? input.current : "";
  if (!(await checkPassword(current, user.passwordHash)).ok) return fail(400, AUTH_ERRORS.wrongCurrentPassword);
  const next = typeof input.next === "string" ? input.next : "";
  const problem = passwordProblem(next);
  if (problem) return fail(400, problem);
  const now = new Date();
  await db
    .update(schema.users)
    .set({ passwordHash: await hashPassword(next), passwordChangedAt: now, updatedAt: now })
    .where(eq(schema.users.id, userId));
  await deleteUserSessions(db, userId, sessionId);
  return { ok: true };
}

/**
 * Uye kendi hesabini siler (sifresiyle). Adresleri, oturumlari ve
 * favorileri silinir; siparis, teklif, servis, iade, garanti ve
 * yorumlardaki bag bosalir (VERITABANI.md › users).
 */
export async function deleteAccount(
  db: AuthDb,
  userId: string,
  input: { password?: unknown },
): Promise<{ ok: true } | AccountFailure> {
  const [user] = await db.select().from(schema.users).where(eq(schema.users.id, userId));
  if (!user) return fail(401, AUTH_ERRORS.sessionEnded);
  const password = typeof input.password === "string" ? input.password : "";
  if (!(await checkPassword(password, user.passwordHash)).ok) return fail(400, AUTH_ERRORS.wrongPassword);
  await db.delete(schema.users).where(eq(schema.users.id, userId));
  return { ok: true };
}
