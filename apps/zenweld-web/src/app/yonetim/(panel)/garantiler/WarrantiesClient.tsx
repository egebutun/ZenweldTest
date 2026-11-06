"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import type { WarrantyRecord } from "@zenweld/data";
import type { WarrantyListPage } from "@zenweld/db";
import { listUsers, useDatabase } from "@zenweld/store";
import { Alert, Badge, Button, Select } from "@zenweld/ui";
import { formatDate } from "@zenweld/utils";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { ListPager, ListSearch, downloadListCsv, useListQuery } from "@/components/admin/ListControls";
import { warrantyCsvRows } from "@/lib/admin-csv";
import { matchingWarranties, warrantyListFilter, warrantyListPage } from "@/lib/admin-lists";
import { useRequestActions, type PanelAnswer } from "@/lib/admin-requests";
import { istanbulDateKey } from "@/lib/admin-stats";

/**
 * GARANTI KAYITLARI
 *
 * Ana sitede (Kesfet > Garanti > Garanti Kaydi) yapilan kayitlar. Burada
 * yapilan degisiklikler musterinin "Hesabim > Garantilerim" sayfasina ve
 * sitedeki garanti sorgulamaya aninda yansir; ayni veriyi kullanirlar.
 * Veritabani modunda degisiklik sunucuya yazilir (lib/admin-requests.ts).
 *
 * Sayfa basina 50 kayit; arama, durum ve sayfa adreste durur. Veritabani
 * modunda sunucu yalnizca bu sayfayi okur (page prop); CSV suzgece uyan
 * kayitlarin tamamini indirir. Gunler Turkiye saatiyle (suresi doldu mu).
 */
export function WarrantiesClient({ page }: { page?: WarrantyListPage }) {
  const db = useDatabase();
  const actions = useRequestActions();
  const [error, setError] = useState<string | null>(null);
  const run = async (action: Promise<PanelAnswer>) => {
    setError(null);
    const answer = await action;
    if (!answer.ok) setError(answer.error);
  };
  const list = useListQuery();
  const today = istanbulDateKey(new Date());
  const filter = warrantyListFilter(list.get, today);
  const data = page ?? warrantyListPage(db.warranties, listUsers(db), filter);
  const records = data.rows;
  const memberEmails = new Set(data.members);

  const productName = (id: string) => db.products.find((p) => p.id === id)?.name ?? id;

  const exportCsv = async () => {
    setError(null);
    const failed = await downloadListCsv(
      "garanti-kayitlari.csv",
      page
        ? { list: "garantiler", query: list.query }
        : { rows: warrantyCsvRows(matchingWarranties(db.warranties, filter), productName) },
    );
    if (failed) setError(failed);
  };

  /** Uzatilmis garanti acilip kapaninca bitis tarihine 12 ay eklenir/cikarilir; elle girilen tarih korunur. */
  const toggleExtended = (w: WarrantyRecord) => void run(actions.setWarrantyExtended(w, !w.extended));

  return (
    <>
      <AdminPageHeader
        title="Garantiler"
        description={`${data.all} garanti kaydı · ${data.valid} geçerli`}
        action={
          <Button variant="outline" size="sm" onClick={() => void exportCsv()}>
            CSV indir
          </Button>
        }
      />

      {error && (
        <div className="mb-4">
          <Alert tone="danger">{error}</Alert>
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-3">
        <ListSearch
          className="min-w-60 flex-1"
          value={filter.q}
          onSearch={(q) => list.go({ ara: q }, true)}
          placeholder="Seri no, isim veya e-posta ara…"
          label="Garantilerde ara"
        />
        <div className="w-48">
          <Select value={filter.state ?? ""} onChange={(e) => list.go({ durum: e.target.value || undefined })}>
            <option value="">Tüm kayıtlar</option>
            <option value="valid">Garantisi devam eden</option>
            <option value="expired">Süresi dolan</option>
            <option value="extended">Uzatılmış garanti</option>
          </Select>
        </div>
      </div>

      <div
        className={`overflow-x-auto rounded-[4px] border border-zw-grey-200 bg-white transition-opacity ${list.pending ? "opacity-60" : ""}`}
        aria-busy={list.pending}
      >
        <table className="w-full min-w-[960px] text-sm">
          <thead className="bg-zw-grey-50 text-left text-xs uppercase tracking-wide text-zw-grey-600">
            <tr>
              <th className="px-4 py-3">Ürün / Seri No</th>
              <th className="px-4 py-3">Sahibi</th>
              <th className="px-4 py-3">Adres</th>
              <th className="px-4 py-3">Satıcı VKN / Kayıt</th>
              <th className="px-4 py-3">Garanti Bitişi</th>
              <th className="px-4 py-3">Uzatılmış</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zw-grey-100">
            {records.map((w) => {
              const expired = w.expiresAt < today;
              return (
                <tr key={w.id}>
                  <td className="px-4 py-2.5">
                    <div className="font-semibold">{productName(w.productId)}</div>
                    <div className="font-mono text-xs text-zw-grey-500">{w.serialNumber}</div>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="font-semibold">{w.ownerName}</div>
                    <div className="text-xs text-zw-grey-500">{w.email}</div>
                    <div className="text-xs text-zw-grey-400">{w.phone}</div>
                    <div className="mt-1">
                      {memberEmails.has(w.email.toLowerCase()) ? (
                        <Badge tone="grey">Üye</Badge>
                      ) : (
                        <Badge tone="outline">Üye değil</Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-xs">
                    {w.address}
                    <div className="text-zw-grey-500">
                      {w.postalCode} {w.city}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-xs">
                    <span className="font-mono">{w.sellerTaxNumber}</span>
                    <div className="text-zw-grey-400">
                      Kayıt: {formatDate(w.registeredAt)}
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <input
                      type="date"
                      value={w.expiresAt}
                      disabled={actions.pending}
                      onChange={(e) => e.target.value && void run(actions.setWarrantyExpiry(w, e.target.value))}
                      className="rounded-[3px] border border-zw-grey-300 px-2 py-1 text-sm"
                      aria-label="Garanti bitiş tarihi"
                    />
                    <div className="mt-1">
                      <Badge tone={expired ? "outline" : "green"}>
                        {expired ? "Süresi doldu" : "Geçerli"}
                      </Badge>
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <label className="inline-flex cursor-pointer items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-zw-red-600"
                        checked={w.extended}
                        disabled={actions.pending}
                        onChange={() => toggleExtended(w)}
                      />
                      +12 ay
                    </label>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`${w.serialNumber} seri numaralı kayıt silinsin mi?`)) {
                          void run(actions.deleteWarranty(w));
                        }
                      }}
                      className="rounded-[3px] p-1.5 text-zw-grey-500 hover:bg-zw-grey-100 hover:text-zw-red-600"
                      aria-label="Sil"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
            {records.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-zw-grey-500">
                  {data.all === 0
                    ? "Henüz garanti kaydı yok."
                    : "Aramanıza uygun kayıt yok."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ListPager page={data.page} total={data.total} hrefFor={(p) => list.hrefWith({ sayfa: p > 1 ? String(p) : undefined })} />

      <p className="mt-3 text-xs text-zw-grey-500">
        Bitiş tarihi ve uzatılmış garanti değişiklikleri müşterinin “Hesabım → Garantilerim”
        sayfasına ve sitedeki garanti sorgulamaya anında yansır. “+12 ay” işaretlenince bitiş
        tarihine 12 ay eklenir, kaldırılınca 12 ay çıkarılır.
      </p>
    </>
  );
}
