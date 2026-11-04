import type { NextRequest } from "next/server";
import {
  AUTH_ERRORS,
  changePassword,
  deleteAccount,
  deleteSession,
  login,
  publicUser,
  readSession,
  register,
  requestPasswordReset,
  resetPassword,
  updateProfile,
} from "@zenweld/auth/server";
import { tr } from "@zenweld/i18n";
import { getSiteUrl } from "@/lib/seo";
import { database, usesDatabase } from "@/lib/server/db";
import { sendCustomerMail } from "@/lib/server/mail";
import {
  SESSION_COOKIES,
  clearSessionCookie,
  clientInfo,
  failure,
  json,
  notFound,
  sameOrigin,
  setSessionCookie,
} from "@/lib/server/session-cookie";

/**
 * SITE UYELIGI (Asama 4.2; IS-KURALLARI › 16, KARARLAR K-94)
 *
 * Yalnizca veritabani modunda acik; demo modunda uyelik tarayicidadir.
 *   GET  /api/uyelik/ben        giris yapmis uye (yoksa null)
 *   POST /api/uyelik/giris      {email, password}
 *   POST /api/uyelik/kayit      kayit formu
 *   POST /api/uyelik/cikis
 *   POST /api/uyelik/profil     profil alanlari
 *   POST /api/uyelik/sifre      {current, next}
 *   POST /api/uyelik/hesap-sil  {password}
 *   POST /api/uyelik/sifre-unuttum  {email}: hesap olsa da olmasa da ayni
 *                               yanit; varsa sifirlama baglantisi e-postayla
 *   POST /api/uyelik/sifre-sifirla  {token, password}
 *
 * Oturum cerezi ve istek denetimi: lib/server/session-cookie.ts. Kurallar:
 * packages/auth/src/server.
 */

export const runtime = "nodejs";

const SCOPE = "site";
type Context = { params: Promise<{ islem: string }> };

export async function GET(request: NextRequest, context: Context) {
  const { islem } = await context.params;
  if (!usesDatabase() || islem !== "ben") return notFound();
  const token = request.cookies.get(SESSION_COOKIES[SCOPE])?.value;
  const session = await readSession(database(), token, SCOPE);
  if (!session) {
    const response = json({ ok: true, user: null });
    return token ? clearSessionCookie(response, request, SCOPE) : response;
  }
  // Kayan oturum: cerezin suresi de oturumla birlikte uzar.
  return setSessionCookie(json({ ok: true, user: publicUser(session.user) }), request, SCOPE, {
    token: token!,
    expiresAt: session.expiresAt,
  });
}

export async function POST(request: NextRequest, context: Context) {
  const { islem } = await context.params;
  if (!usesDatabase()) return notFound();
  if (!sameOrigin(request)) return json({ ok: false, error: "baska-site" }, 403);
  const body = ((await request.json().catch(() => null)) ?? {}) as Record<string, unknown>;
  const db = database();
  const token = request.cookies.get(SESSION_COOKIES[SCOPE])?.value;

  if (islem === "giris" || islem === "kayit") {
    const result = await db.transaction((tx) =>
      islem === "giris" ? login(tx, body, SCOPE, clientInfo(request)) : register(tx, body, clientInfo(request)),
    );
    if (!result.ok) return failure(result);
    await deleteSession(db, token);
    return setSessionCookie(json({ ok: true, user: result.user }), request, SCOPE, result.session);
  }
  if (islem === "cikis") {
    await deleteSession(db, token);
    return clearSessionCookie(json({ ok: true }), request, SCOPE);
  }
  if (islem === "sifre-unuttum") {
    const reset = await db.transaction((tx) => requestPasswordReset(tx, body.email));
    if (reset) {
      // Baglanti sitenin tanimli adresiyle kurulur (istegin Host basligiyla degil).
      const link = `${getSiteUrl()}/sifre-sifirla?anahtar=${reset.token}`;
      const mail = await sendCustomerMail({
        to: reset.email,
        subject: tr.auth.reset.mailSubject,
        text: tr.auth.reset.mailBody.replace("{name}", reset.firstName).replace("{link}", link),
      });
      if (!mail.delivered) console.warn(`Şifre sıfırlama e-postası gönderilemedi (${mail.reason}).`);
    }
    return json({ ok: true });
  }
  if (islem === "sifre-sifirla") {
    const result = await db.transaction((tx) => resetPassword(tx, { token: body.token, password: body.password }));
    return result.ok ? clearSessionCookie(json({ ok: true }), request, SCOPE) : failure(result);
  }

  const session = await readSession(db, token, SCOPE);
  if (!session) return clearSessionCookie(json({ ok: false, error: AUTH_ERRORS.sessionEnded }, 401), request, SCOPE);
  const userId = session.user.id;
  switch (islem) {
    case "profil": {
      const result = await updateProfile(db, userId, body);
      return result.ok ? json({ ok: true, user: result.user }) : failure(result);
    }
    case "sifre": {
      const result = await changePassword(db, userId, session.sessionId, body);
      return result.ok ? json({ ok: true }) : failure(result);
    }
    case "hesap-sil": {
      const result = await deleteAccount(db, userId, body);
      return result.ok ? clearSessionCookie(json({ ok: true }), request, SCOPE) : failure(result);
    }
    default:
      return notFound();
  }
}
