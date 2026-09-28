"use client";

import { useMemo, useState } from "react";
import { Eye, EyeOff, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { deleteBlogPost, listAllBlogPosts, saveBlogPost, useDatabase } from "@zenweld/store";
import { Alert, Badge, Button, Input } from "@zenweld/ui";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { LocaleLink } from "@/components/common/LocaleLink";
import { ProductImage } from "@/components/common/ProductImage";
import { formatDate } from "@/lib/format";

/**
 * BLOG YONETIMI
 *
 * Yazilar tek yerden yonetilir; ana site ve bayi magazasi ayni listeyi
 * okudugu icin buradaki her degisiklik iki sitede birden gorunur.
 */
export default function AdminBlogPage() {
  const db = useDatabase();
  const [query, setQuery] = useState("");

  const posts = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr");
    return listAllBlogPosts(db).filter(
      (p) =>
        !q ||
        p.title.tr.toLocaleLowerCase("tr").includes(q) ||
        p.category.tr.toLocaleLowerCase("tr").includes(q) ||
        p.excerpt.tr.toLocaleLowerCase("tr").includes(q),
    );
  }, [db, query]);

  return (
    <>
      <AdminPageHeader
        title="Blog"
        description={`${posts.length} yazı listeleniyor`}
        action={
          <LocaleLink href="/admin/blog/yeni">
            <Button leftIcon={<Plus size={17} />}>Yeni Yazı</Button>
          </LocaleLink>
        }
      />

      <div className="mb-4">
        <Alert tone="info">
          Buradaki yazılar hem zenweld.com&apos;da hem de bayi mağazalarının blog bölümünde
          görünür. Bayilerin yazı ekleme veya düzenleme yetkisi yoktur.
        </Alert>
      </div>

      <div className="relative mb-4">
        <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-zw-grey-400" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Yazı başlığı, kategori veya özet ara…"
          className="pl-9"
        />
      </div>

      <div className="overflow-x-auto rounded-[4px] border border-zw-grey-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-zw-grey-50 text-left text-xs uppercase tracking-wide text-zw-grey-600">
            <tr>
              <th className="px-4 py-3">Yazı</th>
              <th className="px-4 py-3">Kategori</th>
              <th className="px-4 py-3">Yayın Tarihi</th>
              <th className="px-4 py-3">Durum</th>
              <th className="px-4 py-3 text-right">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zw-grey-100">
            {posts.map((p) => {
              const live = p.active !== false;
              return (
                <tr key={p.id} className={live ? "" : "opacity-50"}>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-3">
                      <ProductImage
                        src={p.coverUrl}
                        alt={p.title.tr}
                        label={p.title.tr}
                        className="h-11 w-16 shrink-0 rounded-[3px] border border-zw-grey-200 object-cover"
                      />
                      <div className="min-w-0">
                        <div className="truncate font-semibold">{p.title.tr}</div>
                        <div className="text-xs text-zw-grey-500">/{p.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-zw-grey-600">
                    {p.category.tr}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-zw-grey-600">
                    {formatDate(p.publishedAt, "tr")}
                  </td>
                  <td className="px-4 py-2.5">
                    {live ? (
                      <Badge tone="green">Yayında</Badge>
                    ) : (
                      <Badge tone="grey">Yayında değil</Badge>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        title={live ? "Yayından kaldır" : "Yayına al"}
                        onClick={() => saveBlogPost({ ...p, active: !live })}
                        className="rounded-[3px] p-1.5 text-zw-grey-500 hover:bg-zw-grey-100"
                      >
                        {live ? <Eye size={16} /> : <EyeOff size={16} />}
                      </button>
                      <LocaleLink
                        href={`/admin/blog/${p.id}`}
                        title="Düzenle"
                        className="rounded-[3px] p-1.5 text-zw-grey-500 hover:bg-zw-grey-100"
                      >
                        <Pencil size={16} />
                      </LocaleLink>
                      <button
                        type="button"
                        title="Sil"
                        onClick={() => {
                          if (confirm(`"${p.title.tr}" silinsin mi? Bu işlem geri alınamaz.`)) {
                            deleteBlogPost(p.id);
                          }
                        }}
                        className="rounded-[3px] p-1.5 text-zw-grey-500 hover:bg-zw-red-50 hover:text-zw-red-600"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {posts.length === 0 && (
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
