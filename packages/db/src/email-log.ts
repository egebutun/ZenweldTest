import type { EmailMessage } from "@zenweld/data";
import type { AuditDb } from "./audit";
import type { ReadDb } from "./read";
import * as s from "./schema";

/**
 * YAZISMALARIN KAYDI (email_log; KARARLAR K-81, K-116)
 *
 * Yalnizca tur bilgisi (import type) alir: db:seed ve db:yukle gibi tsx
 * ile calisan komutlar bu dosyayi da yukler (seed.ts); @zenweld/data'dan
 * calisma aninda bir sey almamalidir. Kurallar: emails.ts.
 */

const iso = (d: Date) => d.toISOString();
const opt = <T>(value: T | null) => value ?? undefined;

export interface EmailLogEntry {
  type: string;
  direction?: "out" | "in";
  sourcePath?: string;
  entityType?: string;
  entityId?: string;
  from?: string;
  recipients: string[];
  replyTo?: string;
  subject: string;
  /** Duz metin (KARARLAR K-116) */
  body?: string;
  status: "sent" | "failed" | "skipped" | "received";
  providerMessageId?: string;
  messageId?: string;
  parentId?: number;
  attachments?: string[];
  actor?: { id: string; name: string };
  error?: string;
}

/** Bir e-postanin kaydi (gonderilen, gonderilemeyen ya da gelen). Kaydin numarasi doner. */
export async function logEmail(db: AuditDb | ReadDb, entry: EmailLogEntry, at = new Date()): Promise<number> {
  const [row] = await (db as AuditDb)
    .insert(s.emailLog)
    .values({
      type: entry.type,
      direction: entry.direction ?? "out",
      sourcePath: entry.sourcePath?.slice(0, 500) || null,
      entityType: entry.entityType ?? null,
      entityId: entry.entityId ?? null,
      fromAddress: entry.from?.slice(0, 200) || null,
      recipients: entry.recipients,
      replyTo: entry.replyTo || null,
      subject: entry.subject.slice(0, 200),
      body: entry.body?.slice(0, 50_000) ?? null,
      status: entry.status,
      providerMessageId: entry.providerMessageId ?? null,
      messageId: entry.messageId?.slice(0, 500) ?? null,
      parentId: entry.parentId ?? null,
      attachments: entry.attachments ?? [],
      actorUserId: entry.actor?.id ?? null,
      actorName: entry.actor?.name ?? null,
      error: entry.error?.slice(0, 500) ?? null,
      createdAt: at,
    })
    .returning({ id: s.emailLog.id });
  return row.id;
}

type LogRow = typeof s.emailLog.$inferSelect;

/** email_log satiri -> ekranin kayit sekli (packages/data › EmailMessage). */
export function emailMessageOf(r: LogRow): EmailMessage {
  return {
    id: String(r.id),
    at: iso(r.createdAt),
    type: r.type,
    direction: r.direction as EmailMessage["direction"],
    from: opt(r.fromAddress),
    to: r.recipients,
    replyTo: opt(r.replyTo),
    subject: r.subject,
    body: opt(r.body),
    status: r.status as EmailMessage["status"],
    error: opt(r.error),
    entityType: opt(r.entityType),
    entityId: opt(r.entityId),
    sourcePath: opt(r.sourcePath),
    actorName: opt(r.actorName),
    parentId: r.parentId === null ? undefined : String(r.parentId),
    ...(r.attachments.length && { attachments: r.attachments }),
  };
}
