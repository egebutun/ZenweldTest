"use client";

import { findBlogPostById, useDatabase } from "@zenweld/store";
import { Alert } from "@zenweld/ui";
import { formatDate } from "@zenweld/utils";
import { BlogForm } from "@/components/admin/BlogForm";
import { EditPageFrame } from "@/components/admin/content-form";

export function EditBlogPostClient({ id }: { id: string }) {
  const item = findBlogPostById(id, useDatabase());
  if (!item) return <Alert tone="danger">Yazı bulunamadı.</Alert>;

  return (
    <EditPageFrame
      title={item.title}
      description={`${item.category} · ${formatDate(item.publishedAt)}`}
      sitePath={`/blog/${item.slug}`}
      siteLinkLabel="Yazı sayfasını gör"
    >
      <BlogForm item={item} />
    </EditPageFrame>
  );
}
