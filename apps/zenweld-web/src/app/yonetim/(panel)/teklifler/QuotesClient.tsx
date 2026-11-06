"use client";

import { useState } from "react";
import { Download, Trash2 } from "lucide-react";
import type { Quote, QuoteStatus } from "@zenweld/data";
import { listQuotes, useDatabase } from "@zenweld/store";
import { Alert, Badge, Button, FormRow, Input, Select, Textarea } from "@zenweld/ui";
import { formatDateTime, type ListPage } from "@zenweld/utils";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { ListPager, downloadListCsv, useListQuery } from "@/components/admin/ListControls";
import { PAYMENT_LABEL, QUOTE_STATUS_LABEL, quoteCsvRows } from "@/lib/admin-csv";
import { matchingQuotes, quoteListFilter, quoteListPage } from "@/lib/admin-lists";
import { useRequestActions, type PanelAnswer } from "@/lib/admin-requests";

const STATUS: { id: QuoteStatus; label: string; tone: "amber" | "grey" | "green" | "outline" }[] = [
  { id: "new", label: QUOTE_STATUS_LABEL.new, tone: "amber" },
  { id: "reviewing", label: QUOTE_STATUS_LABEL.reviewing, tone: "grey" },
  { id: "sent", label: QUOTE_STATUS_LABEL.sent, tone: "green" },
  { id: "won", label: QUOTE_STATUS_LABEL.won, tone: "green" },
  { id: "lost", label: QUOTE_STATUS_LABEL.lost, tone: "outline" },
];

/**
 * TEKLIFLER — Teklif Al formundan gelenler. Veritabani modunda islemler
 * sunucuya yazilir (lib/admin-requests.ts). Sayfa basina 50 teklif; durum ve
 * sayfa adreste durur. Veritabani modunda sunucu yalnizca bu sayfayi okur
 * (page prop); CSV suzgece uyan tekliflerin tamamini indirir.
 */
export function QuotesClient({ page }: { page?: ListPage<Quote> }) {
  const db = useDatabase();
  const actions = useRequestActions();
  const list = useListQuery();
  const filter = quoteListFilter(list.get);
  const [open, setOpen] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Bayilerin teklifleri burada yok: Zenweld - bayi isleri ileride B2B uygulamasinda.
  const data = page ?? quoteListPage(listQuotes(db), filter);
  const quotes = data.rows;

  const exportCsv = async () => {
    setError(null);
    const failed = await downloadListCsv(
      "zenweld-teklifler.csv",
      page ? { list: "teklifler", query: list.query } : { rows: quoteCsvRows(matchingQuotes(listQuotes(db), filter)) },
    );
    if (failed) setError(failed);
  };

  const run = async (action: Promise<PanelAnswer>) => {
    setError(null);
    const answer = await action;
    if (!answer.ok) setError(answer.error);
  };
  const update = (quote: Quote, patch: Partial<Pick<Quote, "status" | "assignedTo" | "adminNote">>) =>
    void run(actions.saveQuote(quote, patch));

  return (
    <>
      <AdminPageHeader
        title="Teklifler"
        description={`${data.total} teklif talebi`}
        action={
          <Button variant="outline" leftIcon={<Download size={16} />} onClick={() => void exportCsv()}>
            CSV İndir
          </Button>
        }
      />

      {error && (
        <div className="mb-4">
          <Alert tone="danger">{error}</Alert>
        </div>
      )}

      <div className="mb-4 sm:w-64">
        <Select value={filter.status ?? ""} onChange={(e) => list.go({ durum: e.target.value || undefined })}>
          <option value="">Tüm durumlar</option>
          {STATUS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </Select>
      </div>

      <div className={`space-y-3 transition-opacity ${list.pending ? "opacity-60" : ""}`} aria-busy={list.pending}>
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
                  {q.companyName || q.contactName}
                </span>
                <span className="ml-auto text-xs text-zw-grey-500">
                  {formatDateTime(q.createdAt)}
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
                            {i.variantLabel && <span className="text-zw-grey-500"> — {i.variantLabel}</span>}
                            {i.sku && <span className="text-xs text-zw-grey-400"> ({i.sku})</span>}
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
                      <FormRow label="Durum">
                        <Select
                          value={q.status}
                          disabled={actions.pending}
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
                      </FormRow>
                      <FormRow label="Atanan Satış Temsilcisi">
                        {/* Her harfte tum veriyi yazmamak icin alandan cikinca kaydedilir. */}
                        <Input
                          defaultValue={q.assignedTo ?? ""}
                          onBlur={(e) => e.target.value !== (q.assignedTo ?? "") && update(q, { assignedTo: e.target.value })}
                          placeholder="Örn. Satış – Mehmet B."
                        />
                      </FormRow>
                      <FormRow label="İç Not">
                        <Textarea
                          defaultValue={q.adminNote ?? ""}
                          onBlur={(e) => e.target.value !== (q.adminNote ?? "") && update(q, { adminNote: e.target.value })}
                        />
                      </FormRow>
                      <div className="flex gap-2">
                        <a
                          href={`mailto:${q.email}?subject=${encodeURIComponent(`Zenweld Teklif ${q.code}`)}`}
                          className="inline-flex h-9 items-center rounded-[4px] bg-zw-ink px-4 text-sm font-semibold uppercase text-white hover:bg-zw-grey-800"
                        >
                          E-posta Gönder
                        </a>
                        <button
                          onClick={() => {
                            if (confirm(`${q.code} silinsin mi?`)) void run(actions.deleteQuote(q));
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
      <ListPager page={data.page} total={data.total} hrefFor={(p) => list.hrefWith({ sayfa: p > 1 ? String(p) : undefined })} />
    </>
  );
}
