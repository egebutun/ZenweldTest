import { and, desc, eq, inArray, sql } from "drizzle-orm";
import {
  EMAIL_KINDS,
  RECORD_CODE_KINDS,
  baseSubject,
  emailSettingsVersion,
  emailTypeLabel,
  findRecordCodes,
  isEmailType,
  parseRecipients,
  parseSender,
  type EmailMessage,
  type EmailSetting,
  type EmailType,
} from "@zenweld/data";
import { tr } from "@zenweld/i18n";
import { writeAudit, type Actor, type AuditDb } from "./audit";
import { fail, saved, type PanelResult, type Saved } from "./panel";
import { emailMessageOf, logEmail } from "./email-log";
import type { ReadDb } from "./read";
import * as s from "./schema";

/**
 * E-POSTALAR SUNUCUDA (veritabani modu; Panel › E-posta; KARARLAR K-81,
 * K-116)
 *
 * - Adresler (email_settings): turun gonderici adresi ve Zenweld'e giden
 *   e-postanin alicilari. Satiri olmayan tur, bos gonderici ya da bos alici
 *   varsayilan adresi kullanir (apps/zenweld-web › lib/server/mail.ts).
 * - Yazismalar (email_log): sitenin gonderdigi her e-posta ve posta
 *   kutusundan alinan yanitlar, metniyle.
 * - Gelen e-posta (importIncomingEmail): yalnizca sitenin e-postasina yanit
 *   olan ya da kayit numarasi tasiyan e-posta alinir; gerisi posta
 *   kutusunda kalir. Eslestirme sirasi asagida.
 */

type Input = Record<string, unknown>;
const iso = (d: Date) => d.toISOString();
const opt = <T>(value: T | null) => value ?? undefined;

/* ------------------------------ Adresler ------------------------------ */

export async function readEmailSettings(db: ReadDb): Promise<EmailSetting[]> {
  const rows = await db.select().from(s.emailSettings).orderBy(s.emailSettings.type);
  return rows.map((r) => ({ type: r.type, ...(r.sender && { sender: r.sender }), recipients: r.recipients, updatedAt: iso(r.updatedAt) }));
}

/** E-posta gonderilirken: turun gondericisi ve alicilari (satir yoksa bos: varsayilan). */
export async function emailSettingFor(db: ReadDb, type: string): Promise<{ sender?: string; recipients: string[] }> {
  const [row] = await db
    .select({ sender: s.emailSettings.sender, recipients: s.emailSettings.recipients })
    .from(s.emailSettings)
    .where(eq(s.emailSettings.type, type));
  return { sender: row?.sender ?? undefined, recipients: row?.recipients ?? [] };
}

/** Panelde ya da ayarda yazili butun gonderici adresleri (posta kutusunda sitenin kendi e-postalarini ayirmak icin). */
export async function senderAddresses(db: ReadDb): Promise<string[]> {
  const rows = await db.select({ sender: s.emailSettings.sender }).from(s.emailSettings);
  return rows.map((r) => r.sender).filter((a): a is string => Boolean(a));
}

/**
 * Turun adreslerini kaydeder. input: { type, sender, recipients, version }.
 * version: ekranin gordugu listenin hali (emailSettingsVersion); bu arada
 * baska yonetici kaydettiyse 409. Gonderici ve alicilar bossa satir silinir
 * (varsayilan adres). Yalnizca musteriye giden turde alici yazilmaz.
 */
