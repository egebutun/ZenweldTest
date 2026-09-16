"use client";

import { useMemo, useState } from "react";
import { Download, Trash2 } from "lucide-react";
import type { Quote, QuoteStatus } from "@zenweld/data";
import { deleteQuote, downloadCsv, saveQuote, useDatabase } from "@zenweld/store";
import { Badge, Button, Input, Select, Textarea } from "@zenweld/ui";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { formatDateTime } from "@/lib/format";

const STATUS: { id: QuoteStatus; label: string; tone: "amber" | "grey" | "green" | "outline" }[] = [
  { id: "new", label: "Yeni", tone: "amber" },
  { id: "reviewing", label: "İnceleniyor", tone: "grey" },
  { id: "sent", label: "Teklif Gönderildi", tone: "green" },
  { id: "won", label: "Kazanıldı", tone: "green" },
  { id: "lost", label: "Kapandı", tone: "outline" },
];

const PAYMENT_LABEL: Record<string, string> = {
  vadeli: "Vadeli",
  cek: "Çek",
  havale: "Havale/EFT",
  belirsiz: "Görüşülecek",
};

export default function AdminQuotesPage() {
  const db = useDatabase();
  const [status, setStatus] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  const quotes = useMemo(
    () =>
      [...db.quotes]
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .filter((q) => !status || q.status === status),
    [db, status],
  );

  const update = (quote: Quote, patch: Partial<Quote>) => saveQuote({ ...quote, ...patch });

  return (
    <>
      <AdminPageHeader
        title="Teklifler"
        description={`${quotes.length} teklif talebi`}
        action={
          <Button
            variant="outline"
            leftIcon={<Download size={16} />}
            onClick={() =>
              downloadCsv(
                quotes.map((q) => ({
                  kod: q.code,
                  firma: q.companyName,
                  yetkili: q.contactName,
                  eposta: q.email,
                  telefon: q.phone,
                  sehir: q.city,
                  odeme: PAYMENT_LABEL[q.paymentPreference],
                  vade: q.termDays ?? "",
                  urunler: q.items.map((i) => `${i.quantity}x ${i.productName}`).join(" | "),
                  durum: STATUS.find((s) => s.id === q.status)?.label ?? q.status,
                  tarih: q.createdAt,
                })),
                "zenweld-teklifler.csv",
              )
            }
          >
            CSV İndir
          </Button>
        }
      />

      <div className="mb-4 sm:w-64">
        <Select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Tüm durumlar</option>
          {STATUS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-3">
        {quotes.map((q) => {
          const expanded = open === q.id;
          const statusMeta = STATUS.find((s) => s.id === q.status);
          return (
            <div key={q.id} className="rounded-[4px] border border-zw-grey-200 bg-white">
              <button
                onClick={() => setOpen(expanded ? null : q.id)}
                className="flex w-full flex-wrap items-center gap-3 px-5 py-4 text-left"
              >
                <span className="font-display text-lg font-bold">{q.code}</span>
                <Badge tone={statusMeta?.tone ?? "grey"}>{statusMeta?.label}</Badge>
                <Badge tone="outline">{PAYMENT_LABEL[q.paymentPreference]}</Badge>
                <span className="truncate text-sm font-semibold text-zw-grey-700">
                  {q.companyName}
                </span>
                <span className="ml-auto text-xs text-zw-grey-500">
                  {formatDateTime(q.createdAt, "tr")}
                </span>
              </button>

              {expanded && (
                <div className="border-t border-zw-grey-200 px-5 py-5">
                  <div className="grid gap-5 lg:grid-cols-2">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wide text-zw-grey-500">
                        Firma Bilgileri
                      </h3>
                      <dl className="mt-2 space-y-1 text-sm">
                        <div>
                          <dt className="inline text-zw-grey-500">Yetkili: </dt>
                          <dd className="inline font-semibold">{q.contactName}</dd>
                        </div>
                        <div>
                          <dt className="inline text-zw-grey-500">E-posta: </dt>
                          <dd className="inline font-semibold">{q.email}</dd>
                        </div>
                        <div>
                          <dt className="inline text-zw-grey-500">Telefon: </dt>
                          <dd className="inline font-semibold">{q.phone}</dd>
                        </div>
                        <div>
                          <dt className="inline text-zw-grey-500">Vergi No: </dt>
                          <dd className="inline font-semibold">{q.taxNumber || "—"}</dd>
                        </div>
                        <div>
                          <dt className="inline text-zw-grey-500">Şehir: </dt>
                          <dd className="inline font-semibold">{q.city}</dd>
                        </div>
                        {q.termDays && (
                          <div>
                            <dt className="inline text-zw-grey-500">Vade: </dt>
                            <dd className="inline font-semibold">{q.termDays} gün</dd>
                          </div>
                        )}
                      </dl>

                      <h3 className="mt-4 text-xs font-bold uppercase tracking-wide text-zw-grey-500">
                        Ürünler
                      </h3>
                      <ul className="mt-2 space-y-1 text-sm">
                        {q.items.map((i, idx) => (
                          <li key={idx}>
                            {i.quantity} × {i.productName}
                          </li>
                        ))}
                      </ul>

                      {q.message && (
                        <>
                          <h3 className="mt-4 text-xs font-bold uppercase tracking-wide text-zw-grey-500">
                            Müşteri Notu
                          </h3>
                          <p className="mt-1 text-sm text-zw-grey-600">{q.message}</p>
                        </>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zw-grey-600">
                          Durum
                        </label>
                        <Select
                          value={q.status}
                          onChange={(e) =>
                            update(q, { status: e.target.value as QuoteStatus })
                          }
                        >
                          {STATUS.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.label}
                            </option>
                          ))}
                        </Select>
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zw-grey-600">
                          Atanan Satış Temsilcisi
                        </label>
                        <Input
                          value={q.assignedTo ?? ""}
                          onChange={(e) => update(q, { assignedTo: e.target.value })}
                          placeholder="Örn. Satış – Mehmet B."
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zw-grey-600">
                          İç Not
                        </label>
                        <Textarea
                          value={q.adminNote ?? ""}
                          onChange={(e) => update(q, { adminNote: e.target.value })}
                        />
                      </div>
                      <div className="flex gap-2">
                        <a
                          href={`mailto:${q.email}?subject=${encodeURIComponent(`Zenweld Teklif ${q.code}`)}`}
                          className="inline-flex h-9 items-center rounded-[4px] bg-zw-ink px-4 text-sm font-semibold uppercase text-white hover:bg-zw-grey-800"
                        >
                          E-posta Gönder
                        </a>
                        <button
                          onClick={() => {
                            if (confirm(`${q.code} silinsin mi?`)) deleteQuote(q.id);
                          }}
                          className="inline-flex h-9 items-center gap-1.5 rounded-[4px] border border-zw-grey-300 px-3 text-sm font-semibold text-zw-grey-600 hover:border-zw-red-600 hover:text-zw-red-600"
                        >
                          <Trash2 size={15} /> Sil
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
