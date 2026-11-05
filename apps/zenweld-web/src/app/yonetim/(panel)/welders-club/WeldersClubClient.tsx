"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import type { WeldersClubRecord } from "@zenweld/db";
import { Alert, Badge, Button, Input } from "@zenweld/ui";
import { formatDate } from "@zenweld/utils";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { useRequestActions, type PanelAnswer } from "@/lib/admin-requests";

/**
 * WELDERS CLUB (Musteriler ve Servis; KARARLAR K-100)
 *
 * Sitedeki Welders Club formundan katilanlar. Kulupten ayrilmak isteyen
 * pasife alinir; kayit silinmez. Pasif kisi yeniden aktif yapilabilir.
 */
export function WeldersClubClient({ members }: { members: WeldersClubRecord[] }) {
  const actions = useRequestActions();
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const run = async (action: Promise<PanelAnswer>) => {
    setError(null);
    const answer = await action;
    if (!answer.ok) setError(answer.error);
  };

  const q = query.trim().toLocaleLowerCase("tr");
  const shown = members.filter(
    (m) => !q || [m.name, m.email, m.city ?? ""].some((v) => v.toLocaleLowerCase("tr").includes(q)),
  );
  const active = members.filter((m) => !m.leftAt).length;

  return (
    <>
      <AdminPageHeader title="Welders Club" description={`${active} aktif · ${members.length - active} pasif`} />

      {error && (
        <div className="mb-4">
          <Alert tone="danger">{error}</Alert>
        </div>
      )}

      <div className="relative mb-4 sm:w-80">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zw-grey-400" />
        <Input className="pl-9" placeholder="Ad, e-posta veya şehir ara…" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      <div className="overflow-x-auto rounded-[4px] border border-zw-grey-200 bg-white">
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
                  {members.length === 0 ? "Henüz Welders Club katılımı yok." : "Aramanıza uygun kayıt yok."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-zw-grey-500">
        Kulüpten ayrılmak isteyen kişi pasife alınır; kaydı silinmez.
      </p>
    </>
  );
}
