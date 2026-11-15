import { formatDateTime } from "@zenweld/utils";
import type { EmailMessage, EmailSetting } from "./types";

/**
 * E-POSTA KURALLARI (Panel › E-posta; KARARLAR K-116) — demo ve veritabani
 * modu ayni
 *
 * Tarayici (panel ekrani) ve sunucu (packages/db › emails.ts,
 * apps/zenweld-web › lib/server/mail.ts) ayni kurallari kullanir; sunucu
 * tarayicidan geleni yeniden denetler.
 *
 * Sitenin her e-posta turunun panelde kendi sekmesi vardir. Turun gonderici
 * adresi ve (Zenweld'e giden turlerde) alicilari panelde yazilir; yazilmazsa
 * varsayilan adres (info@zenweld.com) kullanilir.
 */

export const DEFAULT_EMAIL_ADDRESS = "info@zenweld.com";

/**
 * E-posta turleri, paneldeki sekme sirasiyla. zenweld: site bu turde
 * Zenweld'e bildirim gonderir (alicilar yazilir); false ise e-posta yalnizca
 * musteriye gider. sends: sitenin bugun bu turde gonderdigi e-posta.
 */
export const EMAIL_KINDS = [
  { type: "siparis", label: "Sipariş", zenweld: true, sends: "Yeni siparişte sipariş bilgileri Zenweld'e gider." },
  { type: "iade", label: "İade", zenweld: true, sends: "Yeni iade talebinde talep bilgileri Zenweld'e gider." },
  { type: "teklif", label: "Teklif", zenweld: true, sends: "Teklif Al formu gönderilince talep bilgileri Zenweld'e gider." },
  { type: "servis", label: "Servis", zenweld: true, sends: "Servis talebi formu gönderilince talep bilgileri Zenweld'e gider." },
  { type: "garanti", label: "Garanti", zenweld: true, sends: "Garanti kaydında kayıt bilgileri Zenweld'e gider." },
  { type: "yorum", label: "Yorum", zenweld: true, sends: "Ürün yorumu yazılınca onay bekleyen yorum Zenweld'e gider." },
  { type: "uye", label: "Üyelik", zenweld: true, sends: "Yeni üyelikte üyenin bilgileri Zenweld'e gider." },
  { type: "iletisim", label: "İletişim", zenweld: true, sends: "İletişim formundaki mesaj Zenweld'e gider." },
  { type: "urun-destek", label: "Ürün Sorusu", zenweld: true, sends: "Ürün sayfasından sorulan soru Zenweld'e gider." },
  { type: "bayilik", label: "Bayilik", zenweld: true, sends: "Bayilik başvurusu Zenweld'e gider." },
  { type: "sifre-sifirlama", label: "Şifre Sıfırlama", zenweld: false, sends: "Şifresini unutan üyeye sıfırlama bağlantısı gider." },
  {
    type: "bulten",
    label: "Bülten",
    zenweld: false,
    sends: "Site bugün bülten e-postası göndermez. Kampanya e-postası için İYS kaydı ve abonelikten çıkma bağlantısı gerekir.",
  },
] as const;

export type EmailKind = (typeof EMAIL_KINDS)[number];
export type EmailType = EmailKind["type"];

export const EMAIL_TYPE_LIST: readonly string[] = EMAIL_KINDS.map((k) => k.type);
export const isEmailType = (value: unknown): value is EmailType => typeof value === "string" && EMAIL_TYPE_LIST.includes(value);
export const emailKind = (type: string) => EMAIL_KINDS.find((k) => k.type === type);
export const emailTypeLabel = (type: string) => emailKind(type)?.label ?? type;

export const EMAIL_STATUS_LABELS: Record<EmailMessage["status"], string> = {
  sent: "Gönderildi",
  failed: "Gönderilemedi",
  skipped: "Gönderilmedi",
  received: "Geldi",
};

/** Bir turde en fazla kac alici; panelden yazilan e-postada da en fazla bu kadar alici. */
export const MAX_RECIPIENTS = 10;
export const EMAIL_SUBJECT_MAX = 200;
export const EMAIL_BODY_MAX = 20000;

