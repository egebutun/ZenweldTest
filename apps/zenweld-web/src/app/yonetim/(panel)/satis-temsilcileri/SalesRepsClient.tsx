"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import { salesRepDraftError, type SalesRep } from "@zenweld/data";
import { listSalesReps, useDatabase } from "@zenweld/store";
import { Alert, Badge, Button, Checkbox, FormRow, Input, Modal } from "@zenweld/ui";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { ImageField } from "@/components/admin/ImageField";
import { siteUrl } from "@/lib/admin-links";
import { useNetworkActions, type PanelAnswer } from "@/lib/admin-network";

const EMPTY: SalesRep = {
  id: "",
  name: "",
  region: "",
  phone: "",
  email: "",
  order: 0,
  active: true,
};

/**
 * SATIS TEMSILCILERI
 *
 * Sitedeki Kesfet > Satis Temsilcilerimiz sayfasinin listesi. Pasif
 * temsilci sitede gorunmez ama silinmez. Veritabani modunda degisiklik
 * sunucuya yazilir (lib/admin-network.ts); fotograf adresle girilir.
 */
export function SalesRepsClient() {
  const db = useDatabase();
  const actions = useNetworkActions();
  const reps = useMemo(() => listSalesReps(db, true), [db]);
  const [editing, setEditing] = useState<SalesRep | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const run = async (work: Promise<PanelAnswer>) => {
    const answer = await work;
    setListError(answer.ok ? null : answer.error);
  };

  const save = async () => {
    if (!editing) return;
    setError(null);
    const problem = salesRepDraftError(editing);
    if (problem) return setError(problem);
    const stored = editing.id ? reps.find((r) => r.id === editing.id) : undefined;
    const answer = await actions.saveSalesRep(
      {
        ...editing,
        name: editing.name.trim(),
        email: editing.email.trim(),
        phone: editing.phone.trim(),
        region: editing.region.trim(),
        // Yeni kayit listenin sonuna eklenir.
        order: editing.id ? editing.order : (reps.at(-1)?.order ?? 0) + 1,
      },
      stored,
    );
    if (!answer.ok) return setError(answer.error);
    setEditing(null);
  };

  return (
    <>
      <AdminPageHeader
        title="Satış Temsilcileri"
        description={`${reps.length} temsilci · ${reps.filter((r) => r.active).length} sitede görünüyor`}
        action={
          <div className="flex items-center gap-3">
            <a
              href={siteUrl("/satis-temsilcilerimiz")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-zw-red-600 hover:underline"
            >
              Sayfayı gör <ExternalLink size={14} />
            </a>
            <Button
              leftIcon={<Plus size={16} />}
              onClick={() => {
                setError(null);
                setEditing({ ...EMPTY });
              }}
            >
              Temsilci ekle
            </Button>
          </div>
        }
      />

      {listError && (
        <div className="mb-4">
          <Alert tone="danger">{listError}</Alert>
        </div>
      )}

      <div className="overflow-x-auto rounded-[4px] border border-zw-grey-200 bg-white">
        <table className="w-full min-w-[860px] text-sm">
          <thead className="bg-zw-grey-50 text-left text-xs uppercase tracking-wide text-zw-grey-600">
            <tr>
              <th className="w-20 px-4 py-3">Sıra</th>
              <th className="px-4 py-3">Ad Soyad</th>
              <th className="px-4 py-3">Bölge / Görev</th>
              <th className="px-4 py-3">İletişim</th>
              <th className="px-4 py-3">Durum</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zw-grey-100">
            {reps.map((r, i) => (
              <tr key={r.id} className={r.active ? "" : "bg-zw-grey-50 text-zw-grey-500"}>
                <td className="px-4 py-2.5">
                  <div className="flex gap-0.5">
                    <button
                      type="button"
                      disabled={i === 0 || actions.pending}
                      onClick={() => void run(actions.moveSalesRep(reps, i, -1))}
                      className="rounded-[3px] p-1 hover:bg-zw-grey-100 disabled:opacity-30"
                      aria-label="Yukarı taşı"
                    >
                      <ArrowUp size={15} />
                    </button>
                    <button
                      type="button"
                      disabled={i === reps.length - 1 || actions.pending}
                      onClick={() => void run(actions.moveSalesRep(reps, i, 1))}
                      className="rounded-[3px] p-1 hover:bg-zw-grey-100 disabled:opacity-30"
                      aria-label="Aşağı taşı"
                    >
                      <ArrowDown size={15} />
                    </button>
                  </div>
                </td>
                <td className="px-4 py-2.5 font-semibold">{r.name}</td>
                <td className="px-4 py-2.5">{r.region}</td>
                <td className="px-4 py-2.5 text-xs">
                  <div>{r.phone}</div>
                  <div className="text-zw-grey-500">{r.email}</div>
                </td>
                <td className="px-4 py-2.5">
                  <button
                    type="button"
                    disabled={actions.pending}
                    onClick={() => void run(actions.setSalesRepActive(r, !r.active))}
                    title={r.active ? "Sitede gizle" : "Sitede göster"}
                    aria-label={`${r.name} ${r.active ? "sitede gizle" : "sitede göster"}`}
                  >
                    <Badge tone={r.active ? "green" : "outline"}>
                      {r.active ? "Sitede" : "Gizli"}
                    </Badge>
                  </button>
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setError(null);
                        setEditing({ ...r });
                      }}
                      className="rounded-[3px] p-1.5 text-zw-grey-600 hover:bg-zw-grey-100 hover:text-zw-ink"
                      aria-label="Düzenle"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      disabled={actions.pending}
                      onClick={() => {
                        if (window.confirm(`${r.name} listeden silinsin mi?`)) void run(actions.deleteSalesRep(r));
                      }}
                      className="rounded-[3px] p-1.5 text-zw-grey-600 hover:bg-zw-grey-100 hover:text-zw-red-600"
                      aria-label={`${r.name} sil`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {reps.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-zw-grey-500">
                  Henüz temsilci yok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing?.id ? "Temsilciyi Düzenle" : "Yeni Temsilci"}
        size="md"
      >
        {editing && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void save();
            }}
            className="space-y-4"
          >
            {error && <Alert tone="danger">{error}</Alert>}
            <FormRow label="Ad Soyad" required>
              <Input
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              />
            </FormRow>
            <FormRow label="Bölge / Görev" required hint="ör. Ege Bölgesi">
              <Input
                value={editing.region}
                onChange={(e) => setEditing({ ...editing, region: e.target.value })}
              />
            </FormRow>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormRow label="Telefon" required hint="WhatsApp bu numaraya açılır">
                <Input
                  type="tel"
                  value={editing.phone}
                  placeholder="+90 532 000 00 00"
                  onChange={(e) => setEditing({ ...editing, phone: e.target.value })}
                />
              </FormRow>
              <FormRow label="E-posta" required>
                <Input
                  type="email"
                  value={editing.email}
                  onChange={(e) => setEditing({ ...editing, email: e.target.value })}
                />
              </FormRow>
            </div>
            <FormRow label="Fotoğraf (isteğe bağlı)" hint="Yoksa ad soyadın baş harfleri gösterilir">
              <ImageField
                rounded
                value={editing.photoUrl}
                onChange={(photoUrl) => setEditing({ ...editing, photoUrl })}
                onError={setError}
                uploadNote={actions.uploadNote}
              />
            </FormRow>
            <Checkbox
              label="Sitede göster"
              checked={editing.active}
              onChange={(e) => setEditing({ ...editing, active: e.target.checked })}
            />
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
                Vazgeç
              </Button>
              <Button type="submit" disabled={actions.pending}>
                Kaydet
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
