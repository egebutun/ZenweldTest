"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown, Paperclip } from "lucide-react";
import {
  DEFAULT_EMAIL_ADDRESS,
  EMAIL_STATUS_LABELS,
  emailSettingOf,
  emailTypeLabel,
  parseOutgoingEmail,
  quotedReply,
  replySubject,
  type EmailMessage,
  type EmailType,
} from "@zenweld/data";
import { tr } from "@zenweld/i18n";
import { getEmailSettings, listEmailMessages, useDatabase } from "@zenweld/store";
import { Alert, Badge, Button, FormRow, Input, Textarea } from "@zenweld/ui";
import { formatDateTime } from "@zenweld/utils";
import { entityHref, entityLabel } from "@/lib/admin-log-labels";
import { useEmailActions, type SendAnswer } from "@/lib/admin-email";

/**
 * PANEL › E-POSTA PARCALARI (KARARLAR K-116)
 *
 * - EmailList: yazismalar (giden ve gelen); satira dokununca e-postanin
 *   metni, ekleri ve Yanitla.
 * - EmailComposer: Yeni e-posta / Yanitla. Gonderen, turun panelde yazili
 *   gonderici adresidir (yoksa varsayilan); degistirilmez.
 * - RecordEmails: bir kaydin (servis talebi, mesaj) yazismalari ve
 *   "E-posta gönder".
 */

const STATUS_TONE = { sent: "green", failed: "red", skipped: "outline", received: "dark" } as const;

export interface Draft {
  to: string;
  subject: string;
  body: string;
  entity?: { type: string; id: string };
  parentId?: string;
}

/** Yanitin taslagi: gelen e-postada gonderene, formdan gelen bildirimde formu dolduranin adresine. */
export function replyDraft(m: EmailMessage): Draft {
  const to = m.direction === "in" ? (m.from ?? "") : (m.replyTo ?? m.to.join(", "));
  return {
    to,
    subject: replySubject(m.subject),
    body: quotedReply(m),
    ...(m.entityType && m.entityId && { entity: { type: m.entityType, id: m.entityId } }),
    parentId: m.id,
  };
}

/** Gonderimin sonucu, ekranda gosterilecek metin. */
export function sendResultText(answer: SendAnswer): { tone: "success" | "danger" | "info"; text: string } {
  if (!answer.ok) return { tone: "danger", text: answer.error };
  if (answer.status === "sent") return { tone: "success", text: "E-posta gönderildi." };
  if (answer.status === "failed") return { tone: "danger", text: `E-posta gönderilemedi${answer.error ? `: ${answer.error}` : "."} Kaydı Yazışmalar'da.` };
  return { tone: "info", text: tr.panel.emailNotSent };
}

export function EmailComposer({
  type,
  from,
  initial,
  onSent,
  onCancel,
}: {
  type: EmailType;
  /** Gonderen adres (turun gondericisi) */
  from: string;
  initial: Draft;
  onSent: (answer: SendAnswer) => void;
  onCancel: () => void;
}) {
  const actions = useEmailActions();
  const [draft, setDraft] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const send = async () => {
    const parsed = parseOutgoingEmail({ type, ...draft });
    if (!parsed.ok) return setError(parsed.error ?? tr.panel.invalidRequest);
    setError(null);
    const answer = await actions.send(parsed.value, from);
    if (!answer.ok) return setError(answer.error);
    onSent(answer);
  };
  return (
    <div data-eposta-yaz className="space-y-3 rounded-[4px] border border-zw-grey-300 bg-white p-4">
      <div className="text-sm">
        <span className="text-zw-grey-500">Gönderen: </span>
        <span className="font-semibold">{from}</span>
      </div>
      <FormRow label="Kime" hint="Birden fazla adres virgülle ayrılır.">
        <Input value={draft.to} onChange={(e) => setDraft({ ...draft, to: e.target.value })} />
      </FormRow>
      <FormRow label="Konu">
        <Input value={draft.subject} onChange={(e) => setDraft({ ...draft, subject: e.target.value })} maxLength={200} />
      </FormRow>
      <FormRow label="Metin">
        <Textarea value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} className="min-h-48" />
      </FormRow>
      {error && <Alert tone="danger">{error}</Alert>}
      <div className="flex gap-2">
        <Button size="sm" disabled={actions.pending} onClick={() => void send()}>
          Gönder
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>
          Vazgeç
        </Button>
      </div>
    </div>
  );
}

