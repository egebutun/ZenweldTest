"use client";

import Link from "next/link";
import { Pencil } from "lucide-react";
import { legalPath, type LegalPageId } from "@zenweld/data";
import { listLegalPages, useDatabase } from "@zenweld/store";
import { formatDateTime } from "@zenweld/utils";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { siteUrl } from "@/lib/admin-links";

/**
 * YASAL METINLER — sitenin alt bilgisindeki "Politikalar & Yasal" listesi.
 * Siralama ve adresler sabittir; baslik ve metin buradan duzenlenir.
 */
export default function AdminLegalPagesPage() {
  const pages = listLegalPages(useDatabase());

  return (
    <>
      <AdminPageHeader
        title="Yasal Metinler"
        description="Alt bilgideki Politikalar & Yasal sayfaları. Başlık ve metni düzenlemek için satıra tıklayın."
      />

      <div className="overflow-x-auto rounded-[4px] border border-zw-grey-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-zw-grey-50 text-left text-xs uppercase tracking-wide text-zw-grey-600">
            <tr>
              <th className="px-4 py-3">Başlık</th>
              <th className="px-4 py-3">Adres</th>
              <th className="px-4 py-3">Son güncelleme</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zw-grey-100">
            {pages.map((p) => {
              const path = legalPath(p.id as LegalPageId);
              return (
                <tr key={p.id} className="hover:bg-zw-grey-50">
                  <td className="px-4 py-2.5">
                    <Link href={`/yonetim/yasal-metinler/${p.id}`} className="font-semibold hover:text-zw-red-600">
                      {p.title}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-xs">
                    <a
                      href={siteUrl(path)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-zw-grey-500 hover:text-zw-red-600 hover:underline"
                    >
                      {path} ↗
                    </a>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-zw-grey-500">{formatDateTime(p.updatedAt)}</td>
                  <td className="px-4 py-2.5 text-right">
                    <Link
                      href={`/yonetim/yasal-metinler/${p.id}`}
                      aria-label="Düzenle"
                      className="inline-flex rounded-[3px] p-1.5 text-zw-grey-500 hover:bg-zw-grey-100 hover:text-zw-ink"
                    >
                      <Pencil size={16} />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
