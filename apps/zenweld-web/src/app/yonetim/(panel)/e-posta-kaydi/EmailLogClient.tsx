"use client";

import Link from "next/link";
import type { EmailLogRow, LogPage } from "@zenweld/db";
import { Badge, Button, Input, Select } from "@zenweld/ui";
import { formatDateTime } from "@zenweld/utils";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { EMAIL_STATUS_LABELS, EMAIL_TYPE_LABELS, entityHref, entityLabel } from "@/lib/admin-log-labels";
import { logHref } from "@/lib/admin-log-params";

const PATH = "/yonetim/e-posta-kaydi";
const TONE = { sent: "green", failed: "red", skipped: "outline" } as const;

/**
 * E-posta kaydi ekrani: en yeni once, sayfa basina 50 kayit. Suzgecler
 * bir GET formudur. "Gonderilmedi": e-posta servisi ayarli degil ya da
 * form bot tuzagina takildi; "Gonderilemedi": servis hata verdi ya da
 * ulasilamadi (nedeni altta).
 */
export function EmailLogClient({
  page,
  filter,
  paged = false,
}: {
  page: LogPage<EmailLogRow>;
  filter: Record<string, string | undefined>;
  paged?: boolean;
}) {
  const last = page.entries.at(-1);
  return (
    <>
      <AdminPageHeader title="E-posta Kaydı" description="Sitenin gönderdiği e-postalar; en yeni önce. E-postanın metni saklanmaz." />

      <form action={PATH} method="get" className="mb-4 grid gap-3 rounded-[4px] border border-zw-grey-200 bg-white p-4 sm:grid-cols-3 lg:grid-cols-5">
        <Select name="tur" defaultValue={filter.tur ?? ""} aria-label="E-posta türü">
          <option value="">Tüm türler</option>
          {Object.entries(EMAIL_TYPE_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </Select>
        <Select name="durum" defaultValue={filter.durum ?? ""} aria-label="Durum">
          <option value="">Tüm durumlar</option>
          {Object.entries(EMAIL_STATUS_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </Select>
        <Input type="date" name="baslangic" defaultValue={filter.baslangic ?? ""} aria-label="Başlangıç tarihi" />
        <Input type="date" name="bitis" defaultValue={filter.bitis ?? ""} aria-label="Bitiş tarihi" />
        <div className="flex gap-2">
          <Input name="ara" defaultValue={filter.ara ?? ""} placeholder="Adres, konu ya da kayıt no ara…" className="min-w-0 flex-1" />
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
              <th className="px-4 py-3">Tür</th>
              <th className="px-4 py-3">Alıcı</th>
              <th className="px-4 py-3">Konu</th>
              <th className="px-4 py-3">Durum</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zw-grey-100">
            {page.entries.map((e) => {
              const href = e.entityType && e.entityId ? entityHref(e.entityType, e.entityId) : undefined;
              return (
                <tr key={e.id} className="align-top">
                  <td className="whitespace-nowrap px-4 py-2.5 text-xs text-zw-grey-600">{formatDateTime(e.at)}</td>
                  <td className="px-4 py-2.5">
                    <div className="font-semibold">{EMAIL_TYPE_LABELS[e.type] ?? e.type}</div>
                    {e.sourcePath && <div className="text-xs text-zw-grey-400">{e.sourcePath}</div>}
                  </td>
                  <td className="px-4 py-2.5 text-xs">
                    <div>{e.recipients.join(", ")}</div>
                    {e.replyTo && <div className="text-zw-grey-500">Yanıt: {e.replyTo}</div>}
                  </td>
                  <td className="px-4 py-2.5">
                    <div>{e.subject}</div>
                    {e.entityType && e.entityId && (
                      <div className="text-xs text-zw-grey-500">
                        {entityLabel(e.entityType)}:{" "}
                        {href ? (
                          <Link href={href} className="font-semibold text-zw-red-700 hover:underline">
                            {e.entityId}
                          </Link>
                        ) : (
                          e.entityId
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge tone={TONE[e.status]}>{EMAIL_STATUS_LABELS[e.status]}</Badge>
                    {e.error && <div className="mt-1 text-xs text-zw-grey-500">{e.error}</div>}
                  </td>
                </tr>
              );
            })}
            {page.entries.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-zw-grey-500">
                  Kayıt yok.
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
