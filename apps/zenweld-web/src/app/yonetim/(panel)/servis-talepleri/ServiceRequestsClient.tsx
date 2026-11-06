"use client";

import { Fragment, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { ServiceReason, ServiceRequest, ServiceRequestStatus } from "@zenweld/data";
import type { ServiceListPage } from "@zenweld/db";
import { listServiceRequests, useDatabase } from "@zenweld/store";
import { Alert, Badge, Button, Select, Textarea } from "@zenweld/ui";
import { formatDateTime } from "@zenweld/utils";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { ListPager, useListQuery } from "@/components/admin/ListControls";
import { pageParam, serviceListPage } from "@/lib/admin-lists";
import { useRequestActions } from "@/lib/admin-requests";

const STATUS: Record<ServiceRequestStatus, { label: string; tone: "amber" | "grey" | "green" }> = {
  new: { label: "Yeni", tone: "amber" },
  in_progress: { label: "İşlemde", tone: "grey" },
  done: { label: "Tamamlandı", tone: "green" },
};

const REASON: Record<ServiceReason, string> = {
  kurulum: "Kurulum",
  bakim: "Bakım",
  onarim: "Onarım",
  egitim: "Kullanım/Bakım Eğitimi",
};

/**
 * SERVIS TALEPLERI — sitedeki Servis Talebi formundan gelenler. Veritabani
 * modunda kayit sunucuya yazilir. Sayfa basina 50 talep; veritabani modunda
 * sunucu yalnizca bu sayfayi okur (page prop).
 */
export function ServiceRequestsClient({ page }: { page?: ServiceListPage }) {
  const db = useDatabase();
  const list = useListQuery();
  const data = page ?? serviceListPage(listServiceRequests(db), pageParam(list.get));
  const requests = data.rows;
  const [open, setOpen] = useState<string | null>(null);
  // Kayittan sonra detay yeniden kurulur (key: updatedAt); "Kaydedildi" bu yuzden burada tutulur.
  const [savedId, setSavedId] = useState<string | null>(null);
  const category = (slug: string) => db.categories.find((c) => c.slug === slug)?.name ?? slug;

  return (
    <>
      <AdminPageHeader
        title="Servis Talepleri"
        description={`${data.total} talep · ${data.newCount} yeni`}
      />

      <div
        className={`overflow-x-auto rounded-[4px] border border-zw-grey-200 bg-white transition-opacity ${list.pending ? "opacity-60" : ""}`}
        aria-busy={list.pending}
      >
        <table className="w-full text-sm">
          <thead className="bg-zw-grey-50 text-left text-xs uppercase tracking-wide text-zw-grey-600">
            <tr>
              <th className="px-4 py-3">Talep</th>
              <th className="px-4 py-3">Firma / Şahıs</th>
              <th className="px-4 py-3">Makine</th>
              <th className="px-4 py-3">Neden</th>
              <th className="px-4 py-3">Durum</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zw-grey-100">
            {requests.map((r) => (
              <Fragment key={r.id}>
                <tr className="cursor-pointer hover:bg-zw-grey-50" onClick={() => setOpen(open === r.id ? null : r.id)}>
                  <td className="px-4 py-2.5">
                    <div className="font-semibold">{r.code}</div>
                    <div className="text-xs text-zw-grey-500">{formatDateTime(r.createdAt)}</div>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="font-semibold">{r.companyName}</div>
                    <div className="text-xs text-zw-grey-500">
                      {r.district} / {r.city}
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <div>{r.productName}</div>
                    <div className="text-xs text-zw-grey-500">{category(r.categorySlug)}</div>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-zw-grey-600">{r.reasons.map((x) => REASON[x]).join(", ")}</td>
                  <td className="px-4 py-2.5">
                    <Badge tone={STATUS[r.status].tone}>{STATUS[r.status].label}</Badge>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <ChevronDown size={16} className={`inline transition-transform ${open === r.id ? "rotate-180" : ""}`} />
                  </td>
                </tr>
                {open === r.id && (
                  <tr className="bg-zw-grey-50">
                    <td colSpan={6} className="px-4 py-4">
                      <RequestDetail
                        key={r.updatedAt}
                        request={r}
                        saved={savedId === r.id}
                        onSaved={() => setSavedId(r.id)}
                        onEdit={() => setSavedId(null)}
                      />
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
            {requests.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-zw-grey-500">
                  Henüz servis talebi yok.
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

function RequestDetail({
  request,
  saved,
  onSaved,
  onEdit,
}: {
  request: ServiceRequest;
  saved: boolean;
  onSaved: () => void;
  onEdit: () => void;
}) {
  const actions = useRequestActions();
  const [status, setStatus] = useState(request.status);
  const [note, setNote] = useState(request.adminNote ?? "");
  const [error, setError] = useState<string | null>(null);
  const save = async () => {
    setError(null);
    const answer = await actions.saveServiceRequest(request, status, note.trim());
    if (answer.ok) onSaved();
    else setError(answer.error);
  };
  const row = (label: string, value: string) => (
    <div className="grid grid-cols-[130px_1fr] gap-2">
      <dt className="text-zw-grey-500">{label}</dt>
      <dd>{value}</dd>
    </div>
  );

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4 text-sm">
        <div>
          <div className="mb-1 text-xs font-bold uppercase tracking-wide text-zw-grey-600">Müşteri şikayeti</div>
          <p className="whitespace-pre-line">{request.complaint}</p>
        </div>
        <dl className="space-y-1">
          {row("Adres", `${request.address}, ${request.district} / ${request.city}`)}
          {row("E-posta", request.email)}
          {row("Telefon", request.phone)}
          {row("Yetkili kişi", request.contactName)}
          {row("Yetkili GSM", request.contactGsm)}
        </dl>
      </div>
      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-[180px_1fr]">
          <Select
            aria-label="Durum"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as ServiceRequestStatus);
              onEdit();
            }}
          >
            {(Object.keys(STATUS) as ServiceRequestStatus[]).map((s) => (
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
          {saved && <span className="text-xs text-emerald-700">Kaydedildi</span>}
        </div>
        {error && <Alert tone="danger">{error}</Alert>}
      </div>
    </div>
  );
}
