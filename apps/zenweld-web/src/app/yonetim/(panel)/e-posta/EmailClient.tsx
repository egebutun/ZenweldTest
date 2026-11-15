"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, RefreshCw } from "lucide-react";
import {
  EMAIL_KINDS,
  EMAIL_STATUS_LABELS,
  emailKind,
  emailSettingOf,
  type EmailMessage,
  type EmailType,
} from "@zenweld/data";
import type { LogPage, MailboxState } from "@zenweld/db";
import { getEmailSettings, listEmailMessages, useDatabase } from "@zenweld/store";
import { Alert, Button, FormRow, Input, Select, Tabs } from "@zenweld/ui";
import { formatDateTime } from "@zenweld/utils";
import { AdminCard, AdminPageHeader } from "@/components/admin/AdminShell";
import { EmailComposer, EmailList, replyDraft, sendResultText, type Draft } from "@/components/admin/EmailParts";
import { useEmailActions, useMailboxRead } from "@/lib/admin-email";
import { logHref } from "@/lib/admin-log-params";

const PATH = "/yonetim/e-posta";

type Filter = Record<string, string | undefined>;

/** Turkiye gununun basi (UTC+3). */
const dayStart = (day: string) => new Date(`${day}T00:00:00+03:00`).getTime();

/** Demo modunda suzgecler tarayicida uygulanir (veritabani modunda sunucuda). */
function filterLocal(messages: EmailMessage[], f: Filter): EmailMessage[] {
  const q = f.ara?.toLocaleLowerCase("tr");
  return messages.filter((m) => {
    if (f.yon && m.direction !== f.yon) return false;
    if (f.durum && m.status !== f.durum) return false;
    const at = new Date(m.at).getTime();
    if (f.baslangic && at < dayStart(f.baslangic)) return false;
    if (f.bitis && at >= dayStart(f.bitis) + 24 * 60 * 60 * 1000) return false;
    if (q) {
      const text = [m.from, ...m.to, m.replyTo, m.subject, m.entityId, m.body].join(" ").toLocaleLowerCase("tr");
      if (!text.includes(q)) return false;
    }
    return true;
  });
}

/**
 * E-POSTA EKRANI (KARARLAR K-116). page: veritabani modunda sunucunun
 * okudugu sayfa; demo modunda verilmez, tarayicidaki yazismalar gosterilir.
 * defaults: turun adresi yazilmamissa kullanilan gonderici ve alici.
 * mailboxes: veritabani modunda tanimli posta kutulari ve son okumalari.
 */
export function EmailClient({
  type,
  filter,
  defaults,
  page,
  paged = false,
  mailboxes,
}: {
  type: EmailType;
  filter: Filter;
  defaults: { sender: string; recipient: string };
  page?: LogPage<EmailMessage>;
  paged?: boolean;
  mailboxes?: MailboxState[];
}) {
  const router = useRouter();
  const db = useDatabase();
  const kind = emailKind(type)!;
  const setting = emailSettingOf(getEmailSettings(db), type);
  const sender = setting.sender ?? defaults.sender;
  const tab = filter.sekme === "adresler" ? "adresler" : "yazismalar";
  const go = (next: Filter) => router.push(logHref(PATH, next));

  return (
    <>
      <AdminPageHeader
        title="E-posta"
        description="Sitenin gönderdiği ve panele aldığı e-postalar. Her e-posta türünün kendi yazışmaları ve adresleri vardır."
      />
      <Tabs className="mb-5" tabs={EMAIL_KINDS.map((k) => ({ id: k.type, label: k.label }))} active={type} onChange={(id) => go({ tur: id })} />

      <p className="mb-1 text-sm text-zw-grey-700">{kind.sends}</p>
      <p className="mb-5 text-xs text-zw-grey-500">
        Gönderen: <span data-gonderen className="font-semibold text-zw-grey-700">{sender}</span>
        {kind.zenweld && (
          <>
            {" · "}Zenweld&apos;e giden e-postanın alıcıları:{" "}
            <span className="font-semibold text-zw-grey-700">{setting.recipients.length ? setting.recipients.join(", ") : defaults.recipient}</span>
          </>
        )}
      </p>

      <Tabs
        size="sm"
        className="mb-4"
        tabs={[
          { id: "yazismalar", label: "Yazışmalar" },
          { id: "adresler", label: "Adresler" },
        ]}
        active={tab}
        onChange={(id) => go({ tur: type, sekme: id === "adresler" ? "adresler" : undefined })}
      />

      {tab === "adresler" ? (
        <AddressForm key={type} type={type} defaults={defaults} />
      ) : (
        <Correspondence type={type} sender={sender} filter={filter} page={page} paged={paged} mailboxes={mailboxes} />
      )}
    </>
  );
}

