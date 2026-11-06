"use client";

import { useState } from "react";
import { Download, Trash2 } from "lucide-react";
import { listUsers, useDatabase } from "@zenweld/store";
import type { User, UserRole } from "@zenweld/data";
import { useAuth } from "@zenweld/auth";
import { Alert, Badge, Button, Select } from "@zenweld/ui";
import { formatDate, type ListPage } from "@zenweld/utils";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { ListPager, ListSearch, downloadListCsv, useListQuery } from "@/components/admin/ListControls";
import { MEMBER_STATUS_LABEL as STATUS_LABEL, memberCsvRows } from "@/lib/admin-csv";
import { matchingMembers, memberListFilter, memberListPage } from "@/lib/admin-lists";
import { useMembersActions, type PanelAnswer } from "@/lib/admin-members";

/**
 * Uyeler: arama, rol ve durum filtresi, CSV; rol, durum ve silme.
 * Veritabani modunda islemler sunucuya yazilir (lib/admin-members.ts).
 * Sayfa basina 50 hesap; suzgecler ve sayfa adreste durur. Veritabani
 * modunda sunucu yalnizca bu sayfayi okur (page prop); CSV suzgece uyan
 * hesaplarin tamamini indirir.
 */
export function MembersClient({ page }: { page?: ListPage<User> }) {
  const db = useDatabase();
  // Yonetici kendi rolunu degistiremez ve kendini askiya alamaz (panelden
  // atilir). Son yoneticiyi veri katmani ve sunucu da korur (K-35).
  const { user: me } = useAuth();
  const actions = useMembersActions();
  const [error, setError] = useState<string | null>(null);
  const run = async (action: Promise<PanelAnswer>) => {
    setError(null);
    const answer = await action;
    if (!answer.ok) setError(answer.error);
  };
  const save = (u: User, change: Partial<Pick<User, "role" | "status">>) =>
    void run(actions.save(u, { role: change.role ?? u.role, status: change.status ?? u.status }));
  const list = useListQuery();
  const filter = memberListFilter(list.get);
  const data = page ?? memberListPage(listUsers(db), filter);
  const users = data.rows;

  const exportCsv = async () => {
    setError(null);
    const failed = await downloadListCsv(
      "zenweld-uyeler.csv",
      page ? { list: "uyeler", query: list.query } : { rows: memberCsvRows(matchingMembers(listUsers(db), filter)) },
    );
    if (failed) setError(failed);
  };

  return (
    <>
      <AdminPageHeader
        title="Üyeler"
        description={`${data.total} üye listeleniyor`}
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

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <ListSearch
          className="w-full"
          value={filter.q}
          onSearch={(q) => list.go({ ara: q }, true)}
          placeholder="İsim, e-posta veya firma ara…"
          label="Üyelerde ara"
        />
        <Select value={filter.role ?? ""} onChange={(e) => list.go({ rol: e.target.value || undefined })}>
          <option value="">Tüm roller</option>
          <option value="individual">Bireysel</option>
          <option value="business">Kurumsal</option>
          <option value="admin">Yönetici</option>
        </Select>
        <Select value={filter.status ?? ""} onChange={(e) => list.go({ durum: e.target.value || undefined })}>
          <option value="">Tüm durumlar</option>
          <option value="active">Aktif</option>
          <option value="suspended">Askıda</option>
        </Select>
      </div>

      <div
        className={`overflow-x-auto rounded-[4px] border border-zw-grey-200 bg-white transition-opacity ${list.pending ? "opacity-60" : ""}`}
        aria-busy={list.pending}
      >
        <table className="w-full text-sm">
          <thead className="bg-zw-grey-50 text-left text-xs uppercase tracking-wide text-zw-grey-600">
            <tr>
              <th className="px-4 py-3">Üye</th>
              <th className="px-4 py-3">Firma / Vergi No</th>
              <th className="px-4 py-3">Rol</th>
              <th className="px-4 py-3">Durum</th>
              <th className="px-4 py-3">Kayıt</th>
              <th className="px-4 py-3 text-right">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zw-grey-100">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-2.5">
                  <div className="font-semibold">
                    {u.firstName} {u.lastName}
                  </div>
                  <div className="text-xs text-zw-grey-500">{u.email}</div>
                  <div className="text-xs text-zw-grey-400">{u.phone}</div>
                </td>
                <td className="px-4 py-2.5 text-zw-grey-600">
                  {u.companyName ? (
                    <>
                      <div>{u.companyName}</div>
                      <div className="text-xs text-zw-grey-400">{u.taxNumber}</div>
                    </>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-2.5">
                  <Select
                    value={u.role}
                    disabled={u.id === me?.id || actions.pending}
                    title={u.id === me?.id ? "Kendi rolünüzü değiştiremezsiniz." : undefined}
                    onChange={(e) => save(u, { role: e.target.value as UserRole })}
                    className="w-32 py-1.5 text-xs"
                  >
                    <option value="individual">Bireysel</option>
                    <option value="business">Kurumsal</option>
                    <option value="admin">Yönetici</option>
                  </Select>
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex flex-col gap-1.5">
                    <Badge tone={u.status === "active" ? "green" : "outline"}>
                      {STATUS_LABEL[u.status]}
                    </Badge>
                    <div className="flex gap-1">
                      {u.status === "suspended" && (
                        <button
                          disabled={actions.pending}
                          onClick={() => save(u, { status: "active" })}
                          className="rounded-[3px] border border-zw-grey-300 px-2 py-0.5 text-[11px] font-semibold hover:border-emerald-500 hover:text-emerald-700"
                        >
                          Aktifleştir
                        </button>
                      )}
                      {u.status === "active" && u.id !== me?.id && (
                        <button
                          disabled={actions.pending}
                          onClick={() => save(u, { status: "suspended" })}
                          className="rounded-[3px] border border-zw-grey-300 px-2 py-0.5 text-[11px] font-semibold hover:border-amber-500 hover:text-amber-700"
                        >
                          Askıya al
                        </button>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-2.5 text-xs text-zw-grey-500">
                  {formatDate(u.createdAt)}
                </td>
                <td className="px-4 py-2.5 text-right">
                  <button
                    title="Sil"
                    disabled={u.role === "admin" || actions.pending}
                    onClick={() => {
                      if (confirm(`${u.email} silinsin mi?`)) void run(actions.remove(u));
                    }}
                    className="rounded-[3px] p-1.5 text-zw-grey-500 hover:bg-zw-red-50 hover:text-zw-red-600 disabled:opacity-30"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ListPager page={data.page} total={data.total} hrefFor={(p) => list.hrefWith({ sayfa: p > 1 ? String(p) : undefined })} />
    </>
  );
}
