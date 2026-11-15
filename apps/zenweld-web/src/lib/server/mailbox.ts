import { mailboxSourcesFromEnv, readMailboxes, type MailboxRun } from "@zenweld/db";
import { database } from "./db";
import { DEFAULT_SENDER, SUPPORT_EMAIL } from "./mail";

/**
 * Sitenin posta kutularini okur (KARARLAR K-116; packages/db › mailbox.ts).
 * Zamanlanmis is (/api/posta/oku) ve paneldeki "Şimdi oku" ayni yolu
 * kullanir. Varsayilan gonderici ve alicidan gelen e-posta sitenin kendi
 * e-postasidir; alinmaz. Posta kutusu tanimli degilse null.
 */
export async function readSiteMailboxes(): Promise<MailboxRun[] | null> {
  const sources = mailboxSourcesFromEnv();
  if (!sources.length) return null;
  return readMailboxes(database(), sources, [DEFAULT_SENDER, SUPPORT_EMAIL]);
}

/** Tanimli posta kutularinin anahtarlari (panelde son okuma bilgisi icin). */
export const mailboxKeys = () => mailboxSourcesFromEnv().map((s) => s.key);