function Correspondence({
  type,
  sender,
  filter,
  page,
  paged,
  mailboxes,
}: {
  type: EmailType;
  sender: string;
  filter: Filter;
  page?: LogPage<EmailMessage>;
  paged: boolean;
  mailboxes?: MailboxState[];
}) {
  const db = useDatabase();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [result, setResult] = useState<ReturnType<typeof sendResultText> | null>(null);
  const data = page ?? { entries: filterLocal(listEmailMessages(db, { type }), filter), more: false };
  const last = data.entries.at(-1);
  const listFilter = { ...filter, sekme: undefined };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {mailboxes ? <MailboxStatus mailboxes={mailboxes} /> : <span />}
        {!draft && (
          <Button
            size="sm"
            onClick={() => {
              setResult(null);
              setDraft({ to: "", subject: "", body: "" });
            }}
          >
            <Plus size={15} /> Yeni e-posta
          </Button>
        )}
      </div>
      {result && <Alert tone={result.tone}>{result.text}</Alert>}
      {draft && (
        <EmailComposer
          key={draft.parentId ?? "yeni"}
          type={type}
          from={sender}
          initial={draft}
          onCancel={() => setDraft(null)}
          onSent={(answer) => {
            setDraft(null);
            setResult(sendResultText(answer));
          }}
        />
      )}

      <form action={PATH} method="get" className="grid gap-3 rounded-[4px] border border-zw-grey-200 bg-white p-4 sm:grid-cols-3 lg:grid-cols-6">
        <input type="hidden" name="tur" value={type} />
        <Select name="yon" defaultValue={filter.yon ?? ""} aria-label="Giden / gelen">
          <option value="">Giden ve gelen</option>
          <option value="out">Giden</option>
          <option value="in">Gelen</option>
        </Select>
        <Select name="durum" defaultValue={filter.durum ?? ""} aria-label="Durum">
          <option value="">Tüm durumlar</option>
          {Object.entries(EMAIL_STATUS_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </Select>
        <Input type="date" name="baslangic" defaultValue={filter.baslangic ?? ""} aria-label="Başlangıç tarihi" />
        <Input type="date" name="bitis" defaultValue={filter.bitis ?? ""} aria-label="Bitiş tarihi" />
        <div className="flex gap-2 sm:col-span-2">
          <Input name="ara" defaultValue={filter.ara ?? ""} placeholder="Adres, konu, kayıt no ya da metin ara…" className="min-w-0 flex-1" />
          <Button type="submit" size="sm">
            Süz
          </Button>
        </div>
      </form>

      <EmailList
        messages={data.entries}
        onReply={(m) => {
          setResult(null);
          setDraft(replyDraft(m));
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />

      <div className="flex gap-4 text-sm font-semibold">
        {paged && (
          <Link href={logHref(PATH, listFilter)} className="text-zw-grey-600 hover:text-zw-ink">
            ← En yeni e-postalar
          </Link>
        )}
        {data.more && last && (
          <Link href={logHref(PATH, listFilter, Number(last.id))} className="text-zw-red-700 hover:underline">
            Daha eski e-postalar →
          </Link>
        )}
      </div>
    </div>
  );
}

/** Posta kutularinin son okumasi ve "Şimdi oku" (veritabani modu). */
function MailboxStatus({ mailboxes }: { mailboxes: MailboxState[] }) {
  const mailbox = useMailboxRead();
  if (!mailboxes.length) {
    return (
      <p data-posta-kutusu className="text-xs text-zw-grey-500">
        Posta kutusu bağlı değil: gelen yanıtlar panele alınmaz. Bağlantı sunucuda kurulur.
      </p>
    );
  }
  return (
    <div data-posta-kutusu className="space-y-1 text-xs text-zw-grey-600">
      {mailboxes.map((m) => (
        <div key={m.mailbox}>
          Posta kutusu {m.mailbox.replace(/^(imap|klasor):/, "")}:{" "}
          {m.checkedAt ? `son okuma ${formatDateTime(m.checkedAt)}` : "henüz okunmadı"}
          {m.lastError && <span className="text-zw-red-700"> · okunamadı: {m.lastError}</span>}
        </div>
      ))}
      <button
        type="button"
        disabled={mailbox.pending}
        onClick={() => void mailbox.read()}
        className="inline-flex items-center gap-1 font-semibold text-zw-red-700 hover:underline disabled:opacity-50"
      >
        <RefreshCw size={12} /> Şimdi oku
      </button>
      {mailbox.message && <div className="text-zw-grey-700">{mailbox.message}</div>}
    </div>
  );
}

/** Turun gonderici adresi ve (Zenweld'e giden turlerde) alicilari. */
function AddressForm({ type, defaults }: { type: EmailType; defaults: { sender: string; recipient: string } }) {
  const db = useDatabase();
  const actions = useEmailActions();
  const kind = emailKind(type)!;
  const stored = emailSettingOf(getEmailSettings(db), type);
  const [sender, setSender] = useState(stored.sender ?? "");
  const [recipients, setRecipients] = useState(stored.recipients.join(", "));
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const save = async () => {
    setError(null);
    const answer = await actions.saveSetting(type, sender, recipients, kind.zenweld);
    if (!answer.ok) return setError(answer.error);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };
  return (
    <AdminCard className="max-w-2xl space-y-4">
      <p className="text-sm text-zw-grey-600">
        Boş bırakılan adres yerine varsayılan adres kullanılır. Gönderici adresin alan adı (zenweld.com) e-posta servisinde
        doğrulanmış olmalıdır.
      </p>
      <FormRow label="Gönderici" hint={`Bu türdeki e-postalar bu adresten gider. Boşsa: ${defaults.sender}`}>
        <Input value={sender} onChange={(e) => setSender(e.target.value)} placeholder={defaults.sender} aria-label="Gönderici adresi" />
      </FormRow>
      {kind.zenweld && (
        <FormRow label="Alıcılar" hint={`Sitenin Zenweld'e gönderdiği e-posta bu adreslere gider. Birden fazla adres virgülle ayrılır (en fazla 10). Boşsa: ${defaults.recipient}`}>
          <Input value={recipients} onChange={(e) => setRecipients(e.target.value)} placeholder={defaults.recipient} aria-label="Alıcı adresleri" />
        </FormRow>
      )}
      {error && <Alert tone="danger">{error}</Alert>}
      <div className="flex items-center gap-3">
        <Button size="sm" disabled={actions.pending} onClick={() => void save()}>
          Kaydet
        </Button>
        {saved && <span className="text-xs text-emerald-700">Kaydedildi</span>}
      </div>
    </AdminCard>
  );
}
