import { NextResponse } from "next/server";

/**
 * URUN DESTEK TALEBI — E-POSTA GONDERIMI
 *
 * Urun sayfasindaki destek sohbetinden gelen soruyu Zenweld'e iletir.
 *
 * KURULUM (yayina alirken bir kez yapilir):
 *   Vercel > Project > Settings > Environment Variables
 *     RESEND_API_KEY   resend.com uzerinden alinan anahtar
 *     SUPPORT_EMAIL    (istege bagli) varsayilan info@zenweld.com
 *     SUPPORT_FROM     (istege bagli) dogrulanmis gonderici adresi
 *
 * Anahtar tanimli degilse istek hata vermez; "delivered: false" doner ve
 * arayuz ziyaretciye e-posta ile de ulasabilecegi adresi gosterir.
 * Boylece demo ortaminda sayfa calismaya devam eder.
 */

export const runtime = "nodejs";

interface SupportRequest {
  productName?: string;
  productSku?: string;
  productUrl?: string;
  message?: string;
  name?: string;
  email?: string;
  phone?: string;
  isMember?: boolean;
}

const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || "info@zenweld.com";

/** HTML'e gomulecek kullanici metnini zararsiz hale getirir. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function POST(request: Request) {
  let body: SupportRequest;
  try {
    body = (await request.json()) as SupportRequest;
  } catch {
    return NextResponse.json({ ok: false, error: "gecersiz-istek" }, { status: 400 });
  }

  const message = (body.message ?? "").trim();
  if (!message) {
    return NextResponse.json({ ok: false, error: "mesaj-bos" }, { status: 400 });
  }

  // Ulasilabilecek bir kanal olmadan talebi almak anlamsiz.
  const email = (body.email ?? "").trim();
  const phone = (body.phone ?? "").trim();
  if (!email && !phone) {
    return NextResponse.json({ ok: false, error: "iletisim-yok" }, { status: 400 });
  }

  const rows: [string, string][] = [
    ["Ürün", body.productName ?? "—"],
    ["Ürün kodu", body.productSku ?? "—"],
    ["Ürün sayfası", body.productUrl ?? "—"],
    ["Ad Soyad", body.name || "—"],
    ["E-posta", email || "—"],
    ["Telefon", phone || "—"],
    ["Üye mi", body.isMember ? "Evet" : "Hayır"],
  ];

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    // Demo ortami: e-posta servisi tanimli degil.
    return NextResponse.json({ ok: true, delivered: false, reason: "eposta-yapilandirilmadi" });
  }

  const html = `
    <h2>Ürün destek talebi</h2>
    <table cellpadding="6" style="border-collapse:collapse">
      ${rows
        .map(
          ([k, v]) =>
            `<tr><td style="border:1px solid #e2e5e8"><b>${escapeHtml(k)}</b></td>` +
            `<td style="border:1px solid #e2e5e8">${escapeHtml(v)}</td></tr>`,
        )
        .join("")}
    </table>
    <h3>Soru</h3>
    <p style="white-space:pre-wrap">${escapeHtml(message)}</p>
  `;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.SUPPORT_FROM || "Zenweld Web <onboarding@resend.dev>",
        to: [SUPPORT_EMAIL],
        // Yanit dogrudan soruyu sorana gitsin.
        reply_to: email || undefined,
        subject: `Ürün destek talebi — ${body.productName ?? "Ürün"} (${body.productSku ?? "-"})`,
        html,
      }),
    });

    if (!res.ok) {
      return NextResponse.json({ ok: true, delivered: false, reason: "servis-hatasi" });
    }
    return NextResponse.json({ ok: true, delivered: true });
  } catch {
    return NextResponse.json({ ok: true, delivered: false, reason: "baglanti-hatasi" });
  }
}
