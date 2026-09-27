import { NextResponse } from "next/server";

/**
 * BAYILIK BASVURUSU — E-POSTA GONDERIMI
 *
 * Basvuru formunu Zenweld'e iletir. Kurulum ve davranis /api/destek ile
 * ayni: RESEND_API_KEY tanimli degilse istek hata vermez, "delivered:
 * false" doner ve demo calismaya devam eder.
 */

export const runtime = "nodejs";

const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || "info@zenweld.com";

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

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function POST(request: Request) {
  let body: Record<string, string>;
  try {
    body = (await request.json()) as Record<string, string>;
  } catch {
    return NextResponse.json({ ok: false, error: "gecersiz-istek" }, { status: 400 });
  }

  const company = (body.company ?? "").trim();
  const email = (body.email ?? "").trim();
  if (!company || !email) {
    return NextResponse.json({ ok: false, error: "eksik-alan" }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ ok: true, delivered: false, reason: "eposta-yapilandirilmadi" });
  }

  const html = `
    <h2>Bayilik başvurusu</h2>
    <table cellpadding="6" style="border-collapse:collapse">
      ${FIELDS.map(
        ([key, label]) =>
          `<tr><td style="border:1px solid #e2e5e8"><b>${escapeHtml(label)}</b></td>` +
          `<td style="border:1px solid #e2e5e8">${escapeHtml((body[key] ?? "").trim() || "—")}</td></tr>`,
      ).join("")}
    </table>
  `;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.SUPPORT_FROM || "Zenweld Web <onboarding@resend.dev>",
        to: [SUPPORT_EMAIL],
        reply_to: email,
        subject: `Bayilik başvurusu — ${company}`,
        html,
      }),
    });
    return NextResponse.json({ ok: true, delivered: res.ok });
  } catch {
    return NextResponse.json({ ok: true, delivered: false, reason: "baglanti-hatasi" });
  }
}
