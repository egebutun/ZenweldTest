import type { NextRequest } from "next/server";
import { deleteSession, login, publicUser, readSession } from "@zenweld/auth/server";
import { writeAudit } from "@zenweld/db";
import { actorName } from "@/lib/server/admin";
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
 * Cerez sitenin uyelik cerezinden ayridir (zw_panel). Basarili giris ve
 * cikis islem kaydina (audit_log) yazilir (KARARLAR K-99).
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
    const client = clientInfo(request);
    const result = await db.transaction(async (tx) => {
      const answer = await login(tx, body, SCOPE, client);
      if (answer.ok) {
        const { user } = answer;
        await writeAudit(
          tx,
          { id: user.id, name: actorName(user), ip: client.ip },
          { action: "login", entityType: "users", entityId: user.id, entityLabel: user.email },
          new Date(),
        );
      }
      return answer;
    });
    if (!result.ok) return failure(result);
    await deleteSession(db, token);
    return setSessionCookie(json({ ok: true, user: result.user }), request, SCOPE, result.session);
  }
  if (islem === "cikis") {
    await db.transaction(async (tx) => {
      const session = await readSession(tx, token, SCOPE);
      if (session) {
        const { user } = session;
        await writeAudit(
          tx,
          { id: user.id, name: actorName(user), ip: clientInfo(request).ip },
          { action: "logout", entityType: "users", entityId: user.id, entityLabel: user.email },
          new Date(),
        );
      }
      await deleteSession(tx, token);
    });
    return clearSessionCookie(json({ ok: true }), request, SCOPE);
  }
  return notFound();
}
