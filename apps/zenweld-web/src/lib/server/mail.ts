import { emailRecipientsFor, logEmail } from "@zenweld/db";
import { escapeHtml } from "@zenweld/utils";
import { isNoIndex } from "@/lib/seo";
import { database, usesDatabase } from "./db";

/**
 * E-POSTA GONDERIMI (yalnizca sunucu: /api uclari)
 *
 * Sitedeki formlar Zenweld'e Resend uzerinden e-posta gonderir.
 *
 * KURULUM (yayina alirken bir kez yapilir): canli site kendi sunucumuzda
 * calisir (KARARLAR K-92); asagidakiler o sunucuda ortam degiskeni olarak
 * tanimlanir (ornek: apps/zenweld-web/.env.example; docs/ENTEGRASYONLAR.md):
 *     RESEND_API_KEY   resend.com uzerinden alinan anahtar
 *     SUPPORT_EMAIL    (istege bagli) varsayilan alici, varsayilan info@zenweld.com
 *     SUPPORT_FROM     (istege bagli) dogrulanmis gonderici adresi
 *
 * Anahtar yoksa e-posta gonderilmez ve istek hata vermez. Demo adresinde
 * (zenweld.com disi) form basarili sayilir; canlida e-posta gitmezse
 * ziyaretciye hata gosterilir (demo: false).
 *
 * Veritabani modunda gonderilen (ya da gonderilemeyen) her e-posta
 * email_log'a yazilir: turu, sayfasi, bagli kayit ve sonucu (KARARLAR K-81;
 * Asama 5.3). Metni saklanmaz.
 *
 * Alicilar: veritabani modunda e-postanin turune gore panelde yazilan
 * adresler (Mağaza Ayarları > E-posta Alıcıları, email_recipients;
 * KARARLAR K-104); tur icin adres yazilmamissa ya da demo modunda
 * SUPPORT_EMAIL.
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

/** E-postanin kaydi icin: hangi ozellik, hangi sayfa, hangi kayit. */
export interface EmailMeta {
  /** E-posta turu (iletisim, teklif, siparis, sifre-sifirlama ...) */
  type: string;
  /** Formun gonderildigi sayfa (/teklif-al) */
  sourcePath?: string;
  /** Bagli kayit (quotes + teklifin kimligi) */
  entity?: { type: string; id: string };
}

/** Istegin geldigi sayfa (ayni siteden geliyorsa; yalnizca yol). */
export function sourcePath(request: Request): string | undefined {
  try {
    const referer = new URL(request.headers.get("referer") ?? "");
    return referer.host === request.headers.get("host") ? referer.pathname : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Zenweld'e giden e-postanin alicilari: veritabani modunda turun panelde
 * yazilan adresleri; yoksa (ya da okunamazsa) SUPPORT_EMAIL.
 */
export async function recipientsFor(type: string | undefined): Promise<string[]> {
  if (!type || !usesDatabase()) return [SUPPORT_EMAIL];
  try {
    const list = await emailRecipientsFor(database(), type);
    return list.length ? list : [SUPPORT_EMAIL];
  } catch (error) {
    console.warn("E-posta alıcıları okunamadı; varsayılan adres kullanıldı:", error instanceof Error ? error.message : error);
    return [SUPPORT_EMAIL];
  }
}

/** Veritabani modunda e-postanin kaydi; kayit yazilamazsa e-posta yine gider. */
async function record(meta: EmailMeta | undefined, to: string[], subject: string, replyTo: string | undefined, sent: Sent) {
  if (!meta || !usesDatabase()) return;
  try {
    await logEmail(database(), {
      type: meta.type,
      sourcePath: meta.sourcePath,
      entityType: meta.entity?.type,
      entityId: meta.entity?.id,
      recipients: to,
      replyTo: replyTo && isEmail(replyTo) ? replyTo : undefined,
      subject,
      status: sent.result.delivered ? "sent" : sent.result.reason === "servis-hatasi" || sent.result.reason === "baglanti-hatasi" ? "failed" : "skipped",
      providerMessageId: sent.providerId,
      error: sent.error,
    });
  } catch (error) {
    console.warn("E-posta kaydı yazılamadı:", error instanceof Error ? error.message : error);
  }
}

/** Bot tuzagina takilan form: e-posta gonderilmez, kaydi "skipped" olarak yazilir. */
export function recordBot(meta: EmailMeta): Promise<void> {
  return record(meta, [SUPPORT_EMAIL], "(bot tuzağı)", undefined, {
    result: { ok: true, delivered: false, demo: isNoIndex() },
    error: "bot tuzağı",
  });
}

interface Sent {
  result: MailResult;
  providerId?: string;
  error?: string;
}

/** E-postayi Resend'e verir; anahtar yoksa gonderilmez. */
async function deliver(message: {
  to: string[];
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
}): Promise<Sent> {
  const demo = isNoIndex();
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { result: { ok: true, delivered: false, demo, reason: "eposta-yapilandirilmadi" } };
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.SUPPORT_FROM || "Zenweld Web <onboarding@resend.dev>",
        to: message.to,
        reply_to: message.replyTo && isEmail(message.replyTo) ? message.replyTo : undefined,
        subject: message.subject.slice(0, 200),
        html: message.html,
        text: message.text,
      }),
    });
    const answer = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
    return res.ok
      ? { result: { ok: true, delivered: true, demo }, providerId: answer.id }
      : { result: { ok: true, delivered: false, demo, reason: "servis-hatasi" }, error: `${res.status} ${answer.message ?? ""}`.trim() };
  } catch (error) {
    return {
      result: { ok: true, delivered: false, demo, reason: "baglanti-hatasi" },
      error: error instanceof Error ? error.message : "bağlantı hatası",
    };
  }
}

/** Zenweld'e e-posta: baslik, alan tablosu ve istege bagli uzun metin. */
export async function sendMail({
  subject,
  title,
  rows,
  note,
  replyTo,
  log,
}: {
  subject: string;
  title: string;
  rows: [string, string][];
  /** Tablonun altindaki uzun metin (mesaj, not ...) */
  note?: [string, string];
  /** Yanit dogrudan formu doldurana gitsin */
  replyTo?: string;
  /** Veritabani modunda email_log kaydi */
  log?: EmailMeta;
}): Promise<MailResult> {
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
  const to = await recipientsFor(log?.type);
  const sent = await deliver({ to, subject, html, replyTo });
  await record(log, to, subject, replyTo, sent);
  return sent.result;
}

/** Musteriye duz metin e-posta (sifre sifirlama ...). */
export async function sendCustomerMail({
  to,
  subject,
  text,
  log,
}: {
  to: string;
  subject: string;
  text: string;
  log?: EmailMeta;
}): Promise<MailResult> {
  const sent = await deliver({ to: [to], subject, text });
  await record(log, [to], subject, undefined, sent);
  return sent.result;
}
