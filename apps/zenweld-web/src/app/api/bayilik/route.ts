import { NextResponse, type NextRequest } from "next/server";
import { saveDealerApplication } from "@zenweld/db";
import { database, usesDatabase } from "@/lib/server/db";
import { botResult, isBot, readFields, readJsonObject, recordBot, sendMail, sourcePath } from "@/lib/server/mail";
import { siteMember } from "@/lib/server/member";

/**
 * BAYILIK BASVURUSU — E-POSTA GONDERIMI
 *
 * Basvuru formunu Zenweld'e iletir. Kurulum ve demo davranisi:
 * lib/server/mail.ts. Veritabani modunda basvuru dealer_applications'a da
 * yazilir (KARARLAR K-81; Asama 5.3); e-posta gitmese de basvuru ulasmis
 * sayilir.
 */

export const runtime = "nodejs";

const FIELDS: [string, string][] = [
  ["company", "Firma unvanı"],
  ["taxOffice", "Vergi dairesi / no"],
  ["city", "Şehir"],
  ["sector", "Faaliyet alanı"],
  ["years", "Sektördeki yıl"],
  ["brands", "Çalıştığı markalar"],
  ["hasShowroom", "Showroom var mı"],
  ["hasService", "Servis kabiliyeti"],
  ["contactName", "Yetkili kişi"],
  ["email", "E-posta"],
  ["phone", "Telefon"],
  ["message", "Not"],
];

export async function POST(request: NextRequest) {
  const body = await readJsonObject(request);
  const page = sourcePath(request);
  if (body && isBot(body)) {
    await recordBot({ type: "bayilik", sourcePath: page });
    return NextResponse.json(botResult());
  }
  const values = body && readFields(body, FIELDS.map(([key]) => key));
  if (!values) return NextResponse.json({ ok: false, error: "gecersiz-istek" }, { status: 400 });
  if (!values.company || !values.email) {
    return NextResponse.json({ ok: false, error: "eksik-alan" }, { status: 400 });
  }

  const id = usesDatabase()
    ? await saveDealerApplication(database(), await siteMember(request), values, new Date())
    : undefined;
  const result = await sendMail({
    subject: `Bayilik başvurusu — ${values.company}`,
    title: "Bayilik başvurusu",
    rows: FIELDS.map(([key, label]) => [label, values[key]]),
    replyTo: values.email,
    log: { type: "bayilik", sourcePath: page, entity: id ? { type: "dealer_applications", id } : undefined },
  });
  return NextResponse.json(id ? { ...result, saved: true } : result);
}
