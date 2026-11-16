"use client";

import { Fragment, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  SERVICE_REASON_LABELS,
  SERVICE_STATUS_LABELS,
  SERVICE_STATUS_LIST,
  serviceCandidates,
  serviceCustomerMail,
  serviceMatchText,
  serviceNoticeMail,
  type Dealer,
  type ServiceCandidate,
  type ServiceRequest,
  type ServiceRequestStatus,
} from "@zenweld/data";
import type { ServiceListPage } from "@zenweld/db";
import { listServiceRequests, useDatabase } from "@zenweld/store";
import { Alert, Badge, Button, Select, Textarea } from "@zenweld/ui";
import { formatDateTime } from "@zenweld/utils";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { RecordEmails, type EmailTemplate } from "@/components/admin/EmailParts";
import { ListPager, useListQuery } from "@/components/admin/ListControls";
import { pageParam, serviceListPage } from "@/lib/admin-lists";
import { useRequestActions } from "@/lib/admin-requests";

const STATUS_TONE: Record<ServiceRequestStatus, "amber" | "grey" | "green"> = {
  new: "amber",
  assigned: "grey",
  done: "green",
};

/**
 * SERVIS TALEPLERI — sitedeki Servis Talebi formundan gelenler. Veritabani
 * modunda kayit sunucuya yazilir. Sayfa basina 50 talep; veritabani modunda
 * sunucu yalnizca bu sayfayi okur (page prop). Talebin yazismalari ve
 * "E-posta gönder" detayin altindadir (KARARLAR K-116).
 *
 * Yetkili servis (KARARLAR K-117): en yakin servis onerilir (ayni ilce, ayni
 * il, sonra il merkezine kus ucusu); yonetici baska servis secebilir. Servise
 * once kisisel bilgi icermeyen talep bildirimi gider; servis ustlenince durum
 * "Yetkili servis atandı" yapilir ve musteri bilgileri gonderilir.
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
  const dealerName = (id?: string) => (id ? db.dealers.find((d) => d.id === id)?.name : undefined);

  return (
    <>
      <AdminPageHeader
        title="Servis Talepleri"
        description={`${data.total} talep · ${data.newCount} yetkili servis ataması bekliyor`}
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
                  <td className="px-4 py-2.5 text-xs text-zw-grey-600">{r.reasons.map((x) => SERVICE_REASON_LABELS[x]).join(", ")}</td>
                  <td className="px-4 py-2.5">
                    <Badge tone={STATUS_TONE[r.status]}>{SERVICE_STATUS_LABELS[r.status]}</Badge>
                    {dealerName(r.serviceDealerId) && <div className="mt-1 text-xs text-zw-grey-500">{dealerName(r.serviceDealerId)}</div>}
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
                        dealers={db.dealers}
                        categoryName={db.categories.find((c) => c.slug === r.categorySlug)?.name}
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
  dealers,
  categoryName,
  saved,
  onSaved,
  onEdit,
}: {
  request: ServiceRequest;
  dealers: Dealer[];
  categoryName?: string;
  saved: boolean;
  onSaved: () => void;
  onEdit: () => void;
}) {
  const actions = useRequestActions();
  // Yakindan uzaga yayindaki yetkili servisler; ilki onerilen servis.
  const candidates = useMemo(() => serviceCandidates(request, dealers), [request, dealers]);
  const suggestion = candidates[0];
  // Kayitli servis artik yayinda degilse (ya da yetkili servis degilse) listede yine gorunur.
  const assigned = request.serviceDealerId ? dealers.find((d) => d.id === request.serviceDealerId) : undefined;
  const options: ServiceCandidate[] =
    assigned && !candidates.some((c) => c.dealer.id === assigned.id)
      ? [...candidates, ...serviceCandidates(request, [{ ...assigned, active: true, badges: ["yetkili-servis"] }])]
      : candidates;
  const [status, setStatus] = useState(request.status);
  const [dealerId, setDealerId] = useState(request.serviceDealerId ?? suggestion?.dealer.id ?? "");
  const [note, setNote] = useState(request.adminNote ?? "");
  const [error, setError] = useState<string | null>(null);
  const selected = options.find((c) => c.dealer.id === dealerId);

  const save = async () => {
    setError(null);
    const answer = await actions.saveServiceRequest(
      request,
      { status, serviceDealerId: dealerId || undefined, adminNote: note.trim() },
      dealers,
    );
    if (answer.ok) onSaved();
    else setError(answer.error);
  };
  const row = (label: string, value: string) => (
    <div className="grid grid-cols-[130px_1fr] gap-2">
      <dt className="text-zw-grey-500">{label}</dt>
      <dd>{value}</dd>
    </div>
  );

  // Servise iki hazir e-posta: talep bildirimi (kisisel bilgi yok) ve servis
  // ustlenince musteri bilgileri (kayitli durum "atandı" ya da "tamamlandı").
  const savedService = request.status !== "new" ? options.find((c) => c.dealer.id === request.serviceDealerId) : undefined;
  const noEmail = "Servisin e-posta adresi yok; Bayi ve Satış Ağı › Bayiler'den ekleyin.";
  const templates: EmailTemplate[] = [
    {
      label: "Servise talep bildirimi",
      draft: { to: selected?.dealer.email ?? "", ...(selected ? serviceNoticeMail(request, selected, categoryName) : { subject: "", body: "" }) },
      disabled: !selected ? "Önce yetkili servisi seçin." : !selected.dealer.email ? noEmail : undefined,
    },
    {
      label: "Servise müşteri bilgileri",
      draft: {
        to: savedService?.dealer.email ?? "",
        ...(savedService ? serviceCustomerMail(request, savedService.dealer, categoryName) : { subject: "", body: "" }),
      },
      disabled: !savedService
        ? "Servis talebi üstlenince gönderilir; önce durumu “Yetkili servis atandı” yapıp kaydedin."
        : !savedService.dealer.email
          ? noEmail
          : undefined,
    },
  ];

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
        <div data-yetkili-servis className="space-y-2 rounded-[4px] border border-zw-grey-200 bg-white p-3 text-sm">
          <div className="text-xs font-bold uppercase tracking-wide text-zw-grey-600">Yetkili servis</div>
          {suggestion ? (
            <p data-onerilen>
              Önerilen: <span className="font-semibold">{suggestion.dealer.name}</span> — {suggestion.dealer.district} /{" "}
              {suggestion.dealer.city} · {serviceMatchText(suggestion)}
            </p>
          ) : (
            <p className="text-zw-grey-500">Yayında yetkili servis yok (Bayiler’de “Yetkili Servis” türü).</p>
          )}
          <Select
            aria-label="Yetkili servis"
            value={dealerId}
            onChange={(e) => {
              setDealerId(e.target.value);
              onEdit();
            }}
          >
            <option value="">Seçilmedi</option>
            {options.map((c) => (
              <option key={c.dealer.id} value={c.dealer.id}>
                {c.dealer.name} — {c.dealer.district} / {c.dealer.city} ({serviceMatchText(c)})
              </option>
            ))}
          </Select>
          {selected && (
            <p className="text-xs text-zw-grey-500">
              {selected.dealer.phone}
              {selected.dealer.email ? ` · ${selected.dealer.email}` : " · e-posta adresi yok"}
            </p>
          )}
        </div>
        <Select
          aria-label="Durum"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as ServiceRequestStatus);
            onEdit();
          }}
        >
          {SERVICE_STATUS_LIST.map((s) => (
            <option key={s} value={s}>
              {SERVICE_STATUS_LABELS[s]}
            </option>
          ))}
        </Select>
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
      <div className="lg:col-span-2">
        <RecordEmails
          emailType="servis"
          entity={{ type: "service_requests", id: request.id }}
          to={request.email}
          subject={`Servis talebiniz ${request.code} hakkında`}
          templates={templates}
        />
      </div>
    </div>
  );
}