/** error null: istek bozuk (ekran boyle bir sey gondermez). */
type Parsed<T> = { ok: true; value: T } | { ok: false; error: string | null };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const isEmailAddress = (value: string) => EMAIL.test(value) && value.length <= 200;

/**
 * Yazilan adresler: virgul, noktali virgul, bosluk ya da satir sonuyla
 * ayrilir; kucuk harfe cevrilir, ayni adres bir kez alinir.
 */
export function parseRecipients(text: string): Parsed<string[]> {
  const list = [...new Set(text.split(/[\s,;]+/).map((a) => a.trim().toLowerCase()).filter(Boolean))];
  const wrong = list.find((a) => !isEmailAddress(a));
  if (wrong) return { ok: false, error: `"${wrong}" geçerli bir e-posta adresi değil.` };
  if (list.length > MAX_RECIPIENTS) return { ok: false, error: `En fazla ${MAX_RECIPIENTS} adres yazılabilir.` };
  return { ok: true, value: list };
}

/** Gonderici: tek adres; bos = varsayilan adres. */
export function parseSender(text: string): Parsed<string | undefined> {
  const value = text.trim().toLowerCase();
  if (!value) return { ok: true, value: undefined };
  if (!isEmailAddress(value)) return { ok: false, error: `"${value}" geçerli bir e-posta adresi değil.` };
  return { ok: true, value };
}

/** Turun ayari (satiri yoksa bos: gonderici ve alicilar varsayilan). */
export const emailSettingOf = (list: EmailSetting[], type: string): EmailSetting =>
  list.find((s) => s.type === type) ?? { type, recipients: [] };

/**
 * Ayar listesinin o anki hali (ekran acildiktan sonra degisti mi): satir
 * sayisi ve en son degisen satir. Panel ekrani ve sunucu ayni fonksiyonla
 * hesaplar.
 */
export function emailSettingsVersion(rows: Pick<EmailSetting, "updatedAt">[]): string {
  const latest = rows.map((r) => r.updatedAt ?? "").sort().pop() ?? "";
  return `${rows.length}|${latest}`;
}