export async function adminSaveEmailSettings(db: AuditDb, actor: Actor, input: Input, at: Date): Promise<PanelResult<Saved>> {
  const type = input.type;
  if (!isEmailType(type) || typeof input.sender !== "string" || typeof input.recipients !== "string") {
    return fail(400, tr.panel.invalidRequest);
  }
  const kind = EMAIL_KINDS.find((k) => k.type === type)!;
  const sender = parseSender(input.sender);
  if (!sender.ok) return fail(400, `Gönderici: ${sender.error ?? tr.panel.invalidRequest}`);
  const recipients = parseRecipients(kind.zenweld ? input.recipients : "");
  if (!recipients.ok) return fail(400, `Alıcılar: ${recipients.error ?? tr.panel.invalidRequest}`);

  await db.execute(sql`select pg_advisory_xact_lock(hashtext('email_settings'))`);
  const current = await readEmailSettings(db);
  if (emailSettingsVersion(current) !== input.version) return fail(409, tr.panel.staleRecord);

  const before = current.find((r) => r.type === type);
  const next = { sender: sender.value, recipients: recipients.value };
  if ((before?.sender ?? undefined) === next.sender && JSON.stringify(before?.recipients ?? []) === JSON.stringify(next.recipients)) {
    return { ok: true };
  }
  const empty = !next.sender && !next.recipients.length;
  if (empty) await db.delete(s.emailSettings).where(eq(s.emailSettings.type, type));
  else {
    const values = { sender: next.sender ?? null, recipients: next.recipients, updatedAt: at, updatedBy: actor.id };
    await db.insert(s.emailSettings).values({ type, ...values }).onConflictDoUpdate({ target: s.emailSettings.type, set: values });
  }
  await writeAudit(
    db,
    actor,
    {
      action: !before ? "create" : empty ? "delete" : "update",
      entityType: "email_settings",
      entityId: type,
      entityLabel: `E-posta adresleri: ${emailTypeLabel(type)}`,
      changes: {
        sender: [before?.sender ?? null, next.sender ?? null],
        recipients: [before?.recipients ?? [], next.recipients],
      },
    },
    at,
  );
  return saved(at);
}

/* ------------------------------ Yazismalar ------------------------------ */

/** Tek e-posta (yanitlanacak e-posta); yoksa undefined. */
export async function findEmailMessage(db: ReadDb, id: string): Promise<(EmailMessage & { messageId?: string }) | undefined> {
  const n = Number(id);
  if (!Number.isSafeInteger(n) || n <= 0) return undefined;
  const [row] = await db.select().from(s.emailLog).where(eq(s.emailLog.id, n));
  return row ? { ...emailMessageOf(row), messageId: opt(row.messageId) } : undefined;
}

/** Bir kaydin (servis talebi, mesaj ...) yazismalari, en yeni once. */
export async function readEntityEmails(db: ReadDb, entityType: string, entityId: string, limit = 100): Promise<EmailMessage[]> {
  const rows = await db
    .select()
    .from(s.emailLog)
    .where(and(eq(s.emailLog.entityType, entityType), eq(s.emailLog.entityId, entityId)))
    .orderBy(desc(s.emailLog.id))
    .limit(limit);
  return rows.map(emailMessageOf);
}

/* ------------------------------ Gelen e-posta ------------------------------ */

/** Posta kutusundan okunan, cozulmus e-posta (mailbox.ts). */
export interface IncomingEmail {
  messageId?: string;
  inReplyTo?: string;
  references: string[];
  from?: string;
  to: string[];
  subject: string;
  text: string;
  attachments: string[];
}

export type ImportResult =
  | { status: "imported"; id: number; type: EmailType; entity?: { type: string; id: string } }
  | { status: "duplicate" | "own" | "unmatched" };

interface Match {
  type: string;
  entityType?: string;
  entityId?: string;
  parentId?: number;
}

/** Kayit numarasinin kaydi (siparis, iade, teklif, servis talebi); yoksa undefined. */
async function recordByCode(db: ReadDb, code: string, prefix: keyof typeof RECORD_CODE_KINDS): Promise<string | undefined> {
  const table = { SIP: s.orders, IAD: s.returnRequests, TKL: s.quotes, SRV: s.serviceRequests }[prefix];
  const [row] = await db.select({ id: table.id }).from(table).where(eq(table.code, code));
  return row?.id;
}

/**
 * Gelen e-postanin hangi yazismaya ait oldugu:
 * 1. Yanit basligi (In-Reply-To / References) sitenin gonderdigi bir
 *    e-postayi gosteriyorsa o e-postanin turu ve kaydi.
 * 2. Gonderen, sitenin son 180 gunde e-posta yazdigi bir adresse ve konu
 *    (Re:, YNT: gibi ekler atilinca) o e-postanin konusuyla ayniysa onun
 *    turu ve kaydi.
 * 3. Konuda, yoksa metinde gecen kayit numarasi (SIP-, IAD-, TKL-, SRV-)
 *    mevcut bir kaydinsa o kaydin turu.
 * Hicbiri degilse e-posta panele alinmaz.
 */
