import { NextResponse } from "next/server";
import { readFields, readJsonObject, sendMail } from "@/lib/server/mail";

/**
 * FORM BILDIRIMLERI — info@zenweld.com
 *
 * Sitedeki formlar gonderilince Zenweld'e e-posta gider (bayilik basvurusu
 * ve urun destek sorusu kendi uclarindan: /api/bayilik, /api/destek).
 * Kayit tutan formlarin (teklif, servis, garanti, yorum, uyelik, siparis)
 * kaydi ayrica yonetim panelindedir; e-posta haber vermek icindir.
 *
 * Yalnizca asagidaki form turleri ve alanlari kabul edilir; konu satiri ve
 * alan adlari sunucuda belirlenir.
 */

export const runtime = "nodejs";

interface Template {
  title: string;
  subject: (d: Record<string, string>) => string;
  fields: [string, string][];
  /** Tablonun altinda uzun metin olarak gosterilen alan */
  note?: [string, string];
  /** Yanitin gidecegi e-posta alani */
  replyTo?: string;
}

const TEMPLATES: Record<string, Template> = {
  iletisim: {
    title: "İletişim formu",
    subject: (d) => `İletişim formu — ${d.subject || d.name}`,
    fields: [["name", "Ad Soyad"], ["email", "E-posta"], ["phone", "Telefon"], ["subject", "Konu"]],
    note: ["message", "Mesaj"],
    replyTo: "email",
  },
  teklif: {
    title: "Yeni teklif talebi",
    subject: (d) => `Yeni teklif talebi — ${d.code} — ${d.companyName || d.contactName}`,
    fields: [
      ["code", "Teklif no"],
      ["companyName", "Firma"],
      ["contactName", "Yetkili"],
      ["email", "E-posta"],
      ["phone", "Telefon"],
      ["taxNumber", "Vergi no"],
      ["city", "Şehir"],
      ["items", "Ürünler"],
      ["payment", "Ödeme tercihi"],
    ],
    note: ["message", "Not"],
    replyTo: "email",
  },
  servis: {
    title: "Yeni servis talebi",
    subject: (d) => `Yeni servis talebi — ${d.code} — ${d.productName}`,
    fields: [
      ["code", "Talep no"],
      ["productName", "Makine"],
      ["reasons", "Talep konusu"],
      ["companyName", "Firma / Ad Soyad"],
      ["contactName", "Yetkili"],
      ["email", "E-posta"],
      ["phone", "Telefon"],
      ["contactGsm", "Yetkili GSM"],
      ["address", "Adres"],
      ["district", "İlçe"],
      ["city", "Şehir"],
    ],
    note: ["complaint", "Şikayet / açıklama"],
    replyTo: "email",
  },
  garanti: {
    title: "Yeni garanti kaydı",
    subject: (d) => `Yeni garanti kaydı — ${d.productName} (${d.serialNumber})`,
    fields: [
      ["productName", "Model"],
      ["serialNumber", "Seri no"],
      ["ownerName", "Ad Soyad"],
      ["email", "E-posta"],
      ["phone", "Telefon"],
      ["city", "Şehir"],
      ["postalCode", "Posta kodu"],
      ["address", "Adres"],
      ["sellerTaxNumber", "Satıcı VKN"],
      ["extended", "12 ay uzatma istiyor"],
    ],
    replyTo: "email",
  },
  yorum: {
    title: "Yeni ürün yorumu (onay bekliyor)",
    subject: (d) => `Yeni ürün yorumu — ${d.productName}`,
    fields: [["productName", "Ürün"], ["authorName", "Yazan"], ["rating", "Puan (5 üzerinden)"], ["title", "Başlık"], ["media", "Fotoğraf / video"]],
    note: ["body", "Yorum"],
  },
  uye: {
    title: "Yeni üye",
    subject: (d) => `Yeni üye — ${d.name} (${d.type})`,
    fields: [
      ["name", "Ad Soyad"],
      ["email", "E-posta"],
      ["phone", "Telefon"],
      ["city", "Şehir"],
      ["type", "Üyelik"],
      ["companyName", "Firma"],
      ["newsletter", "Bülten izni"],
    ],
    replyTo: "email",
  },
  siparis: {
    title: "Yeni sipariş",
    subject: (d) => `Yeni sipariş — ${d.code} — ${d.total}`,
    fields: [
      ["code", "Sipariş no"],
      ["customer", "Müşteri"],
      ["email", "E-posta"],
      ["phone", "Telefon"],
      ["items", "Ürünler"],
      ["total", "Toplam"],
      ["payment", "Ödeme"],
      ["shipping", "Teslimat adresi"],
      ["invoice", "Fatura"],
    ],
    note: ["note", "Müşteri notu"],
    replyTo: "email",
  },
  "welders-club": {
    title: "Welders Club katılım",
    subject: (d) => `Welders Club katılım — ${d.name}`,
    fields: [["name", "Ad"], ["email", "E-posta"], ["city", "Şehir"]],
    replyTo: "email",
  },
};

export async function POST(request: Request) {
  const body = await readJsonObject(request);
  const template = body && typeof body.type === "string" ? TEMPLATES[body.type] : undefined;
  const data = body?.data;
  if (!template || !data || typeof data !== "object" || Array.isArray(data)) {
    return NextResponse.json({ ok: false, error: "gecersiz-istek" }, { status: 400 });
  }

  const keys = [...template.fields.map(([k]) => k), ...(template.note ? [template.note[0]] : [])];
  const values = readFields(data as Record<string, unknown>, keys);
  if (!values) return NextResponse.json({ ok: false, error: "gecersiz-alan" }, { status: 400 });

  const result = await sendMail({
    subject: template.subject(values),
    title: template.title,
    rows: template.fields.map(([key, label]) => [label, values[key]]),
    note: template.note && [template.note[1], values[template.note[0]]],
    replyTo: template.replyTo ? values[template.replyTo] : undefined,
  });
  return NextResponse.json(result);
}
