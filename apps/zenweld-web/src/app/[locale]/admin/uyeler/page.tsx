"use client";

import { useMemo, useState } from "react";
import { Download, Search, Trash2 } from "lucide-react";
import { deleteUser, downloadCsv, saveUser, useDatabase } from "@zenweld/store";
import type { UserRole, UserStatus } from "@zenweld/data";
import { ROLE_LABELS } from "@zenweld/auth";
import { Badge, Button, Input, Select } from "@zenweld/ui";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { formatDate } from "@/lib/format";

const STATUS_LABEL: Record<UserStatus, string> = {
  active: "Aktif",
  pending: "Onay Bekliyor",
  suspended: "Askıda",
};

export default function AdminUsersPage() {
  const db = useDatabase();
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");

  const users = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr");
    return db.users.filter(
      (u) =>
        (!role || u.role === role) &&
        (!status || u.status === status) &&
        (!q ||
          u.email.toLocaleLowerCase("tr").includes(q) ||
          `${u.firstName} ${u.lastName}`.toLocaleLowerCase("tr").includes(q) ||
          (u.companyName ?? "").toLocaleLowerCase("tr").includes(q)),
    );
  }, [db, query, role, status]);

  return (
    <>
      <AdminPageHeader
        title="Üyeler"
        description={`${users.length} üye listeleniyor`}
        action={
          <Button
            variant="outline"
            leftIcon={<Download size={16} />}
            onClick={() =>
              downloadCsv(
                users.map((u) => ({
                  ad: u.firstName,
                  soyad: u.lastName,
                  eposta: u.email,
                  rol: ROLE_LABELS[u.role].tr,
                  durum: STATUS_LABEL[u.status],
                  firma: u.companyName ?? "",
                  vergiNo: u.taxNumber ?? "",
                  telefon: u.phone,
                  sehir: u.city ?? "",
                  kayitTarihi: u.createdAt,
                })),
                "zenweld-uyeler.csv",
              )
            }
          >
            CSV İndir
          </Button>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <div className="relative">
          <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-zw-grey-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="İsim, e-posta veya firma ara…"
            className="pl-9"
          />
        </div>
        <Select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="">Tüm roller</option>
          <option value="individual">Bireysel</option>
          <option value="business">Kurumsal</option>
          <option value="dealer">Bayi</option>
          <option value="admin">Yönetici</option>
        </Select>
        <Select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Tüm durumlar</option>
          <option value="active">Aktif</option>
          <option value="pending">Onay Bekliyor</option>
          <option value="suspended">Askıda</option>
        </Select>
      </div>

      <div className="overflow-x-auto rounded-[4px] border border-zw-grey-200 bg-white">
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
                    onChange={(e) => saveUser({ ...u, role: e.target.value as UserRole })}
                    className="w-32 py-1.5 text-xs"
                  >
                    <option value="individual">Bireysel</option>
                    <option value="business">Kurumsal</option>
                    <option value="dealer">Bayi</option>
                    <option value="admin">Yönetici</option>
                  </Select>
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex flex-col gap-1.5">
                    <Badge
                      tone={
                        u.status === "active"
                          ? "green"
                          : u.status === "pending"
                            ? "amber"
                            : "outline"
                      }
                    >
                      {STATUS_LABEL[u.status]}
                    </Badge>
                    <div className="flex gap-1">
                      {u.status !== "active" && (
                        <button
                          onClick={() => saveUser({ ...u, status: "active" })}
                          className="rounded-[3px] border border-zw-grey-300 px-2 py-0.5 text-[11px] font-semibold hover:border-emerald-500 hover:text-emerald-700"
                        >
                          Onayla
                        </button>
                      )}
                      {u.status !== "suspended" && (
                        <button
                          onClick={() => saveUser({ ...u, status: "suspended" })}
                          className="rounded-[3px] border border-zw-grey-300 px-2 py-0.5 text-[11px] font-semibold hover:border-amber-500 hover:text-amber-700"
                        >
                          Askıya al
                        </button>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-2.5 text-xs text-zw-grey-500">
                  {formatDate(u.createdAt, "tr")}
                </td>
                <td className="px-4 py-2.5 text-right">
                  <button
                    title="Sil"
                    disabled={u.role === "admin"}
                    onClick={() => {
                      if (confirm(`${u.email} silinsin mi?`)) deleteUser(u.id);
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
    </>
  );
}
