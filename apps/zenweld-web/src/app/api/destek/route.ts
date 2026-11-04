import { NextResponse, type NextRequest } from "next/server";
import { saveSupportMessage } from "@zenweld/db";
import { database, usesDatabase } from "@/lib/server/db";
import { botResult, isBot, readFields, readJsonObject, recordBot, sendMail, sourcePath } from "@/lib/server/mail";
import { siteMember } from "@/lib/server/member";

/**
 * URUN DESTEK TALEBI — E-POSTA GONDERIMI
 *
 * Urun sayfasindaki destek sohbetinden gelen soruyu Zenweld'e iletir.
 * Kurulum ve demo davranisi: lib/server/mail.ts. E-posta gonderilemezse
 * arayuz ziyaretciye dogrudan yazabilecegi adresi gosterir. Veritabani
 * modunda soru support_messages'a da yazilir (KARARLAR K-81; Asama 5.3).
 */

export const runtime = "nodejs";

const KEYS = ["productName", "productSku", "productUrl", "message", "name", "email", "phone", "isMember"];

export async function POST(request: NextRequest) {
  const body = await readJsonObject(request);
  const page = sourcePath(request);
  if (body && isBot(body)) {
    await recordBot({ type: "urun-destek", sourcePath: page });
    return NextResponse.json(botResult());
  }
  const values = body && readFields(body, KEYS);
  if (!values) return NextResponse.json({ ok: false, error: "gecersiz-istek" }, { status: 400 });

  if (!values.message) {
    return NextResponse.json({ ok: false, error: "mesaj-bos" }, { status: 400 });
  }
  // Ulasilabilecek bir kanal olmadan talebi almak anlamsiz.
  if (!values.email && !values.phone) {
    return NextResponse.json({ ok: false, error: "iletisim-yok" }, { status: 400 });
  }

  const id = usesDatabase()
    ? await saveSupportMessage(
        database(),
        await siteMember(request),
        {
          type: "urun-destek",
          name: values.name,
          email: values.email,
          phone: values.phone,
          message: values.message,
          productSku: values.productSku,
          productName: values.productName,
          pageUrl: values.productUrl,
        },
        new Date(),
      )
    : undefined;
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
    log: { type: "urun-destek", sourcePath: page, entity: id ? { type: "support_messages", id } : undefined },
  });
  return NextResponse.json(id ? { ...result, saved: true } : result);
}
