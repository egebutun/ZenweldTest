import { NextResponse, type NextRequest } from "next/server";

/**
 * ISTEK ONCESI KONTROL (Next 16'da "proxy"; eski adi middleware)
 *
 * Eski urun grubu sayfalari (/ekipmanlar?grup=lazer-makineleri) kaldirildi;
 * "?grup=" iceren her adres 404 doner.
 */
export function proxy(request: NextRequest) {
  if (!request.nextUrl.searchParams.has("grup")) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = "/__sayfa-yok";
  url.search = "";
  return NextResponse.rewrite(url);
}

export const config = {
  // Yonetim paneli, API ve statik dosyalar haric
  matcher: ["/((?!_next|api|yonetim|images|.*\\..*).*)"],
};
