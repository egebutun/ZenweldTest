"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { CARD_PROGRAMS, INSTALLMENT_COUNTS, type CardProgram, type PaymentPos } from "@zenweld/data";
import { uid } from "@zenweld/store";
import { Alert, Button, Checkbox, FormRow, Input, Modal, Select } from "@zenweld/ui";

/**
 * KARTLA TAKSIT — banka POS'lari
 *
 * Her banka POS'unun kendi taksitleri (musteriye vade farki) ve firma
 * taksit oranlari (bankanin Zenweld'den kestigi komisyon) vardir. Odeme
 * sayfasinda kart, programi eslesen ilk aktif POS'tan cekilir; eslesmeyen
 * kartlar varsayilan POS'tan tek cekim (packages/data/src/checkout.ts).
 *
 * Degisiklikler sayfanin taslagina yazilir; sayfadaki Kaydet ile saklanir.
 */
export function PaymentPosSettings({ pos, onChange }: { pos: PaymentPos[]; onChange: (pos: PaymentPos[]) => void }) {
  const [editing, setEditing] = useState<PaymentPos | "new" | null>(null);
  const [rates, setRates] = useState<{ pos: PaymentPos; kind: "customer" | "firm" } | null>(null);

  const update = (id: string, patch: Partial<PaymentPos>) => onChange(pos.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  const hasDefault = pos.some((p) => p.active && p.isDefault);
  // Ayni programda listede ustte aktif POS varsa bu POS kullanilmaz.
  const shadowed = (p: PaymentPos, index: number) =>
    Boolean(p.program) && pos.slice(0, index).some((o) => o.active && o.program === p.program);

  const savePos = (record: PaymentPos) => {
    const list = pos.some((p) => p.id === record.id) ? pos.map((p) => (p.id === record.id ? record : p)) : [...pos, record];
    // Varsayilan POS tektir.
    onChange(record.isDefault ? list.map((p) => (p.id === record.id ? p : { ...p, isDefault: false })) : list);
    setEditing(null);
  };

  return (
    <>
      {!hasDefault && (
        <div className="mb-3">
          <Alert tone="warning">
            Aktif varsayılan POS yok: kart programı eşleşmeyen kartlarla ödeme alınamaz. Bir POS'u düzenleyip
            “Diğer kartlar için varsayılan” işaretleyin.
          </Alert>
        </div>
      )}

      <div className="overflow-x-auto rounded-[4px] border border-zw-grey-200">
        <table className="w-full text-sm">
          <thead className="bg-zw-grey-50 text-left text-xs uppercase tracking-wide text-zw-grey-600">
            <tr>
              <th className="px-3 py-2.5">Düzenle</th>
              <th className="px-3 py-2.5">Aktif</th>
              <th className="px-3 py-2.5">Banka</th>
              <th className="px-3 py-2.5">Banka adı</th>
              <th className="px-3 py-2.5">Mağaza no</th>
              <th className="px-3 py-2.5">POS adı</th>
              <th className="px-3 py-2.5">Firma taksit oranları</th>
              <th className="px-3 py-2.5">Taksit oranları</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zw-grey-100">
            {pos.map((p, i) => (
              <tr key={p.id} className={p.active ? "" : "text-zw-grey-400"}>
                <td className="px-3 py-2">
                  <Button size="sm" variant="outline" leftIcon={<Pencil size={14} />} onClick={() => setEditing(p)}>
                    Düzenle
                  </Button>
                </td>
                <td className="px-3 py-2">
                  <input
                    type="checkbox"
                    checked={p.active}
                    onChange={(e) => update(p.id, { active: e.target.checked })}
                    aria-label={`${p.name} aktif`}
                    className="h-4 w-4 accent-zw-red-600"
                  />
                </td>
                <td className="px-3 py-2">
                  <span className="whitespace-nowrap rounded-full bg-zw-grey-100 px-2.5 py-1 text-xs font-bold text-zw-ink">
                    {p.bankShortName}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <div className="whitespace-nowrap font-semibold">{p.name}</div>
                  <div className="text-xs text-zw-grey-500">{p.program ? `Program: ${p.program}` : "Kart programı yok"}</div>
                  {p.isDefault && <div className="text-xs text-zw-grey-500">Varsayılan · diğer kartlar tek çekim</div>}
                  {p.active && shadowed(p, i) && (
                    <div className="text-xs text-amber-700">Kullanılmıyor: aynı programda üstte aktif POS var</div>
                  )}
                </td>
                <td className="px-3 py-2 tabular-nums">{p.merchantNo || "—"}</td>
                <td className="px-3 py-2">{p.posName || "—"}</td>
                <td className="px-3 py-2">
                  <Button size="sm" variant="outline" onClick={() => setRates({ pos: p, kind: "firm" })}>
                    Göster
                  </Button>
                </td>
                <td className="px-3 py-2">
                  <Button size="sm" variant="outline" onClick={() => setRates({ pos: p, kind: "customer" })}>
                    Göster
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Button variant="outline" size="sm" className="mt-3" leftIcon={<Plus size={15} />} onClick={() => setEditing("new")}>
        POS Ekle
      </Button>

      {editing && (
        <PosForm
          key={editing === "new" ? "new" : editing.id}
          initial={editing === "new" ? undefined : editing}
          onSave={savePos}
          onDelete={
            editing === "new"
              ? undefined
              : () => {
                  onChange(pos.filter((x) => x.id !== editing.id));
                  setEditing(null);
                }
          }
          onClose={() => setEditing(null)}
        />
      )}
      {rates && (
        <RatesModal
          key={`${rates.pos.id}-${rates.kind}`}
          pos={rates.pos}
          kind={rates.kind}
          onSave={(patch) => {
            update(rates.pos.id, patch);
            setRates(null);
          }}
          onClose={() => setRates(null)}
        />
      )}
    </>
  );
}

/** Yeni POS ya da duzenleme: banka bilgileri, program, varsayilan. */
function PosForm({
  initial,
  onSave,
  onDelete,
  onClose,
}: {
  initial?: PaymentPos;
  onSave: (pos: PaymentPos) => void;
  onDelete?: () => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<PaymentPos>(
    () =>
      initial ?? {
        id: uid("pos"),
        bankShortName: "",
        name: "",
        merchantNo: "",
        posName: "",
        active: true,
        isDefault: false,
        installments: INSTALLMENT_COUNTS.map((count) => ({ count, ratePercent: 0, enabled: false })),
        commissions: [],
      },
  );
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof PaymentPos>(key: K, value: PaymentPos[K]) => setDraft((d) => ({ ...d, [key]: value }));

  return (
    <Modal open onClose={onClose} title={initial ? "POS'u Düzenle" : "POS Ekle"}>
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormRow label="Banka (etiket)" required hint="Listede logo yerine görünen kısa ad">
            <Input value={draft.bankShortName} onChange={(e) => set("bankShortName", e.target.value)} placeholder="Garanti" />
          </FormRow>
          <FormRow label="Banka adı" required>
            <Input value={draft.name} onChange={(e) => set("name", e.target.value)} placeholder="Garanti Bonus" />
          </FormRow>
          <FormRow label="Kart programı" hint="Bu programdaki kartlar bu POS'un taksitleriyle çekilir">
            <Select
              value={draft.program ?? ""}
              onChange={(e) => set("program", (e.target.value || undefined) as CardProgram | undefined)}
            >
              <option value="">Yok (yalnızca tek çekim)</option>
              {CARD_PROGRAMS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </Select>
          </FormRow>
          <FormRow label="Mağaza no" hint="Bankanın verdiği üye işyeri numarası">
            <Input value={draft.merchantNo} onChange={(e) => set("merchantNo", e.target.value)} />
          </FormRow>
          <FormRow label="POS adı">
            <Input value={draft.posName} onChange={(e) => set("posName", e.target.value)} />
          </FormRow>
        </div>
        <Checkbox label="Aktif" checked={draft.active} onChange={(e) => set("active", e.target.checked)} />
        <Checkbox
          label="Diğer kartlar için varsayılan: kart programı eşleşmeyen kartlar bu POS'tan tek çekim ödenir"
          checked={draft.isDefault}
          onChange={(e) => set("isDefault", e.target.checked)}
        />
        {error && <Alert tone="danger">{error}</Alert>}
        <div className="flex gap-3 pt-1">
          <Button
            onClick={() => {
              if (!draft.bankShortName.trim() || !draft.name.trim()) return setError("Banka etiketi ve banka adı zorunludur.");
              onSave({ ...draft, bankShortName: draft.bankShortName.trim(), name: draft.name.trim(), posName: draft.posName.trim() });
            }}
          >
            Uygula
          </Button>
          <Button variant="outline" onClick={onClose}>
            Vazgeç
          </Button>
          {onDelete && (
            <Button
              variant="danger"
              className="ml-auto"
              leftIcon={<Trash2 size={15} />}
              onClick={() => window.confirm(`${draft.name || "Bu POS"} silinsin mi?`) && onDelete()}
            >
              Sil
            </Button>
          )}
        </div>
        <p className="text-xs text-zw-grey-500">Değişiklikler sayfanın üstündeki Kaydet ile saklanır.</p>
      </div>
    </Modal>
  );
}

/**
 * Taksit oranlari (musteriye sunulan taksitler ve vade farki) ya da firma
 * taksit oranlari (bankanin komisyonu; tek cekim dahil).
 */
function RatesModal({
  pos,
  kind,
  onSave,
  onClose,
}: {
  pos: PaymentPos;
  kind: "customer" | "firm";
  onSave: (patch: Partial<PaymentPos>) => void;
  onClose: () => void;
}) {
  const customer = kind === "customer";
  const counts = customer ? INSTALLMENT_COUNTS : [1, ...INSTALLMENT_COUNTS];
  const [rows, setRows] = useState(() =>
    counts.map((count) => {
      const c = customer
        ? pos.installments.find((o) => o.count === count)
        : pos.commissions.find((o) => o.count === count);
      return {
        count,
        enabled: customer ? Boolean(c && "enabled" in c && c.enabled) : true,
        rate: c ? String(c.ratePercent) : "",
      };
    }),
  );
  const setRow = (count: number, patch: Partial<(typeof rows)[number]>) =>
    setRows((list) => list.map((r) => (r.count === count ? { ...r, ...patch } : r)));
  const invalid = rows.some((r) => r.rate.trim() !== "" && !(Number(r.rate.replace(",", ".")) >= 0));

  const apply = () => {
    const parse = (v: string) => Number(v.replace(",", "."));
    onSave(
      customer
        ? { installments: rows.map((r) => ({ count: r.count, enabled: r.enabled, ratePercent: r.rate.trim() ? parse(r.rate) : 0 })) }
        : { commissions: rows.filter((r) => r.rate.trim() !== "").map((r) => ({ count: r.count, ratePercent: parse(r.rate) })) },
    );
  };

  return (
    <Modal open onClose={onClose} title={`${pos.name} — ${customer ? "Taksit Oranları" : "Firma Taksit Oranları"}`}>
      <div className="space-y-4">
        <p className="text-sm text-zw-grey-600">
          {customer
            ? "Müşteriye sunulan taksitler ve vade farkı. Vade farkı %0 ise müşteri peşin fiyatına taksit yapar, banka komisyonunu Zenweld öder."
            : "Bankanın bu POS'tan yapılan çekimlerde Zenweld'den kestiği komisyon. Müşteriye gösterilmez; panelde sipariş detayında tahmini komisyon ve net tahsilat olarak görünür."}
        </p>
        {customer && !pos.program && (
          <Alert tone="warning">Bu POS'un kart programı yok; yalnızca tek çekim yapılır, taksitler kullanılmaz.</Alert>
        )}
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase text-zw-grey-500">
            <tr>
              <th className="py-2">Taksit</th>
              {customer && <th className="py-2">Sunulsun</th>}
              <th className="py-2">{customer ? "Vade farkı (%)" : "Komisyon (%)"}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zw-grey-100">
            {rows.map((r) => (
              <tr key={r.count}>
                <td className="py-2 font-semibold">{r.count === 1 ? "Tek çekim" : `${r.count} taksit`}</td>
                {customer && (
                  <td className="py-2">
                    <input
                      type="checkbox"
                      checked={r.enabled}
                      onChange={(e) => setRow(r.count, { enabled: e.target.checked })}
                      aria-label={`${r.count} taksit sunulsun`}
                      className="h-4 w-4 accent-zw-red-600"
                    />
                  </td>
                )}
                <td className="py-2">
                  <Input
                    inputMode="decimal"
                    value={r.rate}
                    disabled={customer && !r.enabled}
                    onChange={(e) => setRow(r.count, { rate: e.target.value })}
                    aria-label={`${r.count === 1 ? "Tek çekim" : `${r.count} taksit`} oran`}
                    className="w-28 py-1.5"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {invalid && <Alert tone="danger">Oranlar 0 veya daha büyük bir sayı olmalı.</Alert>}
        <div className="flex gap-3">
          <Button onClick={apply} disabled={invalid}>
            Uygula
          </Button>
          <Button variant="outline" onClick={onClose}>
            Vazgeç
          </Button>
        </div>
        <p className="text-xs text-zw-grey-500">Değişiklikler sayfanın üstündeki Kaydet ile saklanır.</p>
      </div>
    </Modal>
  );
}
