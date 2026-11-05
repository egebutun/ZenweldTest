"use client";

import { useMemo, useState } from "react";
import { Eye, EyeOff, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { listAllBlogPosts, useDatabase } from "@zenweld/store";
import { Alert, Badge, Button, Input, ProductImage } from "@zenweld/ui";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { useContentActions, type PanelAnswer } from "@/lib/admin-content";
import Link from "next/link";
import { formatDate } from "@zenweld/utils";

/**
 * BLOG YONETIMI
 *
 * Buradaki her degisiklik sitedeki blog sayfalarinda hemen gorunur.
 */
export function BlogListClient() {
  const db = useDatabase();
  const actions = useContentActions();
  const [listError, setListError] = useState<string | null>(null);
  /** Listeden yapilan islem; veritabani modunda sunucunun cevabi gosterilir. */
  const run = async (answer: Promise<PanelAnswer>) => {
    const result = await answer;
    setListError(result.ok ? null : result.error);
  };
  const [query, setQuery] = useState("");

  const posts = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr");
    return listAllBlogPosts(db).filter(
      (p) =>
        !q ||
        p.title.toLocaleLowerCase("tr").includes(q) ||
        p.category.toLocaleLowerCase("tr").includes(q) ||
        p.excerpt.toLocaleLowerCase("tr").includes(q),
    );
  }, [db, query]);

  return (
    <>
      <AdminPageHeader
        title="Blog"
        description={`${posts.length} yazı listeleniyor`}
        action={
          <Link href="/yonetim/blog/yeni">
            <Button leftIcon={<Plus size={17} />}>Yeni Yazı</Button>
          </Link>
        }
      />

      {listError && (
        <div className="mb-4">
          <Alert tone="danger">{listError}</Alert>
        </div>
      )}


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
                        alt={p.title}
                        label={p.title}
                        className="h-11 w-16 shrink-0 rounded-[3px] border border-zw-grey-200 object-cover"
                      />
                      <div className="min-w-0">
                        <div className="truncate font-semibold">{p.title}</div>
                        <div className="text-xs text-zw-grey-500">/{p.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-zw-grey-600">
                    {p.category}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-zw-grey-600">
                    {formatDate(p.publishedAt)}
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
                        onClick={() => void run(actions.blog.setActive(p, !live))}
                        className="rounded-[3px] p-1.5 text-zw-grey-500 hover:bg-zw-grey-100"
                      >
                        {live ? <Eye size={16} /> : <EyeOff size={16} />}
                      </button>
                      <Link
                        href={`/yonetim/blog/${p.id}`}
                        title="Düzenle"
                        className="rounded-[3px] p-1.5 text-zw-grey-500 hover:bg-zw-grey-100"
                      >
                        <Pencil size={16} />
                      </Link>
                      <button
                        type="button"
                        title="Sil"
                        onClick={() => {
                          if (confirm(`"${p.title}" silinsin mi? Bu işlem geri alınamaz.`)) {
                            void run(actions.blog.remove(p));
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
