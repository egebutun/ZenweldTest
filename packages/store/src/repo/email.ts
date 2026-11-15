"use client";

import type { EmailMessage, EmailSetting, ZenweldDatabase } from "@zenweld/data";
import { getSnapshot, mutate, uid } from "../database";
import { nowIso } from "./shared";

/**
 * E-POSTA (Panel › E-posta; KARARLAR K-116) — demo modu
 *
 * Adresler ve yazismalar tarayicidaki veride durur. Demo modunda site
 * e-postayi gercekten gondermez: panelden yazilan e-posta "Gonderilmedi"
 * olarak kaydedilir. Veritabani modunda ayni ekranlar sunucuyu kullanir
 * (packages/db › emails.ts).
 */

/** Tur basina adresler; listede olmayan tur varsayilan adresi kullanir. */
export function getEmailSettings(db: ZenweldDatabase = getSnapshot()): EmailSetting[] {
  return db.emailSettings ?? [];
}

/** Adresleri kaydeder; gondericisi ve alicisi bos tur listeden cikar. */
export function saveEmailSettings(list: EmailSetting[]): boolean {
  return mutate((db) => {
    db.emailSettings = list
      .filter((s) => s.sender || s.recipients.length > 0)
      .map(({ type, sender, recipients }) => ({ type, ...(sender && { sender }), recipients }));
  });
}

/** Yazismalar, en yeni once. type: tur sekmesi; entity: kaydin kendi yazismalari. */
export function listEmailMessages(
  db: ZenweldDatabase,
  filter: { type?: string; entity?: { type: string; id: string } } = {},
): EmailMessage[] {
  return (db.emailMessages ?? [])
    .filter((m) => !filter.type || m.type === filter.type)
    .filter((m) => !filter.entity || (m.entityType === filter.entity.type && m.entityId === filter.entity.id))
    .sort((a, b) => b.at.localeCompare(a.at) || b.id.localeCompare(a.id));
}

/** Panelden yazilan e-posta (demo: gonderilmez, kaydi tutulur). Kimligi doner. */
export function addEmailMessage(message: Omit<EmailMessage, "id" | "at">): string | null {
  const id = uid("eml");
  const ok = mutate((db) => {
    db.emailMessages = [...(db.emailMessages ?? []), { ...message, id, at: nowIso() }];
  });
  return ok ? id : null;
}
