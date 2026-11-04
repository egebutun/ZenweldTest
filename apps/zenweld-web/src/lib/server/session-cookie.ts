import { isIP } from "node:net";
import { NextResponse, type NextRequest } from "next/server";
import type { AccountFailure, ClientInfo, NewSession, SessionScope } from "@zenweld/auth/server";

/**
 * OTURUM CEREZI VE ISTEK DENETIMI (site uyeligi /api/uyelik ve panel
 * /api/yonetim/oturum; KARARLAR K-94)
 *
 * - Site ve panel oturumu ayri cerezlerdedir; ikisi de yalnizca sunucunun
 *   okuyabildigi cerezdir (httpOnly, SameSite=Lax; gercek alan adinda
 *   Secure). Cerezin suresi oturumun bitis anidir.
 * - Baska siteden gelen istek (Origin farkli) reddedilir.
 */

export const SESSION_COOKIES: Record<SessionScope, string> = { site: "zw_oturum", admin: "zw_panel" };

export const json = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: { "cache-control": "no-store" } });
export const failure = (result: AccountFailure) => json({ ok: false, error: result.error }, result.status);
export const notFound = () => json({ ok: false, error: "bulunamadi" }, 404);

/** Bilgisayardaki adres (http) disinda cerez yalnizca HTTPS ile gider. */
function cookieOptions(request: NextRequest) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: !["localhost", "127.0.0.1", "[::1]"].includes(request.nextUrl.hostname),
    path: "/",
  };
}

export function setSessionCookie(
  response: NextResponse,
  request: NextRequest,
  scope: SessionScope,
  session: Pick<NewSession, "token" | "expiresAt">,
) {
  response.cookies.set(SESSION_COOKIES[scope], session.token, { ...cookieOptions(request), expires: session.expiresAt });
  return response;
}

export function clearSessionCookie(response: NextResponse, request: NextRequest, scope: SessionScope) {
  response.cookies.set(SESSION_COOKIES[scope], "", { ...cookieOptions(request), maxAge: 0 });
  return response;
}

/** Ziyaretcinin adresi (sunucunun onundeki web sunucusu iletir) ve tarayicisi. */
export function clientInfo(request: NextRequest): ClientInfo {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? "";
  return { ip: isIP(forwarded) ? forwarded : undefined, userAgent: request.headers.get("user-agent") ?? undefined };
}

/** Tarayici istegi baska bir siteden geliyorsa reddedilir. */
export function sameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === request.headers.get("host");
  } catch {
    return false;
  }
}
