import { NextResponse } from "next/server";
import { botResult, isBot, readJsonObject } from "@/lib/server/mail";
import { isNotificationType, sendNotification } from "@/lib/server/notify";

/**
 * FORM BILDIRIMLERI — info@zenweld.com
 *
 * Sitedeki formlar gonderilince Zenweld'e e-posta gider (bayilik basvurusu
 * ve urun destek sorusu kendi uclarindan: /api/bayilik, /api/destek).
 * Kayit tutan formlarin (teklif, servis, garanti, yorum, uyelik, siparis, iade)
 * kaydi ayrica yonetim panelindedir; e-posta haber vermek icindir.
 * Veritabani modunda siparis ve iade bildirimi kaydi yapan sunucudan gider
 * (/api/siparis). Sablonlar: lib/server/notify.ts.
 */

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await readJsonObject(request);
  if (body && isBot(body)) return NextResponse.json(botResult());
  const data = body?.data;
  if (!body || !isNotificationType(body.type) || !data || typeof data !== "object" || Array.isArray(data)) {
    return NextResponse.json({ ok: false, error: "gecersiz-istek" }, { status: 400 });
  }
  const result = await sendNotification(body.type, data as Record<string, unknown>);
  if (!result) return NextResponse.json({ ok: false, error: "gecersiz-alan" }, { status: 400 });
  return NextResponse.json(result);
}
