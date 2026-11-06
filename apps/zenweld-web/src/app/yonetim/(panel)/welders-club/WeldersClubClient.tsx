"use client";

import { useState } from "react";
import type { WeldersClubListPage } from "@zenweld/db";
import { listWeldersClub, useDatabase } from "@zenweld/store";
import { Alert, Badge, Button } from "@zenweld/ui";
import { formatDate } from "@zenweld/utils";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { ListPager, ListSearch, useListQuery } from "@/components/admin/ListControls";
import { weldersClubListFilter, weldersClubListPage } from "@/lib/admin-lists";
import { useRequestActions, type PanelAnswer } from "@/lib/admin-requests";

/**
 * WELDERS CLUB (Musteriler ve Servis; KARARLAR K-100)
 *
 * Sitedeki Welders Club formundan katilanlar. Kulupten ayrilmak isteyen
 * pasife alinir; kayit silinmez. Pasif kisi yeniden aktif yapilabilir.
 */
/**
 * page: veritabani modunda sunucunun okudugu sayfa (50); demo modunda
 * verilmez, tarayicidaki kayitlar gosterilir (KARARLAR K-109). Arama ve
 * sayfa adreste durur.
 */
export function WeldersClubClient({ page }: { page?: WeldersClubListPage }) {
  const db = useDatabase();
  const list = useListQuery();
  const filter = weldersClubListFilter(list.get);
  const data = page ?? weldersClubListPage(listWeldersClub(db), filter);
  const actions = useRequestActions();
  const [error, setError] = useState<string | null>(null);
  const run = async (action: Promise<PanelAnswer>) => {
    setError(null);
    const answer = await action;
    if (!answer.ok) setError(answer.error);
  };

  const shown = data.rows;

  return (
    <>
      <AdminPageHeader title="Welders Club" description={`${data.active} aktif · ${data.passive} pasif`} />

      {error && (
        <div className="mb-4">
          <Alert tone="danger">{error}</Alert>
        </div>
      )}

      <div className="mb-4">
        <ListSearch
          className="w-full sm:w-80"
          value={filter.q}
          onSearch={(q) => list.go({ ara: q }, true)}
          placeholder="Ad, e-posta veya şehir ara…"
          label="Welders Club'da ara"
        />
      </div>

      <div
        className={`overflow-x-auto rounded-[4px] border border-zw-grey-200 bg-white transition-opacity ${list.pending ? "opacity-60" : ""}`}
        aria-busy={list.pending}
      >
        <table className="w-full text-sm">
          <thead className="bg-zw-grey-50 text-left text-xs uppercase tracking-wide text-zw-grey-600">
            <tr>
              <th className="px-4 py-3">Ad Soyad</th>
              <th className="px-4 py-3">E-posta</th>
              <th className="px-4 py-3">Şehir</th>
              <th className="px-4 py-3">Katılım</th>
              <th className="px-4 py-3">Durum</th>
              <th className="px-4 py-3 text-right">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zw-grey-100">
            {shown.map((m) => (
              <tr key={m.id} className={m.leftAt ? "opacity-60" : ""}>
                <td className="px-4 py-2.5 font-semibold">{m.name}</td>
                <td className="px-4 py-2.5">{m.email}</td>
                <td className="px-4 py-2.5 text-zw-grey-600">{m.city ?? "—"}</td>
                <td className="whitespace-nowrap px-4 py-2.5 text-zw-grey-600">{formatDate(m.createdAt)}</td>
                <td className="px-4 py-2.5">
                  {m.leftAt ? (
                    <Badge tone="outline">Pasif · {formatDate(m.leftAt)}</Badge>
                  ) : (
                    <Badge tone="green">Aktif</Badge>
                  )}
                </td>
                <td className="px-4 py-2.5 text-right">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={actions.pending}
                    onClick={() => void run(actions.setWeldersClubActive(m, Boolean(m.leftAt)))}
                  >
                    {m.leftAt ? "Aktif yap" : "Pasife al"}
                  </Button>
                </td>
              </tr>
            ))}
            {shown.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-zw-grey-500">
                  {data.active + data.passive === 0 ? "Henüz Welders Club katılımı yok." : "Aramanıza uygun kayıt yok."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <ListPager page={data.page} total={data.total} hrefFor={(p) => list.hrefWith({ sayfa: p > 1 ? String(p) : undefined })} />
      <p className="mt-3 text-xs text-zw-grey-500">
        Kulüpten ayrılmak isteyen kişi pasife alınır; kaydı silinmez.
      </p>
    </>
  );
}
