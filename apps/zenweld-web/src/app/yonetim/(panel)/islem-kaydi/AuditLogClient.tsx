"use client";

import Link from "next/link";
import { tr } from "@zenweld/i18n";
import type { AuditLogRow, LogPage } from "@zenweld/db";
import { Button, Input, Select } from "@zenweld/ui";
import { formatDateTime } from "@zenweld/utils";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { ACTION_LABELS, entityHref, entityLabel, showValue } from "@/lib/admin-log-labels";
import { logHref } from "@/lib/admin-log-params";

const PATH = "/yonetim/islem-kaydi";

/**
 * Islem kaydi ekrani: en yeni once, sayfa basina 50 kayit. Suzgecler bir
 * GET formudur (adres degisir, sayfa sunucuda yeniden okunur). Degisen
 * alanlar acilir kutuda: guncellemede eski → yeni, eklemede ve silmede
 * kaydin hali.
 */
export function AuditLogClient({
  page,
  facets,
  filter,
  paged = false,
  recorded = true,
}: {
  page: LogPage<AuditLogRow>;
  facets: { entityTypes: string[]; actors: { id: string; name: string }[] };
  filter: Record<string, string | undefined>;
  paged?: boolean;
  /** Kayit tutuluyor mu (veritabani modu); tutulmuyorsa bos tabloda nedeni yazar. */
  recorded?: boolean;
}) {
  const last = page.entries.at(-1);
  return (
    <>
      <AdminPageHeader title="İşlem Kaydı" description="Panelde yapılan her değişiklik ve panele giriş/çıkış; en yeni önce." />

      <form action={PATH} method="get" className="mb-4 grid gap-3 rounded-[4px] border border-zw-grey-200 bg-white p-4 sm:grid-cols-3 lg:grid-cols-6">
        <Select name="tur" defaultValue={filter.tur ?? ""} aria-label="Kayıt türü">
          <option value="">Tüm kayıtlar</option>
          {facets.entityTypes.map((t) => (
            <option key={t} value={t}>
              {entityLabel(t)}
            </option>
          ))}
        </Select>
        <Select name="yonetici" defaultValue={filter.yonetici ?? ""} aria-label="Yönetici">
          <option value="">Tüm yöneticiler</option>
          {facets.actors.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </Select>
        <Select name="islem" defaultValue={filter.islem ?? ""} aria-label="İşlem">
          <option value="">Tüm işlemler</option>
          {Object.entries(ACTION_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </Select>
        <Input type="date" name="baslangic" defaultValue={filter.baslangic ?? ""} aria-label="Başlangıç tarihi" />
        <Input type="date" name="bitis" defaultValue={filter.bitis ?? ""} aria-label="Bitiş tarihi" />
        <div className="flex gap-2">
          <Input name="ara" defaultValue={filter.ara ?? ""} placeholder="Kayıt, no ya da yönetici ara…" className="min-w-0 flex-1" />
          <Button type="submit" size="sm">
            Süz
          </Button>
        </div>
      </form>

      <div className="overflow-x-auto rounded-[4px] border border-zw-grey-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-zw-grey-50 text-left text-xs uppercase tracking-wide text-zw-grey-600">
            <tr>
              <th className="px-4 py-3">Zaman</th>
              <th className="px-4 py-3">Yönetici</th>
              <th className="px-4 py-3">İşlem</th>
              <th className="px-4 py-3">Kayıt</th>
              <th className="px-4 py-3">Değişiklik</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zw-grey-100">
            {page.entries.map((e) => {
              const href = e.action !== "delete" ? entityHref(e.entityType, e.entityId) : undefined;
              const fields = Object.entries(e.changes ?? {});
              return (
                <tr key={e.id} className="align-top">
                  <td className="whitespace-nowrap px-4 py-2.5 text-xs text-zw-grey-600">{formatDateTime(e.at)}</td>
                  <td className="px-4 py-2.5">
                    <div className="font-semibold">{e.actorName}</div>
                    {e.ip && <div className="text-xs text-zw-grey-400">{e.ip}</div>}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5">{ACTION_LABELS[e.action] ?? e.action}</td>
                  <td className="px-4 py-2.5">
                    <div className="text-xs text-zw-grey-500">{entityLabel(e.entityType)}</div>
                    {href ? (
                      <Link href={href} className="font-semibold text-zw-red-700 hover:underline">
                        {e.entityLabel || e.entityId}
                      </Link>
                    ) : (
                      <div className="font-semibold">{e.entityLabel || e.entityId}</div>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    {fields.length > 0 ? (
                      <details>
                        <summary className="cursor-pointer text-xs font-semibold text-zw-grey-600">{fields.length} alan</summary>
                        <dl className="mt-2 space-y-1 text-xs">
                          {fields.map(([field, value]) => (
                            <div key={field}>
                              <dt className="inline font-semibold">{field}: </dt>
                              <dd className="inline break-words text-zw-grey-700">
                                {e.action === "update" && Array.isArray(value) && value.length === 2
                                  ? `${showValue(value[0])} → ${showValue(value[1])}`
                                  : showValue(value)}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      </details>
                    ) : (
                      <span className="text-xs text-zw-grey-400">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {page.entries.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-zw-grey-500">
                  {recorded ? "Kayıt yok." : tr.panel.auditLogNotRecorded}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex gap-4 text-sm font-semibold">
        {paged && (
          <Link href={logHref(PATH, filter)} className="text-zw-grey-600 hover:text-zw-ink">
            ← En yeni kayıtlar
          </Link>
        )}
        {page.more && last && (
          <Link href={logHref(PATH, filter, last.id)} className="text-zw-red-700 hover:underline">
            Daha eski kayıtlar →
          </Link>
        )}
      </div>
    </>
  );
}
