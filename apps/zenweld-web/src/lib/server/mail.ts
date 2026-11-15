import { randomUUID } from "node:crypto";
import { DEFAULT_EMAIL_ADDRESS, notificationText, type OutgoingEmail } from "@zenweld/data";
import { emailSettingFor, logEmail } from "@zenweld/db";
import { escapeHtml } from "@zenweld/utils";
import { isNoIndex } from "@/lib/seo";
import { database, usesDatabase } from "./db";

/**
 * E-POSTA GONDERIMI (yalnizca sunucu: /api uclari; KARARLAR K-116)
 *
 * Site e-postayi Resend uzerinden gonderir: formlardan Zenweld'e giden
 * bildirimler, musteriye giden e-postalar (sifre sifirlama) ve panelden
 * yazilan e-postalar (Panel › E-posta, kayit ekranlarindaki E-posta
 * gonder).
 *
 * KURULUM (yayina alirken bir kez yapilir): canli site kendi sunucumuzda
 * calisir (KARARLAR K-92); asagidakiler o sunucuda ortam degiskeni olarak
 * tanimlanir (ornek: apps/zenweld-web/.env.example; docs/SUNUCU.md):
 *     RESEND_API_KEY   resend.com uzerinden alinan anahtar
 *     SUPPORT_EMAIL    (istege bagli) varsayilan alici, varsayilan info@zenweld.com
 *     SUPPORT_FROM     (istege bagli) varsayilan gonderici, varsayilan SUPPORT_EMAIL
 * Gonderici adresin alan adi (zenweld.com) Resend'de dogrulanmis olmalidir.
 *
 * Anahtar yoksa e-posta gonderilmez ve istek hata vermez. Demo adresinde
 * (zenweld.com disi) form basarili sayilir; canlida e-posta gitmezse
 * ziyaretciye hata gosterilir (demo: false).
 *
 * Adresler: veritabani modunda e-postanin turune gore panelde yazilan
 * gonderici ve alicilar (Panel › E-posta › Adresler, email_settings);
 * yazilmamissa ya da demo modunda varsayilan adresler.
 *
 * Veritabani modunda gonderilen (ya da gonderilemeyen) her e-posta metniyle
 * email_log'a yazilir: turu, sayfasi, bagli kayit ve sonucu (K-81, K-116).
 */

export const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || DEFAULT_EMAIL_ADDRESS;

/** "Ad <adres>" ya da "adres" -> adres. */
const bareAddress = (value: string) => (value.match(/<([^>]+)>/)?.[1] ?? value).trim().toLowerCase();

/** Turun gondericisi yazilmamissa kullanilan adres. */
export const DEFAULT_SENDER = bareAddress(process.env.SUPPORT_FROM || SUPPORT_EMAIL);

/** E-postanin "Kimden" satirinda gorunen ad. */
const SENDER_NAME = "Zenweld";

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
 * Turun adresleri: veritabani modunda panelde yazilanlar; yazilmamissa (ya
 * da okunamazsa) varsayilan gonderici ve alici.
 */
export async function addressesFor(type: string | undefined): Promise<{ from: string; to: string[] }> {
  let setting: { sender?: string; recipients: string[] } = { recipients: [] };
  if (type && usesDatabase()) {
    try {
      setting = await emailSettingFor(database(), type);
    } catch (error) {
      console.warn("E-posta adresleri okunamadı; varsayılan adresler kullanıldı:", error instanceof Error ? error.message : error);
    }
  }
  return { from: setting.sender || DEFAULT_SENDER, to: setting.recipients.length ? setting.recipients : [SUPPORT_EMAIL] };
}

interface Sent {
  result: MailResult;
  providerId?: string;
  /** E-postaya verilen Message-ID (yaniti eslestirmek icin) */
  messageId?: string;
  error?: string;
}

const statusOf = (sent: Sent) =>
  sent.result.delivered ? "sent" : sent.result.reason === "servis-hatasi" || sent.result.reason === "baglanti-hatasi" ? "failed" : "skipped";

