"use client";

import { use } from "react";
import { findBlogPostById, useDatabase } from "@zenweld/store";
import { Alert } from "@zenweld/ui";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { BlogForm } from "@/components/admin/BlogForm";
import { LocaleLink } from "@/components/common/LocaleLink";
import { formatDate } from "@/lib/format";

export default function EditBlogPostPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id } = use(params);
  const db = useDatabase();
  const item = findBlogPostById(id, db);

  if (!item) {
    return <Alert tone="danger">Yazı bulunamadı.</Alert>;
  }

  return (
    <>
      <AdminPageHeader
        title={item.title.tr}
        description={`${item.category.tr} · ${formatDate(item.publishedAt, "tr")}`}
        action={
          <LocaleLink
            href={`/kesfet/blog/${item.slug}`}
            className="text-sm font-semibold text-zw-red-600 hover:underline"
          >
            Yazı sayfasını gör →
          </LocaleLink>
        }
      />
      <BlogForm item={item} />
    </>
  );
}
