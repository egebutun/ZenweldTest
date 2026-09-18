import { NextResponse, type NextRequest } from "next/server";
import { internalizePath } from "@zenweld/i18n";

/**
 * INGILIZCE ADRESLERI IC ROTALARA BAGLAR
 *
 * Ziyaretci  /en/products/arc-200  adresini gorur,
 * uygulama   /en/urun/arc-200      rotasini calistirir.
 *
 * Adres cubugunda Ingilizce adres kalir (rewrite, redirect degil).
 * Turkce adresler dokunulmadan gecer.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/en/") && pathname !== "/en") {
    return NextResponse.next();
  }

  const rest = pathname.slice("/en".length) || "/";
  const internal = internalizePath(rest);

  if (internal === rest) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = `/en${internal}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/en/:path*"],
};
