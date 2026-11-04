import { isIP } from "node:net";
import { NextResponse, type NextRequest } from "next/server";
import {
  AUTH_ERRORS,
  changePassword,
  deleteAccount,
  deleteSession,
  login,
  publicUser,
  readSession,
  register,
  updateProfile,
  type AccountFailure,
  type ClientInfo,
  type NewSession,
} from "@zenweld/auth/server";
import { database, usesDatabase } from "@/lib/server/db";

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
 *
 * Oturum anahtari yalnizca sunucunun okuyabildigi cerezdedir (httpOnly,
 * SameSite=Lax; gercek alan adinda Secure). Baska siteden gelen istek
 * (Origin farkli) reddedilir. Kurallar: packages/auth/src/server.
 */

export const runtime = "nodejs";

const COOKIE = "zw_oturum";
type Context = { params: Promise<{ islem: string }> };

const json = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: { "cache-control": "no-store" } });
const failure = (result: AccountFailure) => json({ ok: false, error: result.error }, result.status);
const notFound = () => json({ ok: false, error: "bulunamadi" }, 404);

/** Bilgisayardaki adres (http) disinda cerez yalnizca HTTPS ile gider. */
function cookieOptions(request: NextRequest) {
  const host = request.nextUrl.hostname;
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: !["localhost", "127.0.0.1", "[::1]"].includes(host),
    path: "/",
  };
}

function setSessionCookie(response: NextResponse, request: NextRequest, session: Pick<NewSession, "token" | "expiresAt">) {
  response.cookies.set(COOKIE, session.token, { ...cookieOptions(request), expires: session.expiresAt });
  return response;
}

function clearSessionCookie(response: NextResponse, request: NextRequest) {
  response.cookies.set(COOKIE, "", { ...cookieOptions(request), maxAge: 0 });
  return response;
}

/** Ziyaretcinin adresi (sunucunun onundeki web sunucusu iletir) ve tarayicisi. */
function clientInfo(request: NextRequest): ClientInfo {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? "";
  return { ip: isIP(forwarded) ? forwarded : undefined, userAgent: request.headers.get("user-agent") ?? undefined };
}

/** Tarayici istegi baska bir siteden geliyorsa reddedilir. */
function sameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === request.headers.get("host");
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest, context: Context) {
  const { islem } = await context.params;
  if (!usesDatabase() || islem !== "ben") return notFound();
  const token = request.cookies.get(COOKIE)?.value;
  const session = await readSession(database(), token, "site");
  if (!session) {
    const response = json({ ok: true, user: null });
    return token ? clearSessionCookie(response, request) : response;
  }
  // Kayan oturum: cerezin suresi de oturumla birlikte uzar.
  return setSessionCookie(json({ ok: true, user: publicUser(session.user) }), request, {
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
  const token = request.cookies.get(COOKIE)?.value;

  if (islem === "giris" || islem === "kayit") {
    const result = await db.transaction((tx) =>
      islem === "giris" ? login(tx, body, "site", clientInfo(request)) : register(tx, body, clientInfo(request)),
    );
    if (!result.ok) return failure(result);
    await deleteSession(db, token);
    return setSessionCookie(json({ ok: true, user: result.user }), request, result.session);
  }
  if (islem === "cikis") {
    await deleteSession(db, token);
    return clearSessionCookie(json({ ok: true }), request);
  }

  const session = await readSession(db, token, "site");
  if (!session) return clearSessionCookie(json({ ok: false, error: AUTH_ERRORS.sessionEnded }, 401), request);
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
      return result.ok ? clearSessionCookie(json({ ok: true }), request) : failure(result);
    }
    default:
      return notFound();
  }
}