async function matchIncoming(db: ReadDb, mail: IncomingEmail, at: Date): Promise<Match | undefined> {
  const refs = [mail.inReplyTo, ...mail.references].filter((r): r is string => Boolean(r)).slice(0, 50);
  if (refs.length) {
    const [row] = await db
      .select()
      .from(s.emailLog)
      .where(and(inArray(s.emailLog.messageId, refs), eq(s.emailLog.direction, "out")))
      .orderBy(desc(s.emailLog.id))
      .limit(1);
    if (row) return { type: row.type, entityType: opt(row.entityType), entityId: opt(row.entityId), parentId: row.id };
  }

  const subject = baseSubject(mail.subject);
  if (mail.from && subject) {
    const since = new Date(at.getTime() - 180 * 24 * 60 * 60 * 1000);
    const rows = await db
      .select()
      .from(s.emailLog)
      .where(
        and(
          eq(s.emailLog.direction, "out"),
          sql`${s.emailLog.recipients} @> ARRAY[${mail.from}]::text[]`,
          sql`${s.emailLog.createdAt} >= ${since}`,
        ),
      )
      .orderBy(desc(s.emailLog.id))
      .limit(200);
    const row = rows.find((r) => baseSubject(r.subject) === subject);
    if (row) return { type: row.type, entityType: opt(row.entityType), entityId: opt(row.entityId), parentId: row.id };
  }

  for (const text of [mail.subject, mail.text]) {
    for (const { code, prefix } of findRecordCodes(text)) {
      const id = await recordByCode(db, code, prefix);
      if (id) return { type: RECORD_CODE_KINDS[prefix].emailType, entityType: RECORD_CODE_KINDS[prefix].entityType, entityId: id };
    }
  }
  return undefined;
}

/**
 * Posta kutusundan okunan e-postayi panele alir (yukaridaki eslestirmeyle).
 * own: gonderen sitenin kendi adreslerinden biri (sitenin bildirimleri de
 * info@'ya gittigi icin kutuda durur); duplicate: ayni Message-ID daha
 * once alinmis.
 */
export async function importIncomingEmail(
  db: AuditDb,
  mail: IncomingEmail,
  ownAddresses: string[],
  at = new Date(),
): Promise<ImportResult> {
  const from = mail.from?.toLowerCase();
  if (from && ownAddresses.map((a) => a.toLowerCase()).includes(from)) return { status: "own" };
  if (mail.messageId) {
    const [seen] = await db.select({ id: s.emailLog.id }).from(s.emailLog).where(eq(s.emailLog.messageId, mail.messageId)).limit(1);
    if (seen) return { status: "duplicate" };
  }
  const match = await matchIncoming(db, { ...mail, from }, at);
  if (!match || !isEmailType(match.type)) return { status: "unmatched" };
  const id = await logEmail(
    db,
    {
      type: match.type,
      direction: "in",
      entityType: match.entityType,
      entityId: match.entityId,
      from,
      recipients: mail.to.length ? mail.to : ["?"],
      subject: mail.subject || "(konu yok)",
      body: mail.text,
      status: "received",
      messageId: mail.messageId,
      parentId: match.parentId,
      attachments: mail.attachments.slice(0, 50).map((a) => a.slice(0, 200)),
    },
    at,
  );
  return {
    status: "imported",
    id,
    type: match.type,
    ...(match.entityType && match.entityId && { entity: { type: match.entityType, id: match.entityId } }),
  };
}

/* ------------------------------ Posta kutusu durumu ------------------------------ */

export interface MailboxState {
  mailbox: string;
  uidValidity?: number;
  lastUid: number;
  checkedAt?: string;
  lastError?: string;
}

export async function readMailboxStates(db: ReadDb): Promise<MailboxState[]> {
  const rows = await db.select().from(s.mailboxState).orderBy(s.mailboxState.mailbox);
  return rows.map((r) => ({
    mailbox: r.mailbox,
    uidValidity: opt(r.uidValidity),
    lastUid: r.lastUid,
    checkedAt: r.checkedAt ? iso(r.checkedAt) : undefined,
    lastError: opt(r.lastError),
  }));
}

export async function saveMailboxState(db: ReadDb, state: MailboxState, at: Date): Promise<void> {
  const values = {
    uidValidity: state.uidValidity ?? null,
    lastUid: state.lastUid,
    checkedAt: at,
    lastError: state.lastError?.slice(0, 500) ?? null,
  };
  await (db as AuditDb)
    .insert(s.mailboxState)
    .values({ mailbox: state.mailbox, ...values })
    .onConflictDoUpdate({ target: s.mailboxState.mailbox, set: values });
}
