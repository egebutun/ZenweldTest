"use client";

import { useMemo, useState } from "react";
import { Eye, EyeOff, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { deleteEvent, saveEvent, useDatabase } from "@zenweld/store";
import { Badge, Button, Input, Select } from "@zenweld/ui";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { LocaleLink } from "@/components/common/LocaleLink";
import { ProductImage } from "@/components/common/ProductImage";
import { logoAlternates } from "@/lib/event-logo";
import { formatDate } from "@/lib/format";

export default function AdminEventsPage() {
  const db = useDatabase();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");

  const today = new Date().toISOString().slice(0, 10);

  const events = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr");
    return db.events
      .filter((e) => {
        if (status === "upcoming" && e.endDate < today) return false;
        if (status === "past" && e.endDate >= today) return false;
        if (!q) return true;
        return (
          e.title.toLocaleLowerCase("tr").includes(q) ||
          e.city.toLocaleLowerCase("tr").includes(q) ||
          e.country.toLocaleLowerCase("tr").includes(q)
        );
      })
      .sort((a, b) => b.startDate.localeCompare(a.startDate));
  }, [db, query, status, today]);

  return (
    <>
      <AdminPageHeader
        title="Etkinlikler"
        description={`${events.length} etkinlik listeleniyor`}
        action={
          <LocaleLink href="/admin/etkinlikler/yeni">
            <Button leftIcon={<Plus size={17} />}>Yeni Etkinlik</Button>
          </LocaleLink>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-zw-grey-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Etkinlik adı, şehir veya ülke ara…"
            className="pl-9"
          />
        </div>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="sm:w-56">
          <option value="">Tüm etkinlikler</option>
          <option value="upcoming">Yaklaşan</option>
          <option value="past">Geçmiş</option>
        </Select>
      </div>

      <div className="overflow-x-auto rounded-[4px] border border-zw-grey-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-zw-grey-50 text-left text-xs uppercase tracking-wide text-zw-grey-600">
            <tr>
              <th className="px-4 py-3">Etkinlik</th>
              <th className="px-4 py-3">Tarih</th>
              <th className="px-4 py-3">Konum</th>
              <th className="px-4 py-3">Durum</th>
              <th className="px-4 py-3 text-right">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zw-grey-100">
            {events.map((e) => (
              <tr key={e.id} className={e.active ? "" : "opacity-50"}>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-16 shrink-0 items-center justify-center rounded-[3px] border border-zw-grey-200 bg-zw-grey-50 p-1">
                      <ProductImage
                        src={e.logoUrl}
                        alternates={logoAlternates(e.logoUrl)}
                        alt={e.title}
                        label={e.title}
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate font-semibold">{e.title}</div>
                      <div className="text-xs text-zw-grey-500">/{e.slug}</div>
                    </div>
                  </div>
                </td>
                <td className="whitespace-nowrap px-4 py-2.5 text-zw-grey-600">
                  {formatDate(e.startDate, "tr")}
                  <div className="text-xs text-zw-grey-500">{formatDate(e.endDate, "tr")}</div>
                </td>
                <td className="px-4 py-2.5 text-zw-grey-600">
                  {e.city}
                  <div className="text-xs text-zw-grey-500">{e.country}</div>
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex flex-wrap gap-1">
                    <Badge tone={e.endDate >= today ? "green" : "outline"}>
                      {e.endDate >= today ? "Yaklaşan" : "Geçmiş"}
                    </Badge>
                    {e.featured && <Badge tone="red">Öne çıkan</Badge>}
                    {!e.active && <Badge tone="grey">Yayında değil</Badge>}
                  </div>
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      title={e.active ? "Yayından kaldır" : "Yayına al"}
                      onClick={() => saveEvent({ ...e, active: !e.active })}
                      className="rounded-[3px] p-1.5 text-zw-grey-500 hover:bg-zw-grey-100"
                    >
                      {e.active ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                    <LocaleLink
                      href={`/admin/etkinlikler/${e.id}`}
                      title="Düzenle"
                      className="rounded-[3px] p-1.5 text-zw-grey-500 hover:bg-zw-grey-100"
                    >
                      <Pencil size={16} />
                    </LocaleLink>
                    <button
                      title="Sil"
                      onClick={() => {
                        if (confirm(`"${e.title}" silinsin mi? Bu işlem geri alınamaz.`)) {
                          deleteEvent(e.id);
                        }
                      }}
                      className="rounded-[3px] p-1.5 text-zw-grey-500 hover:bg-zw-red-50 hover:text-zw-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {events.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-zw-grey-500">
                  Kayıt bulunamadı.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
