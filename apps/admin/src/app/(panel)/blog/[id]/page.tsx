"use client";

import { use } from "react";
import { findBlogPostById, useDatabase } from "@zenweld/store";
import { Alert } from "@zenweld/ui";
import { AdminPageHeader } from "@/components/AdminShell";
import { BlogForm } from "@/components/BlogForm";
import { formatDate } from "@zenweld/utils";
import { siteUrl } from "@/lib/links";

export default function EditBlogPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
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
          <a
            href={siteUrl(`/kesfet/blog/${item.slug}`)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-zw-red-600 hover:underline"
          >
            Yazı sayfasını gör ↗
          </a>
        }
      />
      <BlogForm item={item} />
    </>
  );
}
