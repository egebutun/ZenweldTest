import { escapeHtml } from "@zenweld/utils";
import { isNoIndex } from "@/lib/seo";

/**
 * E-POSTA GONDERIMI (yalnizca sunucu: /api uclari)
 *
 * Sitedeki formlar Zenweld'e Resend uzerinden e-posta gonderir.
 *
 * KURULUM (yayina alirken bir kez yapilir):
 *   Vercel > Project > Settings > Environment Variables
 *     RESEND_API_KEY   resend.com uzerinden alinan anahtar
 *     SUPPORT_EMAIL    (istege bagli) alici, varsayilan info@zenweld.com
 *     SUPPORT_FROM     (istege bagli) dogrulanmis gonderici adresi
 *
 * Anahtar yoksa e-posta gonderilmez ve istek hata vermez. Demo adresinde
 * (zenweld.com disi) form basarili sayilir; canlida e-posta gitmezse
 * ziyaretciye hata gosterilir (demo: false).
 */

export const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || "info@zenweld.com";

/** Tek bir alanin en fazla uzunlugu (karakter). */
const MAX_FIELD = 5000;

export interface MailResult {
  ok: true;
  /** E-posta gercekten gonderildi mi */
  delivered: boolean;
  /** Demo adresi: e-posta servisi olmasa da form basarili sayilir */
  demo: boolean;
  reason?: "eposta-yapilandirilmadi" | "servis-hatasi" | "baglanti-hatasi";
}

/**
 * Formdan gelen degeri metne cevirir: metin, sayi, evet/hayir ve metin
 * listesi kabul edilir; baska bir sey gelirse null (gecersiz istek).
 */
export function fieldText(value: unknown): string | null {
  if (value === undefined || value === null) return "";
  if (typeof value === "string") return value.trim().slice(0, MAX_FIELD);
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value) && value.every((v) => typeof v === "string")) {
    return value.join("\n").slice(0, MAX_FIELD);
  }
  return null;
}

/** Istek govdesi nesne degilse null. */
export async function readJsonObject(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const body: unknown = await request.json();
    return body && typeof body === "object" && !Array.isArray(body) ? (body as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** Verilen alanlari metne cevirir; biri gecersizse null. */
export function readFields(body: Record<string, unknown>, keys: string[]): Record<string, string> | null {
  const out: Record<string, string> = {};
  for (const key of keys) {
    const text = fieldText(body[key]);
    if (text === null) return null;
    out[key] = text;
  }
  return out;
}

/**
 * Bot tuzagi: formlardaki gorunmez "website" alani (components/common/BotTrap)
 * ziyaretciye gorunmez; doluysa gonderen formu otomatik dolduran bir bottur.
 * Bota basarili gibi yanit verilir (botResult), e-posta gonderilmez.
 */
export const isBot = (body: Record<string, unknown>) =>
  typeof body.website === "string" && body.website.trim() !== "";

export const botResult = (): MailResult => ({ ok: true, delivered: true, demo: isNoIndex() });

export const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

/** Zenweld'e e-posta: baslik, alan tablosu ve istege bagli uzun metin. */
export async function sendMail({
  subject,
  title,
  rows,
  note,
  replyTo,
}: {
  subject: string;
  title: string;
  rows: [string, string][];
  /** Tablonun altindaki uzun metin (mesaj, not ...) */
  note?: [string, string];
  /** Yanit dogrudan formu doldurana gitsin */
  replyTo?: string;
}): Promise<MailResult> {
  const demo = isNoIndex();
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { ok: true, delivered: false, demo, reason: "eposta-yapilandirilmadi" };

  const cell = "border:1px solid #e2e5e8;vertical-align:top";
  const html = `
    <h2>${escapeHtml(title)}</h2>
    <table cellpadding="6" style="border-collapse:collapse">
      ${rows
        .map(
          ([label, value]) =>
            `<tr><td style="${cell}"><b>${escapeHtml(label)}</b></td>` +
            `<td style="${cell};white-space:pre-wrap">${escapeHtml(value || "—")}</td></tr>`,
        )
        .join("")}
    </table>
    ${note && note[1] ? `<h3>${escapeHtml(note[0])}</h3><p style="white-space:pre-wrap">${escapeHtml(note[1])}</p>` : ""}
  `;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.SUPPORT_FROM || "Zenweld Web <onboarding@resend.dev>",
        to: [SUPPORT_EMAIL],
        reply_to: replyTo && isEmail(replyTo) ? replyTo : undefined,
        subject: subject.slice(0, 200),
        html,
      }),
    });
    return res.ok ? { ok: true, delivered: true, demo } : { ok: true, delivered: false, demo, reason: "servis-hatasi" };
  } catch {
    return { ok: true, delivered: false, demo, reason: "baglanti-hatasi" };
  }
}