/** Panelden yazilan e-posta (Yeni e-posta / Yanitla). */
export interface OutgoingEmail {
  type: EmailType;
  to: string[];
  subject: string;
  body: string;
  /** Bagli kayit (servis talebi, mesaj ...) */
  entity?: { type: string; id: string };
  /** Yanitlanan e-postanin kimligi */
  parentId?: string;
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const shortId = (v: unknown) => (typeof v === "string" && v.length > 0 && v.length <= 100 ? v : null);

/** Panelden gelen e-postayi denetler (tarayici ve sunucu). */
export function parseOutgoingEmail(input: unknown): Parsed<OutgoingEmail> {
  if (!isRecord(input) || !isEmailType(input.type)) return { ok: false, error: null };
  if (typeof input.to !== "string" || typeof input.subject !== "string" || typeof input.body !== "string") return { ok: false, error: null };
  const to = parseRecipients(input.to);
  if (!to.ok) return to;
  if (!to.value.length) return { ok: false, error: "Alıcı adresi yazın." };
  const subject = input.subject.trim().replace(/\s+/g, " ");
  if (!subject) return { ok: false, error: "Konu yazın." };
  if (subject.length > EMAIL_SUBJECT_MAX) return { ok: false, error: `Konu en fazla ${EMAIL_SUBJECT_MAX} karakter olabilir.` };
  const body = input.body.replace(/\r\n/g, "\n").trim();
  if (!body) return { ok: false, error: "E-postanın metnini yazın." };
  if (body.length > EMAIL_BODY_MAX) return { ok: false, error: `Metin en fazla ${EMAIL_BODY_MAX} karakter olabilir.` };

  let entity: OutgoingEmail["entity"];
  if (input.entity !== undefined && input.entity !== null) {
    if (!isRecord(input.entity)) return { ok: false, error: null };
    const type = shortId(input.entity.type);
    const id = shortId(input.entity.id);
    if (!type || !id) return { ok: false, error: null };
    entity = { type, id };
  }
  let parentId: string | undefined;
  if (input.parentId !== undefined && input.parentId !== null) {
    const id = shortId(input.parentId);
    if (!id) return { ok: false, error: null };
    parentId = id;
  }
  return { ok: true, value: { type: input.type, to: to.value, subject, body, ...(entity && { entity }), ...(parentId && { parentId }) } };
}

/* ------------------------------------------------------------------ */
/* Yanit ve eslestirme                                                 */
/* ------------------------------------------------------------------ */

/** Konunun basindaki yanit / iletme ekleri (Re:, YNT:, Fwd: ...). */
const PREFIX = /^\s*(re|ynt|yanıt|yanit|aw|sv|fw|fwd|ilt|ilet)\s*(\[\d+\])?\s*:\s*/;

/** Yanitin konusu: zaten yanit ise oldugu gibi, degilse basina "Re: ". */
export const replySubject = (subject: string) => (/^\s*(re|ynt|yanıt)\s*:/i.test(subject) ? subject : `Re: ${subject}`).slice(0, EMAIL_SUBJECT_MAX);

/** Eklerinden arindirilmis, kucuk harfli konu (yaniti gonderilen e-postayla eslestirmek icin). */
export function baseSubject(subject: string): string {
  let s = subject.toLocaleLowerCase("tr");
  while (PREFIX.test(s)) s = s.replace(PREFIX, "");
  return s.replace(/\s+/g, " ").trim();
}

/** Yanitin altina eklenen onceki e-posta ("> " ile). */
export function quotedReply(message: Pick<EmailMessage, "at" | "from" | "body">): string {
  if (!message.body) return "";
  const lines = message.body.split("\n").map((line) => `> ${line}`);
  return `\n\n${formatDateTime(message.at)} tarihinde ${message.from ?? ""} yazdı:\n${lines.join("\n")}`;
}

/**
 * Kayit numaralari (IS-KURALLARI › Kayit numaralari): gelen e-postanin
 * konusunda ya da metninde gecen numara e-postayi o kayda baglar.
 */
export const RECORD_CODE_KINDS = {
  SIP: { entityType: "orders", emailType: "siparis" },
  IAD: { entityType: "return_requests", emailType: "iade" },
  TKL: { entityType: "quotes", emailType: "teklif" },
  SRV: { entityType: "service_requests", emailType: "servis" },
} as const satisfies Record<string, { entityType: string; emailType: EmailType }>;

export type RecordCodePrefix = keyof typeof RECORD_CODE_KINDS;

/** Metindeki kayit numaralari, gecis sirasiyla (buyuk harfle). */
export function findRecordCodes(text: string): { code: string; prefix: RecordCodePrefix }[] {
  const found: { code: string; prefix: RecordCodePrefix }[] = [];
  for (const m of text.matchAll(/\b(SIP|IAD|TKL|SRV)-(\d{4})-(\d{4,})\b/gi)) {
    const code = `${m[1].toUpperCase()}-${m[2]}-${m[3]}`;
    if (!found.some((f) => f.code === code)) found.push({ code, prefix: m[1].toUpperCase() as RecordCodePrefix });
  }
  return found;
}

/**
 * Siteden Zenweld'e giden bildirimin duz metni (baslik, "Alan: deger"
 * satirlari, uzun metin). E-postanin metin bolumu olarak gonderilir ve
 * yazismalarda bu metin saklanir.
 */
export function notificationText({ title, rows, note }: { title: string; rows: [string, string][]; note?: [string, string] }): string {
  const lines = rows.map(([label, value]) => `${label}: ${value?.trim() ? value.trim().replace(/\n/g, "\n  ") : "—"}`);
  const tail = note && note[1]?.trim() ? `\n\n${note[0]}:\n${note[1].trim()}` : "";
  return `${title}\n\n${lines.join("\n")}${tail}`;
}
