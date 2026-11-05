"use client";

import { findNewsById, useDatabase } from "@zenweld/store";
import { Alert } from "@zenweld/ui";
import { formatDate } from "@zenweld/utils";
import { NewsForm } from "@/components/admin/NewsForm";
import { EditPageFrame } from "@/components/admin/content-form";

export function EditNewsClient({ id }: { id: string }) {
  const item = findNewsById(id, useDatabase());
  if (!item) return <Alert tone="danger">Haber bulunamadı.</Alert>;

  return (
    <EditPageFrame
      title={item.title}
      description={formatDate(item.publishedAt)}
      sitePath={`/haberler/${item.slug}`}
      siteLinkLabel="Haber sayfasını gör"
    >
      <NewsForm item={item} />
    </EditPageFrame>
  );
}
