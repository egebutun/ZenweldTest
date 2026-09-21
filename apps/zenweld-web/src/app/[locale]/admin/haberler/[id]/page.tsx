"use client";

import { use } from "react";
import { findNewsById, useDatabase } from "@zenweld/store";
import { Alert } from "@zenweld/ui";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { NewsForm } from "@/components/admin/NewsForm";
import { LocaleLink } from "@/components/common/LocaleLink";
import { formatDate } from "@/lib/format";

export default function EditNewsPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
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
        description={`${item.category.tr} · ${formatDate(item.publishedAt, "tr")}`}
        action={
          <LocaleLink
            href={`/kesfet/haberler/${item.slug}`}
            className="text-sm font-semibold text-zw-red-600 hover:underline"
          >
            Haber sayfasını gör →
          </LocaleLink>
        }
      />
      <NewsForm item={item} />
    </>
  );
}
