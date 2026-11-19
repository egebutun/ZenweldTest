import { NextResponse, type NextRequest } from "next/server";
import { movedPathFor } from "@/lib/server/moved";

/**
 * ISTEK ONCESI KONTROL (Next 16'da "proxy"; eski adi middleware)
 *
 * - Eski urun grubu sayfalari (/ekipmanlar?grup=lazer-makineleri) kaldirildi;
 *   "?grup=" iceren her adres 404 doner.
 * - Panelde linki degisen kaydin eski adresi 301 (kalici) ile bugunku
 *   adresine gider (veritabani modu; lib/server/moved.ts, KARARLAR K-120).
 *   Eski adresteki diger parametreler (orn. kampanya etiketi) korunur.
 */
export async function proxy(request: NextRequest) {
  const url = request.nextUrl.clone();

  if (url.searchParams.has("grup")) {
    url.pathname = "/__sayfa-yok";
    url.search = "";
    return NextResponse.rewrite(url);
  }

  if (request.method === "GET" || request.method === "HEAD") {
    const moved = await movedPathFor(url.pathname);
    if (moved) {
      const target = new URL(moved, url);
      for (const [key, value] of url.searchParams) if (!target.searchParams.has(key)) target.searchParams.append(key, value);
      return NextResponse.redirect(target, 301);
    }
  }

  return NextResponse.next();
}

export const config = {
  // Yonetim paneli, API ve statik dosyalar haric
  matcher: ["/((?!_next|api|yonetim|images|.*\\..*).*)"],
};
