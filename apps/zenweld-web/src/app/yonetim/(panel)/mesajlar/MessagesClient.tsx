"use client";

import { Fragment, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { CountedListPage, SupportMessageRecord } from "@zenweld/db";
import { listSupportMessages, useDatabase } from "@zenweld/store";
import { Alert, Badge, Button, Select, Textarea } from "@zenweld/ui";
import { formatDateTime } from "@zenweld/utils";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { ListPager, useListQuery } from "@/components/admin/ListControls";
import { messageListFilter, messageListPage } from "@/lib/admin-lists";
import { useRequestActions } from "@/lib/admin-requests";

type Status = SupportMessageRecord["status"];

const STATUS: Record<Status, { label: string; tone: "amber" | "grey" | "green" }> = {
  new: { label: "Yeni", tone: "amber" },
  read: { label: "Okundu", tone: "grey" },
  answered: { label: "Yanıtlandı", tone: "green" },
};

const TYPE: Record<SupportMessageRecord["type"], string> = {
  iletisim: "İletişim formu",
  "urun-destek": "Ürün sorusu",
};

/**
 * MESAJLAR (Musteriler ve Servis; KARARLAR K-100)
 *
 * Iletisim formundan ve urun sayfasindaki destek sohbetinden gelen
 * sorular. Durum ve ic not kaydedilir; yanit e-postayla ayrica verilir.
 * Mesaj silinmez.
 */
/**
 * page: veritabani modunda sunucunun okudugu sayfa (50); demo modunda
 * verilmez, tarayicidaki kayitlar gosterilir (KARARLAR K-109). Tur ve sayfa
 * adreste durur.
 */
export function MessagesClient({ page }: { page?: CountedListPage<SupportMessageRecord> }) {
  const db = useDatabase();
  const list = useListQuery();
  const filter = messageListFilter(list.get);
  const data = page ?? messageListPage(listSupportMessages(db), filter);
  const [open, setOpen] = useState<string | null>(null);
  // Kayittan sonra detay yeniden kurulur (key: updatedAt); "Kaydedildi" bu yuzden burada tutulur.
  const [savedId, setSavedId] = useState<string | null>(null);
  const shown = data.rows;

  return (
    <>
      <AdminPageHeader
        title="Mesajlar"
        description={`${data.all} mesaj · ${data.newCount} yeni`}
      />

      <div className="mb-4 sm:w-64">
        <Select aria-label="Tür" value={filter.type ?? ""} onChange={(e) => list.go({ tur: e.target.value || undefined })}>
          <option value="">Bütün mesajlar</option>
          <option value="iletisim">{TYPE.iletisim}</option>
          <option value="urun-destek">{TYPE["urun-destek"]}</option>
        </Select>
      </div>

      <div
        className={`overflow-x-auto rounded-[4px] border border-zw-grey-200 bg-white transition-opacity ${list.pending ? "opacity-60" : ""}`}
        aria-busy={list.pending}
      >
        <table className="w-full text-sm">
          <thead className="bg-zw-grey-50 text-left text-xs uppercase tracking-wide text-zw-grey-600">
            <tr>
              <th className="px-4 py-3">Kimden</th>
              <th className="px-4 py-3">Tür</th>
              <th className="px-4 py-3">Konu / Ürün</th>
              <th className="px-4 py-3">Durum</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zw-grey-100">
            {shown.map((m) => (
              <Fragment key={m.id}>
                <tr className="cursor-pointer hover:bg-zw-grey-50" onClick={() => setOpen(open === m.id ? null : m.id)}>
                  <td className="px-4 py-2.5">
                    <div className="font-semibold">{m.name || m.email || m.phone}</div>
                    <div className="text-xs text-zw-grey-500">{formatDateTime(m.createdAt)}</div>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-zw-grey-600">{TYPE[m.type]}</td>
                  <td className="px-4 py-2.5">
                    {m.type === "urun-destek" ? (
                      <>
                        <div>{m.productName ?? "—"}</div>
                        {m.productSku && <div className="text-xs text-zw-grey-500">{m.productSku}</div>}
                      </>
                    ) : (
                      m.subject || "—"
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge tone={STATUS[m.status].tone}>{STATUS[m.status].label}</Badge>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <ChevronDown size={16} className={`inline transition-transform ${open === m.id ? "rotate-180" : ""}`} />
                  </td>
                </tr>
                {open === m.id && (
                  <tr className="bg-zw-grey-50">
                    <td colSpan={5} className="px-4 py-4">
                      <MessageDetail
                        key={m.updatedAt}
                        message={m}
                        saved={savedId === m.id}
                        onSaved={() => setSavedId(m.id)}
                        onEdit={() => setSavedId(null)}
                      />
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
            {shown.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-zw-grey-500">
                  {data.all === 0 ? "Henüz mesaj yok." : "Bu türde mesaj yok."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <ListPager page={data.page} total={data.total} hrefFor={(p) => list.hrefWith({ sayfa: p > 1 ? String(p) : undefined })} />
    </>
  );
}

function MessageDetail({
  message: m,
  saved,
  onSaved,
  onEdit,
}: {
  message: SupportMessageRecord;
  saved: boolean;
  onSaved: () => void;
  onEdit: () => void;
}) {
  const actions = useRequestActions();
  const [status, setStatus] = useState(m.status);
  const [note, setNote] = useState(m.adminNote ?? "");
  const [error, setError] = useState<string | null>(null);
  const save = async () => {
    setError(null);
    const answer = await actions.saveMessage(m, status, note.trim());
    if (answer.ok) onSaved();
    else setError(answer.error);
  };
  const row = (label: string, value?: React.ReactNode) => (
    <div className="grid grid-cols-[130px_1fr] gap-2">
      <dt className="text-zw-grey-500">{label}</dt>
      <dd>{value || "—"}</dd>
    </div>
  );
  const subject = m.type === "urun-destek" ? `Zenweld — ${m.productName ?? "ürün sorunuz"}` : `Zenweld — ${m.subject ?? "mesajınız"}`;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4 text-sm">
        <div>
          <div className="mb-1 text-xs font-bold uppercase tracking-wide text-zw-grey-600">Mesaj</div>
          <p className="whitespace-pre-line">{m.message}</p>
        </div>
        <dl className="space-y-1">
          {row("E-posta", m.email)}
          {row("Telefon", m.phone)}
          {m.pageUrl &&
            row(
              "Sayfa",
              <a href={m.pageUrl} target="_blank" rel="noreferrer" className="text-zw-red-700 hover:underline">
                {m.pageUrl}
              </a>,
            )}
        </dl>
      </div>
      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-[180px_1fr]">
          <Select
            aria-label="Durum"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as Status);
              onEdit();
            }}
          >
            {(Object.keys(STATUS) as Status[]).map((s) => (
              <option key={s} value={s}>
                {STATUS[s].label}
              </option>
            ))}
          </Select>
        </div>
        <Textarea
          value={note}
          onChange={(e) => {
            setNote(e.target.value);
            onEdit();
          }}
          placeholder="İç not (yalnızca panelde görünür)"
          className="min-h-20 bg-white"
        />
        <div className="flex items-center gap-3">
          <Button size="sm" disabled={actions.pending} onClick={() => void save()}>
            Kaydet
          </Button>
          {m.email && (
            <a
              href={`mailto:${m.email}?subject=${encodeURIComponent(subject)}`}
              className="text-sm font-semibold text-zw-red-700 hover:underline"
            >
              E-posta ile yanıtla
            </a>
          )}
          {saved && <span className="text-xs text-emerald-700">Kaydedildi</span>}
        </div>
        {error && <Alert tone="danger">{error}</Alert>}
      </div>
    </div>
  );
}
