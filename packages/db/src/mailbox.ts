import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImapFlow } from "imapflow";
import { simpleParser, type AddressObject } from "mailparser";
import type { AuditDb } from "./audit";
import { importIncomingEmail, readMailboxStates, saveMailboxState, senderAddresses, type IncomingEmail } from "./emails";

/**
 * POSTA KUTUSU OKUMA (KARARLAR K-108'deki gibi degistirilebilir parca;
 * K-116; docs/SUNUCU.md › Posta kutusu)
 *
 * Zamanlanmis is (/api/posta/oku; npm run posta:oku) sitenin e-posta
 * adreslerinin posta kutusunu okur; yeni e-postalari packages/db ›
 * emails.ts › importIncomingEmail'e verir. Yalnizca sitenin e-postasina
 * yanit olan ya da kayit numarasi tasiyan e-posta panele alinir; okunan
 * e-posta kutuda oldugu gibi kalir (okundu isaretlenmez, silinmez).
 *
 * Kaynaklar sunucudaki ortam degiskenlerinden kurulur; baglanti bilgileri
 * panelde, veride ve tarayicida durmaz:
 * - IMAP (ilk parca): IMAP_HOST, IMAP_USER, IMAP_PASSWORD, istege bagli
 *   IMAP_PORT (993) ve IMAP_KLASOR (INBOX). Ikinci kutu ayni adlarin sonuna
 *   _2 eklenerek (IMAP_HOST_2 ...), ucuncusu _3 ile tanimlanir.
 * - Klasor (deneme parcasi): POSTA_KLASORU'ndeki .eml dosyalari ad
 *   sirasiyla okunur.
 * E-posta saglayicisi IMAP'e sifreyle izin vermiyorsa (Microsoft 365 gibi)
 * o saglayicinin parcasi eklenir (docs/YAPILACAKLAR.md › Sirketten
 * ogrenilecekler).
 */

/** Bir okumada kutu basina en fazla bu kadar e-posta (kalan bir sonraki okumada). */
const BATCH = 200;
/** Ilk okumada (ya da kutu yeniden kurulmussa) bu kadar gunluk e-posta okunur. */
const FIRST_DAYS = 7;

/** Posta kutusundaki bir e-posta: kutudaki sira numarasi (UID) ve ham hali. */
export interface RawMail {
  uid: number;
  raw: Buffer;
}

export interface MailboxSource {
  /** mailbox_state anahtari: "imap:info@zenweld.com/INBOX" */
  key: string;
  /**
   * lastUid'den sonraki e-postalar; uidValidity degistiyse son FIRST_DAYS
   * gun. seenUpTo: bu sira numarasina kadar her e-posta gozden gecti
   * (hic e-posta yoksa da okuma bir sonraki sefer buradan devam eder).
   */
  fetch(state: { uidValidity?: number; lastUid: number }): Promise<{ uidValidity?: number; mails: RawMail[]; seenUpTo: number }>;
}

function imapSource(host: string, user: string, pass: string, port: number, folder: string): MailboxSource {
  return {
    key: `imap:${user}/${folder}`,
    async fetch(state) {
      const client = new ImapFlow({ host, port, secure: port === 993, auth: { user, pass }, logger: false });
      await client.connect();
      try {
        const box = await client.mailboxOpen(folder, { readOnly: true });
        const uidValidity = Number(box.uidValidity);
        const fresh = state.uidValidity !== uidValidity;
        const since = new Date(Date.now() - FIRST_DAYS * 24 * 60 * 60 * 1000);
        const found = ((await client.search(fresh ? { since } : { uid: `${state.lastUid + 1}:*` }, { uid: true })) || [])
          .filter((uid) => fresh || uid > state.lastUid)
          .sort((a, b) => a - b);
        const uids = found.slice(0, BATCH);
        const mails: RawMail[] = [];
        if (uids.length) {
          for await (const msg of client.fetch(uids.join(","), { uid: true, source: true }, { uid: true })) {
            if (msg.source) mails.push({ uid: msg.uid, raw: msg.source });
          }
        }
        // Hepsi alindiysa kutunun sonuna kadar gozden gecti; kalan varsa son alinana kadar.
        const seenUpTo = uids.length < found.length ? uids[uids.length - 1] : Math.max(box.uidNext - 1, fresh ? 0 : state.lastUid);
        return { uidValidity, mails: mails.sort((a, b) => a.uid - b.uid), seenUpTo };
      } finally {
        await client.logout().catch(() => undefined);
      }
    },
  };
}

