"use client";

import { use } from "react";
import { findNewsById, useDatabase } from "@zenweld/store";
import { Alert } from "@zenweld/ui";
import { AdminPageHeader } from "@/components/AdminShell";
import { NewsForm } from "@/components/NewsForm";
import { formatDate } from "@zenweld/utils";
import { siteUrl } from "@/lib/links";

export default function EditNewsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const db = useDatabase();
  const item = findNewsById(id, db);

  if (!item) {
    return <Alert tone="danger">Haber bulunamadı.</Alert>;
  }

  return (
    <>
      <AdminPageHeader
        title={item.title.tr}
        description={formatDate(item.publishedAt, "tr")}
        action={
          <a
            href={siteUrl(`/kesfet/haberler/${item.slug}`)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-zw-red-600 hover:underline"
          >
            Haber sayfasını gör ↗
          </a>
        }
      />
      <NewsForm item={item} />
    </>
  );
}