/** Satirin "Kimden → Kime" bilgisi. */
function Parties({ m }: { m: EmailMessage }) {
  return (
    <div className="text-xs">
      <div className="text-zw-grey-500">{m.from ?? "—"}</div>
      <div>→ {m.to.join(", ")}</div>
      {m.replyTo && <div className="text-zw-grey-500">Yanıt: {m.replyTo}</div>}
    </div>
  );
}

function EmailView({ m, onReply }: { m: EmailMessage; onReply?: () => void }) {
  return (
    <div className="space-y-3 text-sm">
      {m.body ? (
        <pre data-eposta-metni className="max-h-[480px] overflow-auto whitespace-pre-wrap break-words rounded-[4px] border border-zw-grey-200 bg-white p-4 font-sans text-sm leading-relaxed">
          {m.body}
        </pre>
      ) : (
        <p className="text-zw-grey-500">Bu e-postanın metni saklanmamış (metinler saklanmaya başlamadan önce gönderildi).</p>
      )}
      {m.attachments && m.attachments.length > 0 && (
        <p className="flex items-center gap-1.5 text-xs text-zw-grey-600">
          <Paperclip size={13} /> Ekler (posta kutusunda): {m.attachments.join(", ")}
        </p>
      )}
      {m.error && <p className="text-xs text-zw-grey-600">Neden: {m.error}</p>}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zw-grey-500">
        {m.actorName && <span>Panelden gönderen: {m.actorName}</span>}
        {m.sourcePath && <span>Sayfa: {m.sourcePath}</span>}
      </div>
      {onReply && (
        <Button size="sm" variant="outline" onClick={onReply}>
          Yanıtla
        </Button>
      )}
    </div>
  );
}