function folderSource(dir: string): MailboxSource {
  return {
    key: `klasor:${dir}`,
    async fetch(state) {
      const names = (await readdir(dir)).filter((n) => n.toLowerCase().endsWith(".eml")).sort();
      const mails: RawMail[] = [];
      for (const [i, name] of names.entries()) {
        const uid = i + 1;
        if (uid <= state.lastUid || mails.length >= BATCH) continue;
        mails.push({ uid, raw: await readFile(join(dir, name)) });
      }
      return { uidValidity: 1, mails, seenUpTo: mails.at(-1)?.uid ?? state.lastUid };
    },
  };
}

/** Sunucudaki ayarlardan posta kutulari; hicbiri tanimli degilse bos. */
export function mailboxSourcesFromEnv(env: Record<string, string | undefined> = process.env): MailboxSource[] {
  const sources: MailboxSource[] = [];
  for (let n = 1; n <= 9; n++) {
    const suffix = n === 1 ? "" : `_${n}`;
    const host = env[`IMAP_HOST${suffix}`];
    const user = env[`IMAP_USER${suffix}`];
    const pass = env[`IMAP_PASSWORD${suffix}`];
    if (!host || !user || !pass) {
      if (n > 1) break;
      continue;
    }
    const port = Number(env[`IMAP_PORT${suffix}`] || 993);
    sources.push(imapSource(host, user, pass, Number.isInteger(port) && port > 0 ? port : 993, env[`IMAP_KLASOR${suffix}`] || "INBOX"));
  }
  if (env.POSTA_KLASORU) sources.push(folderSource(env.POSTA_KLASORU));
  return sources;
}

const address = (value: AddressObject | AddressObject[] | undefined) =>
  (Array.isArray(value) ? value : value ? [value] : [])
    .flatMap((a) => a.value)
    .map((v) => v.address?.toLowerCase())
    .filter((a): a is string => Boolean(a));

/** Ham e-postayi cozer: konu, gonderen, alicilar (Kime ve Bilgi), duz metin (yalniz HTML ise HTML'den), yanit basliklari, ek adlari. */
export async function parseRawEmail(raw: Buffer): Promise<IncomingEmail> {
  const mail = await simpleParser(raw, { skipImageLinks: true });
  const references = Array.isArray(mail.references) ? mail.references : mail.references ? mail.references.split(/\s+/) : [];
  return {
    messageId: mail.messageId || undefined,
    inReplyTo: mail.inReplyTo || undefined,
    references,
    from: address(mail.from)[0],
    to: [...address(mail.to), ...address(mail.cc)].slice(0, 20),
    subject: (mail.subject ?? "").trim(),
    text: (mail.text ?? "").replace(/\r\n/g, "\n").trim(),
    // Imza logosu gibi metnin icindeki gorseller ek sayilmaz.
    attachments: mail.attachments.filter((a) => !a.related).map((a) => a.filename ?? "ek"),
  };
}

export interface MailboxRun {
  mailbox: string;
  read: number;
  imported: number;
  error?: string;
}

/**
 * Kutulari okur ve yeni e-postalari panele alir. own: sitenin gonderici
 * adresleri (varsayilan dahil); bunlardan gelen e-posta sitenin kendi
 * e-postasidir, alinmaz. Bir kutu okunamazsa hatasi mailbox_state'e
 * yazilir, digerleri okunmaya devam eder.
 */
export async function readMailboxes(db: AuditDb, sources: MailboxSource[], own: string[], at = new Date()): Promise<MailboxRun[]> {
  const states = await readMailboxStates(db);
  const ownAddresses = [...new Set([...own, ...(await senderAddresses(db))].map((a) => a.toLowerCase()))];
  const runs: MailboxRun[] = [];
  for (const source of sources) {
    const state = states.find((s) => s.mailbox === source.key) ?? { mailbox: source.key, lastUid: 0 };
    try {
      const { uidValidity, mails, seenUpTo } = await source.fetch(state);
      let lastUid = uidValidity === state.uidValidity ? state.lastUid : 0;
      let imported = 0;
      for (const mail of mails) {
        const parsed = await parseRawEmail(mail.raw);
        const result = await importIncomingEmail(db, parsed, ownAddresses, at);
        if (result.status === "imported") imported++;
        lastUid = Math.max(lastUid, mail.uid);
      }
      lastUid = Math.max(lastUid, seenUpTo);
      await saveMailboxState(db, { mailbox: source.key, uidValidity, lastUid }, at);
      runs.push({ mailbox: source.key, read: mails.length, imported });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await saveMailboxState(db, { ...state, lastError: message }, at);
      runs.push({ mailbox: source.key, read: 0, imported: 0, error: message });
    }
  }
  return runs;
}
