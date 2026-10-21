import { NextResponse } from "next/server";
import { botResult, isBot, readFields, readJsonObject, sendMail } from "@/lib/server/mail";

/**
 * URUN DESTEK TALEBI — E-POSTA GONDERIMI
 *
 * Urun sayfasindaki destek sohbetinden gelen soruyu Zenweld'e iletir.
 * Kurulum ve demo davranisi: lib/server/mail.ts. E-posta gonderilemezse
 * arayuz ziyaretciye dogrudan yazabilecegi adresi gosterir.
 */

export const runtime = "nodejs";

const KEYS = ["productName", "productSku", "productUrl", "message", "name", "email", "phone", "isMember"];

export async function POST(request: Request) {
  const body = await readJsonObject(request);
  if (body && isBot(body)) return NextResponse.json(botResult());
  const values = body && readFields(body, KEYS);
  if (!values) return NextResponse.json({ ok: false, error: "gecersiz-istek" }, { status: 400 });

  if (!values.message) {
    return NextResponse.json({ ok: false, error: "mesaj-bos" }, { status: 400 });
  }
  // Ulasilabilecek bir kanal olmadan talebi almak anlamsiz.
  if (!values.email && !values.phone) {
    return NextResponse.json({ ok: false, error: "iletisim-yok" }, { status: 400 });
  }

  const result = await sendMail({
    subject: `Ürün destek talebi — ${values.productName || "Ürün"} (${values.productSku || "-"})`,
    title: "Ürün destek talebi",
    rows: [
      ["Ürün", values.productName],
      ["Ürün kodu", values.productSku],
      ["Ürün sayfası", values.productUrl],
      ["Ad Soyad", values.name],
      ["E-posta", values.email],
      ["Telefon", values.phone],
      ["Üye mi", values.isMember === "true" ? "Evet" : "Hayır"],
    ],
    note: ["Soru", values.message],
    replyTo: values.email,
  });
  return NextResponse.json(result);
}
