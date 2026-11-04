import type { NextRequest } from "next/server";
import { deleteSession, login, publicUser, readSession } from "@zenweld/auth/server";
import { database, usesDatabase } from "@/lib/server/db";
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
 * PANEL OTURUMU (Asama 4.3; IS-KURALLARI › 16, KARARLAR K-94)
 *
 * Yalnizca veritabani modunda acik; demo modunda panel girisi tarayicidadir.
 *   GET  /api/yonetim/oturum/ben     giris yapmis yonetici (yoksa null)
 *   POST /api/yonetim/oturum/giris   {email, password}
 *   POST /api/yonetim/oturum/cikis
 *
 * Yalnizca yonetici girer; oturum girisinden 8 saat sonra biter, uzamaz.
 * Cerez sitenin uyelik cerezinden ayridir (zw_panel).
 */

export const runtime = "nodejs";

const SCOPE = "admin";
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
  return json({ ok: true, user: publicUser(session.user) });
}

export async function POST(request: NextRequest, context: Context) {
  const { islem } = await context.params;
  if (!usesDatabase()) return notFound();
  if (!sameOrigin(request)) return json({ ok: false, error: "baska-site" }, 403);
  const db = database();
  const token = request.cookies.get(SESSION_COOKIES[SCOPE])?.value;

  if (islem === "giris") {
    const body = ((await request.json().catch(() => null)) ?? {}) as Record<string, unknown>;
    const result = await db.transaction((tx) => login(tx, body, SCOPE, clientInfo(request)));
    if (!result.ok) return failure(result);
    await deleteSession(db, token);
    return setSessionCookie(json({ ok: true, user: result.user }), request, SCOPE, result.session);
  }
  if (islem === "cikis") {
    await deleteSession(db, token);
    return clearSessionCookie(json({ ok: true }), request, SCOPE);
  }
  return notFound();
}
