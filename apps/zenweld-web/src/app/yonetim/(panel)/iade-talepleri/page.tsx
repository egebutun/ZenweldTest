"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import type { ReturnReason, ReturnRequest, ReturnRequestStatus } from "@zenweld/data";
import { listReturnRequests, saveReturnRequest, useDatabase } from "@zenweld/store";
import { Alert, Badge, Button, Select, Textarea } from "@zenweld/ui";
import { formatDateTime } from "@zenweld/utils";
import { AdminPageHeader } from "@/components/admin/AdminShell";

const STATUS: Record<ReturnRequestStatus, { label: string; tone: "amber" | "grey" | "green" | "red" }> = {
  new: { label: "Yeni", tone: "amber" },
  reviewing: { label: "İnceleniyor", tone: "grey" },
  approved: { label: "Onaylandı", tone: "green" },
  rejected: { label: "Reddedildi", tone: "red" },
};

const REASON: Record<ReturnReason, string> = {
  changed_mind: "Vazgeçtim",
  defective: "Kusurlu ürün",
  wrong_item: "Yanlış ürün gönderildi",
  other: "Diğer",
};

/** IADE TALEPLERI — bireysel uyelerin Hesabim > Siparislerim'den actigi cayma talepleri. */
export default function AdminReturnRequestsPage() {
  const db = useDatabase();
  const requests = listReturnRequests(db);
  const [open, setOpen] = useState<string | null>(null);
  // Kayittan sonra detay yeniden kurulur (key: updatedAt); "Kaydedildi" bu yuzden burada tutulur.
  const [savedId, setSavedId] = useState<string | null>(null);

  return (
    <>
      <AdminPageHeader
        title="İade Talepleri"
        description={`${requests.length} talep · ${requests.filter((r) => r.status === "new").length} yeni`}
      />

      <div className="overflow-x-auto rounded-[4px] border border-zw-grey-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-zw-grey-50 text-left text-xs uppercase tracking-wide text-zw-grey-600">
            <tr>
              <th className="px-4 py-3">Talep</th>
              <th className="px-4 py-3">Sipariş</th>
              <th className="px-4 py-3">Müşteri</th>
              <th className="px-4 py-3">Ürünler</th>
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
                    <Link
                      href={`/yonetim/siparisler/${r.orderId}`}
                      onClick={(e) => e.stopPropagation()}
                      className="font-semibold text-zw-red-700 hover:underline"
                    >
                      {r.orderCode}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="font-semibold">{r.customerName}</div>
                    <div className="text-xs text-zw-grey-500">{r.email}</div>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-zw-grey-600">
                    {r.items.reduce((sum, i) => sum + i.quantity, 0)} adet
                  </td>
                  <td className="px-4 py-2.5 text-xs text-zw-grey-600">{REASON[r.reason]}</td>
                  <td className="px-4 py-2.5">
                    <Badge tone={STATUS[r.status].tone}>{STATUS[r.status].label}</Badge>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <ChevronDown size={16} className={`inline transition-transform ${open === r.id ? "rotate-180" : ""}`} />
                  </td>
                </tr>
                {open === r.id && (
                  <tr className="bg-zw-grey-50">
                    <td colSpan={7} className="px-4 py-4">
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
                <td colSpan={7} className="px-4 py-10 text-center text-zw-grey-500">
                  Henüz iade talebi yok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

function RequestDetail({
  request,
  saved,
  onSaved,
  onEdit,
}: {
  request: ReturnRequest;
  saved: boolean;
  onSaved: () => void;
  onEdit: () => void;
}) {
  const [status, setStatus] = useState(request.status);
  const [note, setNote] = useState(request.adminNote ?? "");

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4 text-sm">
        <div>
          <div className="mb-1 text-xs font-bold uppercase tracking-wide text-zw-grey-600">İade edilecek ürünler</div>
          <ul className="space-y-1">
            {request.items.map((i) => (
              <li key={i.line}>
                {i.quantity} × {i.productName}
                {i.variantLabel && <span className="text-zw-grey-500"> — {i.variantLabel}</span>}
                <span className="text-xs text-zw-grey-500"> ({i.sku})</span>
              </li>
            ))}
          </ul>
        </div>
        {request.note && (
          <div>
            <div className="mb-1 text-xs font-bold uppercase tracking-wide text-zw-grey-600">Müşterinin açıklaması</div>
            <p className="whitespace-pre-line">{request.note}</p>
          </div>
        )}
        <dl className="space-y-1">
          <div className="grid grid-cols-[130px_1fr] gap-2">
            <dt className="text-zw-grey-500">E-posta</dt>
            <dd>{request.email}</dd>
          </div>
          <div className="grid grid-cols-[130px_1fr] gap-2">
            <dt className="text-zw-grey-500">Telefon</dt>
            <dd>{request.phone}</dd>
          </div>
        </dl>
      </div>
      <div className="space-y-3">
        <Alert tone="info">
          Para iadesi panelden yapılmaz. Onaylanan talepte iadeyi banka ya da ödeme kuruluşu üzerinden ayrıca yapın.
        </Alert>
        <div className="grid gap-3 sm:grid-cols-[180px_1fr]">
          <Select
            aria-label="Durum"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as ReturnRequestStatus);
              onEdit();
            }}
          >
            {(Object.keys(STATUS) as ReturnRequestStatus[]).map((s) => (
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
          <Button
            size="sm"
            onClick={() => {
              if (saveReturnRequest({ ...request, status, adminNote: note.trim() || undefined })) onSaved();
            }}
          >
            Kaydet
          </Button>
          {saved && <span className="text-xs text-emerald-700">Kaydedildi</span>}
        </div>
      </div>
    </div>
  );
}
