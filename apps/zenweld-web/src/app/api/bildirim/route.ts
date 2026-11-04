import { NextResponse, type NextRequest } from "next/server";
import { saveSupportMessage, saveWeldersClubSignup } from "@zenweld/db";
import { database, usesDatabase } from "@/lib/server/db";
import { botResult, isBot, isEmail, readFields, readJsonObject, recordBot, sourcePath } from "@/lib/server/mail";
import { siteMember } from "@/lib/server/member";
import { isNotificationType, sendNotification } from "@/lib/server/notify";

/**
 * FORM BILDIRIMLERI — info@zenweld.com
 *
 * Sitedeki formlar gonderilince Zenweld'e e-posta gider (bayilik basvurusu
 * ve urun destek sorusu kendi uclarindan: /api/bayilik, /api/destek).
 * Kayit tutan formlarin (teklif, servis, garanti, yorum, uyelik, siparis, iade)
 * kaydi ayrica yonetim panelindedir; e-posta haber vermek icindir.
 * Veritabani modunda siparis, iade, teklif, servis, garanti ve yorum
 * bildirimini kaydi yapan sunucu gonderir (/api/siparis, /api/formlar);
 * iletisim formu ve Welders Club katilimi burada kendi tablolarina da
 * yazilir (KARARLAR K-81; Asama 5.3). Sablonlar: lib/server/notify.ts.
 */

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = await readJsonObject(request);
  const page = sourcePath(request);
  if (body && isBot(body)) {
    if (isNotificationType(body.type)) await recordBot({ type: body.type, sourcePath: page });
    return NextResponse.json(botResult());
  }
  const data = body?.data;
  if (!body || !isNotificationType(body.type) || !data || typeof data !== "object" || Array.isArray(data)) {
    return NextResponse.json({ ok: false, error: "gecersiz-istek" }, { status: 400 });
  }
  const type = body.type;
  const fields = data as Record<string, unknown>;

  // Veritabani modu: iletisim mesaji ve Welders Club katilimi once kaydedilir.
  let entity: { type: string; id: string } | undefined;
  if (usesDatabase() && (type === "iletisim" || type === "welders-club")) {
    const v = readFields(fields, ["name", "email", "subject", "message", "city"]);
    if (!v || !v.name || !isEmail(v.email) || (type === "iletisim" && !v.message)) {
      return NextResponse.json({ ok: false, error: "eksik-alan" }, { status: 400 });
    }
    const member = await siteMember(request);
    const at = new Date();
    entity =
      type === "iletisim"
        ? {
            type: "support_messages",
            id: await saveSupportMessage(
              database(),
              member,
              { type: "iletisim", name: v.name, email: v.email, subject: v.subject, message: v.message, pageUrl: page },
              at,
            ),
          }
        : {
            type: "welders_club_signups",
            id: await saveWeldersClubSignup(database(), member, { name: v.name, email: v.email, city: v.city }, at),
          };
  }

  const result = await sendNotification(type, fields, { sourcePath: page, entity });
  if (!result) return NextResponse.json({ ok: false, error: "gecersiz-alan" }, { status: 400 });
  // Kaydedildiyse e-posta gitmese de form ulasmis sayilir (lib/notify.ts › reached).
  return NextResponse.json(entity ? { ...result, saved: true } : result);
}
