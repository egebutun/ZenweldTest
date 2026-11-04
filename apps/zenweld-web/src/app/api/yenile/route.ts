import { NextResponse } from "next/server";
import { refreshSite } from "@/lib/server/refresh";
import { parseRefreshRequest } from "@/lib/server/refresh-request";

/**
 * SITEYI YENILEME UCU (Asama 3.6)
 *
 * Veritabaninda yapilan degisiklikten sonra siteyi beklemeden yeniler:
 *   npm run site:yenile                 (butun turler)
 *   npm run site:yenile -- katalog      (yalnizca katalog)
 * Yalnizca sunucudaki gizli anahtarla (REVALIDATE_SECRET) calisir;
 * anahtar tanimli degilse uc kapalidir. Kurallar:
 * lib/server/refresh-request.ts.
 */

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => undefined);
  const parsed = parseRefreshRequest({
    secret: process.env.REVALIDATE_SECRET,
    authorization: request.headers.get("authorization"),
    body,
  });
  if (!parsed.ok) return NextResponse.json({ ok: false, error: parsed.error }, { status: parsed.status });
  return NextResponse.json({ ok: true, yenilenen: refreshSite(parsed.kinds) });
}
