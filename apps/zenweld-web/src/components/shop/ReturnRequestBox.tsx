"use client";

import { useState } from "react";
import {
  canRequestReturn,
  returnableQuantities,
  returnDeadline,
  type Order,
  type ReturnReason,
  type ReturnRequest,
  type User,
} from "@zenweld/data";
import { createReturnRequest } from "@zenweld/store";
import { Alert, Badge, Button, FormRow, Select, Textarea } from "@zenweld/ui";
import { formatDate, formatDateTime } from "@zenweld/utils";
import { notifyZenweld } from "@/lib/notify";
import { useT } from "@/lib/i18n-client";

const STATUS_TONE: Record<ReturnRequest["status"], "amber" | "grey" | "green" | "red"> = {
  new: "amber",
  reviewing: "grey",
  approved: "green",
  rejected: "red",
};

/**
 * SIPARIS DETAYINDA IADE (CAYMA) TALEBI
 *
 * Siparisin iade talepleri ve durumlari; kurallar uygunsa (bireysel uye,
 * teslimden itibaren 14 gun, acik talep yok) yeni talep formu. Kurallar:
 * packages/data/src/returns.ts.
 */
export function ReturnRequestBox({ order, user, requests }: { order: Order; user: User; requests: ReturnRequest[] }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [quantities, setQuantities] = useState<number[]>(() => order.items.map(() => 0));
  const [reason, setReason] = useState<ReturnReason>("changed_mind");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<string | null>(null);

  const allowed = canRequestReturn(order, user.role, requests);
  if (!allowed && requests.length === 0 && !created) return null;
  const left = returnableQuantities(order, requests);
  const deadline = returnDeadline(order);

  const submit = () => {
    const items = order.items
      .map((item, line) => ({ ...item, line, quantity: quantities[line] }))
      .filter((item) => item.quantity > 0)
      .map(({ line, productId, productName, sku, variantLabel, quantity }) => ({
        line,
        productId,
        productName,
        sku,
        variantLabel,
        quantity,
      }));
    if (items.length === 0) {
      setError(t.returns.noItems);
      return;
    }
    const record = createReturnRequest({
      orderId: order.id,
      orderCode: order.code,
      userId: user.id,
      customerName: order.customerName,
      email: order.email,
      phone: order.phone,
      items,
      reason,
      note: note.trim() || undefined,
    });
    if (!record) {
      setError(t.returns.failed);
      return;
    }
    // Talep panelde Iade Talepleri'nde; info@zenweld.com'a da haber verilir.
    void notifyZenweld(
      "iade",
      {
        code: record.code,
        order: order.code,
        customer: order.customerName,
        email: order.email,
        phone: order.phone,
        items: items.map((i) => `${i.quantity} × ${i.productName}${i.variantLabel ? ` (${i.variantLabel})` : ""} — ${i.sku}`),
        reason: t.returns.reasons[reason],
        note: record.note,
      },
      "",
    );
    setCreated(record.code);
    setOpen(false);
    setError(null);
  };

  return (
    <section className="rounded-[4px] border border-zw-grey-200 p-5">
      <h3 className="mb-4 text-xs font-bold uppercase tracking-wide text-zw-grey-600">{t.returns.title}</h3>

      {created && (
        <div className="mb-4">
          <Alert tone="success">{t.returns.success.replace("{code}", created)}</Alert>
        </div>
      )}

      {requests.length > 0 && (
        <ul className="mb-4 divide-y divide-zw-grey-100 text-sm">
          {requests.map((r) => (
            <li key={r.id} className="py-2.5">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-semibold">{r.code}</span>
                <Badge tone={STATUS_TONE[r.status]}>{t.returns.status[r.status]}</Badge>
                <span className="ml-auto text-xs text-zw-grey-500">{formatDateTime(r.createdAt)}</span>
              </div>
              <div className="mt-1 text-zw-grey-600">
                {r.items.map((i) => `${i.quantity} × ${i.productName}${i.variantLabel ? ` — ${i.variantLabel}` : ""}`).join(", ")}
                {" · "}
                {t.returns.reasons[r.reason]}
              </div>
            </li>
          ))}
        </ul>
      )}

      {allowed && !open && (
        <div className="space-y-3">
          {deadline && (
            <p className="text-sm text-zw-grey-600">
              {t.returns.info.replace("{date}", formatDate(deadline.toISOString()))}
            </p>
          )}
          <Button type="button" variant="outline" onClick={() => setOpen(true)}>
            {t.returns.create}
          </Button>
        </div>
      )}

      {allowed && open && (
        <div className="space-y-4">
          {error && <Alert tone="danger">{error}</Alert>}
          <div>
            <div className="mb-2 text-sm font-semibold">{t.returns.selectItems}</div>
            <ul className="space-y-2 text-sm">
              {order.items.map((item, line) =>
                left[line] > 0 ? (
                  <li key={line} className="flex items-center justify-between gap-4">
                    <span>
                      {item.productName}
                      {item.variantLabel && <span className="text-zw-grey-500"> — {item.variantLabel}</span>}
                      <span className="block text-xs text-zw-grey-500">{item.sku}</span>
                    </span>
                    <Select
                      aria-label={`${t.returns.quantity}: ${item.productName}`}
                      className="w-24"
                      value={quantities[line]}
                      onChange={(e) => {
                        const next = [...quantities];
                        next[line] = Number(e.target.value);
                        setQuantities(next);
                      }}
                    >
                      {Array.from({ length: left[line] + 1 }, (_, n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </Select>
                  </li>
                ) : null,
              )}
            </ul>
          </div>
          <FormRow label={t.returns.reason} required htmlFor="return-reason">
            <Select id="return-reason" value={reason} onChange={(e) => setReason(e.target.value as ReturnReason)}>
              {(Object.keys(t.returns.reasons) as ReturnReason[]).map((key) => (
                <option key={key} value={key}>
                  {t.returns.reasons[key]}
                </option>
              ))}
            </Select>
          </FormRow>
          <FormRow label={t.returns.note} htmlFor="return-note">
            <Textarea id="return-note" value={note} onChange={(e) => setNote(e.target.value)} />
          </FormRow>
          <div className="flex gap-3">
            <Button type="button" onClick={submit}>
              {t.returns.submit}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              {t.returns.cancel}
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
