"use client";

import { Fragment, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { CountedListPage, DealerApplicationRecord } from "@zenweld/db";
import { listDealerApplications, useDatabase } from "@zenweld/store";
import { Alert, Badge, Button, Select, Textarea } from "@zenweld/ui";
import { formatDateTime } from "@zenweld/utils";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { ListPager, useListQuery } from "@/components/admin/ListControls";
import { dealerApplicationListPage, pageParam } from "@/lib/admin-lists";
import { useRequestActions } from "@/lib/admin-requests";

type Status = DealerApplicationRecord["status"];

const STATUS: Record<Status, { label: string; tone: "amber" | "grey" | "green" | "red" }> = {
  new: { label: "Yeni", tone: "amber" },
  reviewing: { label: "İnceleniyor", tone: "grey" },
  approved: { label: "Onaylandı", tone: "green" },
  rejected: { label: "Reddedildi", tone: "red" },
};

const yesNo = (value?: boolean) => (value === undefined ? "—" : value ? "Evet" : "Hayır");

/**
 * BAYILIK BASVURULARI (Bayi ve Satis Agi; KARARLAR K-100)
 *
 * Sitedeki "Bayimiz Olun" formundan gelenler. Durum ve ic not kaydedilir;
 * basvuru silinmez. Onaylanan basvurunun bayi kaydi Bayiler ekranindan
 * ayrica acilir.
 */
/**
 * page: veritabani modunda sunucunun okudugu sayfa (50); demo modunda
 * verilmez, tarayicidaki kayitlar gosterilir (KARARLAR K-109).
 */
export function DealerApplicationsClient({ page }: { page?: CountedListPage<DealerApplicationRecord> }) {
  const db = useDatabase();
  const list = useListQuery();
  const data = page ?? dealerApplicationListPage(listDealerApplications(db), pageParam(list.get));
  const applications = data.rows;
  const [open, setOpen] = useState<string | null>(null);
  // Kayittan sonra detay yeniden kurulur (key: updatedAt); "Kaydedildi" bu yuzden burada tutulur.
  const [savedId, setSavedId] = useState<string | null>(null);

  return (
    <>
      <AdminPageHeader
        title="Bayilik Başvuruları"
        description={`${data.all} başvuru · ${data.newCount} yeni`}
      />

      <div
        className={`overflow-x-auto rounded-[4px] border border-zw-grey-200 bg-white transition-opacity ${list.pending ? "opacity-60" : ""}`}
        aria-busy={list.pending}
      >
        <table className="w-full text-sm">
          <thead className="bg-zw-grey-50 text-left text-xs uppercase tracking-wide text-zw-grey-600">
            <tr>
              <th className="px-4 py-3">Firma</th>
              <th className="px-4 py-3">Yetkili</th>
              <th className="px-4 py-3">Şehir</th>
              <th className="px-4 py-3">Durum</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zw-grey-100">
            {applications.map((a) => (
              <Fragment key={a.id}>
                <tr className="cursor-pointer hover:bg-zw-grey-50" onClick={() => setOpen(open === a.id ? null : a.id)}>
                  <td className="px-4 py-2.5">
                    <div className="font-semibold">{a.companyName}</div>
                    <div className="text-xs text-zw-grey-500">{formatDateTime(a.createdAt)}</div>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="font-semibold">{a.contactName ?? "—"}</div>
                    <div className="text-xs text-zw-grey-500">{a.email}</div>
                  </td>
                  <td className="px-4 py-2.5 text-zw-grey-600">{a.city ?? "—"}</td>
                  <td className="px-4 py-2.5">
                    <Badge tone={STATUS[a.status].tone}>{STATUS[a.status].label}</Badge>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <ChevronDown size={16} className={`inline transition-transform ${open === a.id ? "rotate-180" : ""}`} />
                  </td>
                </tr>
                {open === a.id && (
                  <tr className="bg-zw-grey-50">
                    <td colSpan={5} className="px-4 py-4">
                      <ApplicationDetail
                        key={a.updatedAt}
                        application={a}
                        saved={savedId === a.id}
                        onSaved={() => setSavedId(a.id)}
                        onEdit={() => setSavedId(null)}
                      />
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
            {applications.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-zw-grey-500">
                  Henüz bayilik başvurusu yok.
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

function ApplicationDetail({
  application: a,
  saved,
  onSaved,
  onEdit,
}: {
  application: DealerApplicationRecord;
  saved: boolean;
  onSaved: () => void;
  onEdit: () => void;
}) {
  const actions = useRequestActions();
  const [status, setStatus] = useState(a.status);
  const [note, setNote] = useState(a.adminNote ?? "");
  const [error, setError] = useState<string | null>(null);
  const save = async () => {
    setError(null);
    const answer = await actions.saveApplication(a, status, note.trim());
    if (answer.ok) onSaved();
    else setError(answer.error);
  };
  const row = (label: string, value?: string) => (
    <div className="grid grid-cols-[150px_1fr] gap-2">
      <dt className="text-zw-grey-500">{label}</dt>
      <dd>{value || "—"}</dd>
    </div>
  );

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4 text-sm">
        <dl className="space-y-1">
          {row("Vergi dairesi / no", a.taxInfo)}
          {row("Faaliyet alanı", a.sector)}
          {row("Sektördeki yıl", a.yearsInSector)}
          {row("Çalıştığı markalar", a.brands)}
          {row("Showroom var mı", yesNo(a.hasShowroom))}
          {row("Servis kabiliyeti", yesNo(a.hasService))}
          {row("E-posta", a.email)}
          {row("Telefon", a.phone)}
        </dl>
        {a.message && (
          <div>
            <div className="mb-1 text-xs font-bold uppercase tracking-wide text-zw-grey-600">Not</div>
            <p className="whitespace-pre-line">{a.message}</p>
          </div>
        )}
      </div>
      <div className="space-y-3">
        <Alert tone="info">Başvuru onaylanınca bayi kaydını Bayiler ekranından açın.</Alert>
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
          <a
            href={`mailto:${a.email}?subject=${encodeURIComponent(`Zenweld bayilik başvurunuz — ${a.companyName}`)}`}
            className="text-sm font-semibold text-zw-red-700 hover:underline"
          >
            E-posta gönder
          </a>
          {saved && <span className="text-xs text-emerald-700">Kaydedildi</span>}
        </div>
        {error && <Alert tone="danger">{error}</Alert>}
      </div>
    </div>
  );
}
