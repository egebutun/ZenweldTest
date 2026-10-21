import { NextResponse } from "next/server";
import { readFields, readJsonObject, sendMail } from "@/lib/server/mail";

/**
 * BAYILIK BASVURUSU — E-POSTA GONDERIMI
 *
 * Basvuru formunu Zenweld'e iletir. Kurulum ve demo davranisi:
 * lib/server/mail.ts.
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

export async function POST(request: Request) {
  const body = await readJsonObject(request);
  const values = body && readFields(body, FIELDS.map(([key]) => key));
  if (!values) return NextResponse.json({ ok: false, error: "gecersiz-istek" }, { status: 400 });
  if (!values.company || !values.email) {
    return NextResponse.json({ ok: false, error: "eksik-alan" }, { status: 400 });
  }

  const result = await sendMail({
    subject: `Bayilik başvurusu — ${values.company}`,
    title: "Bayilik başvurusu",
    rows: FIELDS.map(([key, label]) => [label, values[key]]),
    replyTo: values.email,
  });
  return NextResponse.json(result);
}