/** Yazismalar tablosu. showType: tur sutunu (kaydin yazismalarinda). */
export function EmailList({
  messages,
  onReply,
  showType = false,
  empty = "Henüz e-posta yok.",
}: {
  messages: EmailMessage[];
  onReply?: (m: EmailMessage) => void;
  showType?: boolean;
  empty?: string;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const cols = showType ? 6 : 5;
  return (
    <div className="overflow-x-auto rounded-[4px] border border-zw-grey-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-zw-grey-50 text-left text-xs uppercase tracking-wide text-zw-grey-600">
          <tr>
            <th className="px-4 py-3">Zaman</th>
            {showType && <th className="px-4 py-3">Tür</th>}
            <th className="px-4 py-3">Kimden → Kime</th>
            <th className="px-4 py-3">Konu</th>
            <th className="px-4 py-3">Durum</th>
            <th className="w-8 px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-zw-grey-100">
          {messages.map((m) => {
            const href = m.entityType && m.entityId ? entityHref(m.entityType, m.entityId) : undefined;
            const isOpen = open === m.id;
            return (
              <Fragment key={m.id}>
                <tr data-eposta={m.id} className="cursor-pointer align-top hover:bg-zw-grey-50" onClick={() => setOpen(isOpen ? null : m.id)}>
                  <td className="whitespace-nowrap px-4 py-2.5 text-xs text-zw-grey-600">
                    {formatDateTime(m.at)}
                    <div className="mt-1">
                      <Badge tone={m.direction === "in" ? "amber" : "grey"}>{m.direction === "in" ? "Gelen" : "Giden"}</Badge>
                    </div>
                  </td>
                  {showType && <td className="px-4 py-2.5 text-xs font-semibold">{emailTypeLabel(m.type)}</td>}
                  <td className="px-4 py-2.5">
                    <Parties m={m} />
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="font-medium">{m.subject}</div>
                    {m.entityType && m.entityId && (
                      <div className="text-xs text-zw-grey-500">
                        {entityLabel(m.entityType)}:{" "}
                        {href ? (
                          <Link href={href} onClick={(e) => e.stopPropagation()} className="font-semibold text-zw-red-700 hover:underline">
                            {m.entityId}
                          </Link>
                        ) : (
                          m.entityId
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge tone={STATUS_TONE[m.status]}>{EMAIL_STATUS_LABELS[m.status]}</Badge>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <ChevronDown size={16} className={`inline transition-transform ${isOpen ? "rotate-180" : ""}`} />
                  </td>
                </tr>
                {isOpen && (
                  <tr className="bg-zw-grey-50">
                    <td colSpan={cols} className="px-4 py-4">
                      <EmailView m={m} onReply={onReply && (() => onReply(m))} />
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
          {messages.length === 0 && (
            <tr>
              <td colSpan={cols} className="px-4 py-8 text-center text-zw-grey-500">
                {empty}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Kaydin yazismalari: demo modunda tarayicidaki veriden, veritabani modunda
 * sunucudan (/api/yonetim/eposta/kayit) okunur; e-posta gonderilince
 * yeniden okunur.
 */
function useRecordEmails(emailType: EmailType, entity: { type: string; id: string }) {
  const db = useDatabase();
  const actions = useEmailActions();
  const [remote, setRemote] = useState<{ messages: EmailMessage[]; from: string } | null>(null);
  const [version, setVersion] = useState(0);
  const load = useCallback(async () => {
    const query = new URLSearchParams({ tur: entity.type, id: entity.id, eposta: emailType });
    const answer = await fetch(`/api/yonetim/eposta/kayit?${query}`)
      .then((r) => r.json())
      .catch(() => null);
    if (answer?.ok) setRemote({ messages: answer.messages, from: answer.from });
  }, [emailType, entity.type, entity.id]);
  useEffect(() => {
    if (actions.server) void load();
  }, [actions.server, load, version]);
  if (actions.server) return { messages: remote?.messages ?? [], from: remote?.from ?? "", loaded: remote !== null, reload: () => setVersion((v) => v + 1) };
  return {
    messages: listEmailMessages(db, { entity }),
    from: emailSettingOf(getEmailSettings(db), emailType).sender ?? DEFAULT_EMAIL_ADDRESS,
    loaded: true,
    reload: () => undefined,
  };
}

/** Kayit ekranindaki yazismalar ve "E-posta gönder" (servis talebi, mesaj). */
export function RecordEmails({
  emailType,
  entity,
  to,
  subject,
}: {
  emailType: EmailType;
  entity: { type: string; id: string };
  /** Yeni e-postanin alicisi (kaydin e-posta adresi) */
  to?: string;
  /** Yeni e-postanin konusu */
  subject: string;
}) {
  const { messages, from, loaded, reload } = useRecordEmails(emailType, entity);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [result, setResult] = useState<ReturnType<typeof sendResultText> | null>(null);
  return (
    <div data-kayit-yazismalari className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-xs font-bold uppercase tracking-wide text-zw-grey-600">Yazışmalar ({messages.length})</h3>
        {!draft && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setResult(null);
              setDraft({ to: to ?? "", subject, body: "", entity });
            }}
          >
            E-posta gönder
          </Button>
        )}
      </div>
      {result && <Alert tone={result.tone}>{result.text}</Alert>}
      {draft && (
        <EmailComposer
          type={emailType}
          from={from}
          initial={draft}
          onCancel={() => setDraft(null)}
          onSent={(answer) => {
            setDraft(null);
            setResult(sendResultText(answer));
            reload();
          }}
        />
      )}
      {loaded && (
        <EmailList
          messages={messages}
          showType
          empty="Bu kayıtla ilgili e-posta yok."
          onReply={(m) => {
            setResult(null);
            setDraft(replyDraft(m));
          }}
        />
      )}
    </div>
  );
}