/** Veritabani modunda e-postanin kaydi; kayit yazilamazsa e-posta yine gider. Kaydin numarasi doner. */
async function record(
  meta: EmailMeta | undefined,
  message: { from: string; to: string[]; subject: string; text: string; replyTo?: string },
  sent: Sent,
  extra: { parentId?: number; actor?: { id: string; name: string } } = {},
): Promise<number | undefined> {
  if (!meta || !usesDatabase()) return undefined;
  try {
    return await logEmail(database(), {
      type: meta.type,
      sourcePath: meta.sourcePath,
      entityType: meta.entity?.type,
      entityId: meta.entity?.id,
      from: message.from,
      recipients: message.to,
      replyTo: message.replyTo && isEmail(message.replyTo) ? message.replyTo : undefined,
      subject: message.subject,
      body: message.text,
      status: statusOf(sent),
      providerMessageId: sent.providerId,
      messageId: sent.messageId,
      error: sent.error,
      ...extra,
    });
  } catch (error) {
    console.warn("E-posta kaydı yazılamadı:", error instanceof Error ? error.message : error);
    return undefined;
  }
}

/** Bot tuzagina takilan form: e-posta gonderilmez, kaydi "skipped" olarak yazilir. */
export async function recordBot(meta: EmailMeta): Promise<void> {
  await record(
    meta,
    { from: DEFAULT_SENDER, to: [SUPPORT_EMAIL], subject: "(bot tuzağı)", text: "" },
    { result: { ok: true, delivered: false, demo: isNoIndex() }, error: "bot tuzağı" },
  );
}

/**
 * E-postayi Resend'e verir; anahtar yoksa gonderilmez. E-postaya kendi
 * Message-ID'si verilir; yanit bu basligi tasirsa posta kutusundan gelen
 * yanit bu e-postaya baglanir (packages/db › emails.ts).
 */
async function deliver(message: {
  from: string;
  to: string[];
  subject: string;
  html?: string;
  text: string;
  replyTo?: string;
  /** Yanitlanan e-postanin Message-ID'si */
  inReplyTo?: string;
}): Promise<Sent> {
  const demo = isNoIndex();
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { result: { ok: true, delivered: false, demo, reason: "eposta-yapilandirilmadi" } };
  const messageId = `<${randomUUID()}@${message.from.split("@")[1] || "zenweld.com"}>`;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: `${SENDER_NAME} <${message.from}>`,
        to: message.to,
        reply_to: message.replyTo && isEmail(message.replyTo) ? message.replyTo : undefined,
        subject: message.subject.slice(0, 200),
        html: message.html,
        text: message.text,
        headers: {
          "Message-ID": messageId,
          ...(message.inReplyTo && { "In-Reply-To": message.inReplyTo, References: message.inReplyTo }),
        },
      }),
    });
    const answer = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
    return res.ok
      ? { result: { ok: true, delivered: true, demo }, providerId: answer.id, messageId }
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
  const text = notificationText({ title, rows, note });
  const { from, to } = await addressesFor(log?.type);
  const sent = await deliver({ from, to, subject, html, text, replyTo });
  await record(log, { from, to, subject, text, replyTo }, sent);
  return sent.result;
}

/** Musteriye duz metin e-posta (sifre sifirlama ...); gonderici turun adresidir. */
export async function sendCustomerMail({
  to,
  subject,
  text,
  logText,
  log,
}: {
  to: string;
  subject: string;
  text: string;
  /** Yazismalara yazilan metin, gonderilenden farkliysa (or. sifre sifirlama baglantisi gizli) */
  logText?: string;
  log?: EmailMeta;
}): Promise<MailResult> {
  const { from } = await addressesFor(log?.type);
  const sent = await deliver({ from, to: [to], subject, text });
  await record(log, { from, to: [to], subject, text: logText ?? text }, sent);
  return sent.result;
}

/**
 * Panelden yazilan e-posta (veritabani modu): turun gondericisinden
 * gonderilir, metniyle ve yazan yoneticiyle kaydedilir. parent: yanitlanan
 * e-posta (yanit basliklari icin).
 */
export async function sendPanelMail(
  email: OutgoingEmail,
  actor: { id: string; name: string },
  parent?: { id: string; messageId?: string },
): Promise<{ id?: number; status: "sent" | "failed" | "skipped"; error?: string }> {
  const { from } = await addressesFor(email.type);
  const sent = await deliver({ from, to: email.to, subject: email.subject, text: email.body, inReplyTo: parent?.messageId });
  const id = await record(
    { type: email.type, entity: email.entity },
    { from, to: email.to, subject: email.subject, text: email.body },
    sent,
    { parentId: parent ? Number(parent.id) : undefined, actor: { id: actor.id, name: actor.name } },
  );
  return { id, status: statusOf(sent), error: sent.error };
}
