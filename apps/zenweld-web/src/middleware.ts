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
 *
 * Eski urun grubu sayfalari (/ekipmanlar?grup=lazer-makineleri) kaldirildi;
 * "?grup=" iceren her adres 404 doner.
 */
export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  if (searchParams.has("grup")) {
    const url = request.nextUrl.clone();
    url.pathname = `/${pathname.startsWith("/en") ? "en" : "tr"}/__sayfa-yok`;
    url.search = "";
    return NextResponse.rewrite(url);
  }

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
  matcher: ["/en/:path*", "/tr/:path*"],
};
