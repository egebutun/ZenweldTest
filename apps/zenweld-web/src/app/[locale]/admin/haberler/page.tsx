"use client";

import { useMemo, useState } from "react";
import { Eye, EyeOff, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { deleteNews, saveNews, useDatabase } from "@zenweld/store";
import { Badge, Button, Input } from "@zenweld/ui";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { LocaleLink } from "@/components/common/LocaleLink";
import { ProductImage } from "@/components/common/ProductImage";
import { formatDate } from "@/lib/format";

export default function AdminNewsPage() {
  const db = useDatabase();
  const [query, setQuery] = useState("");

  const news = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr");
    return db.news
      .filter(
        (n) =>
          !q ||
          n.title.tr.toLocaleLowerCase("tr").includes(q) ||
          n.category.tr.toLocaleLowerCase("tr").includes(q),
      )
      .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  }, [db, query]);

  return (
    <>
      <AdminPageHeader
        title="Haberler"
        description={`${news.length} haber listeleniyor`}
        action={
          <LocaleLink href="/admin/haberler/yeni">
            <Button leftIcon={<Plus size={17} />}>Yeni Haber</Button>
          </LocaleLink>
        }
      />

      <div className="relative mb-4">
        <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-zw-grey-400" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Haber başlığı veya kategori ara…"
          className="pl-9"
        />
      </div>

      <div className="overflow-x-auto rounded-[4px] border border-zw-grey-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-zw-grey-50 text-left text-xs uppercase tracking-wide text-zw-grey-600">
            <tr>
              <th className="px-4 py-3">Haber</th>
              <th className="px-4 py-3">Kategori</th>
              <th className="px-4 py-3">Yayın Tarihi</th>
              <th className="px-4 py-3">Durum</th>
              <th className="px-4 py-3 text-right">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zw-grey-100">
            {news.map((n) => (
              <tr key={n.id} className={n.active ? "" : "opacity-50"}>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    <ProductImage
                      src={n.coverUrl}
                      alt={n.title.tr}
                      label={n.title.tr}
                      className="h-11 w-16 shrink-0 rounded-[3px] border border-zw-grey-200 object-cover"
                    />
                    <div className="min-w-0">
                      <div className="truncate font-semibold">{n.title.tr}</div>
                      <div className="text-xs text-zw-grey-500">/{n.slug}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-2.5 text-zw-grey-600">{n.category.tr}</td>
                <td className="whitespace-nowrap px-4 py-2.5 text-zw-grey-600">
                  {formatDate(n.publishedAt, "tr")}
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex flex-wrap gap-1">
                    {n.featured && <Badge tone="red">Manşet</Badge>}
                    {!n.active && <Badge tone="grey">Yayında değil</Badge>}
                    {n.active && !n.featured && <Badge tone="green">Yayında</Badge>}
                  </div>
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      title={n.active ? "Yayından kaldır" : "Yayına al"}
                      onClick={() => saveNews({ ...n, active: !n.active })}
                      className="rounded-[3px] p-1.5 text-zw-grey-500 hover:bg-zw-grey-100"
                    >
                      {n.active ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                    <LocaleLink
                      href={`/admin/haberler/${n.id}`}
                      title="Düzenle"
                      className="rounded-[3px] p-1.5 text-zw-grey-500 hover:bg-zw-grey-100"
                    >
                      <Pencil size={16} />
                    </LocaleLink>
                    <button
                      title="Sil"
                      onClick={() => {
                        if (confirm(`"${n.title.tr}" silinsin mi? Bu işlem geri alınamaz.`)) {
                          deleteNews(n.id);
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
            {news.length === 0 && (
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
