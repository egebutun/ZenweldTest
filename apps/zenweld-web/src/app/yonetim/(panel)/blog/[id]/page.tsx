"use client";

import { use } from "react";
import { findBlogPostById, useDatabase } from "@zenweld/store";
import { Alert } from "@zenweld/ui";
import { formatDate } from "@zenweld/utils";
import { BlogForm } from "@/components/admin/BlogForm";
import { EditPageFrame } from "@/components/admin/content-form";

export default function EditBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const item = findBlogPostById(id, useDatabase());
  if (!item) return <Alert tone="danger">Yazı bulunamadı.</Alert>;

  return (
    <EditPageFrame
      title={item.title.tr}
      description={`${item.category.tr} · ${formatDate(item.publishedAt, "tr")}`}
      sitePath={`/blog/${item.slug}`}
      siteLinkLabel="Yazı sayfasını gör"
    >
      <BlogForm item={item} />
    </EditPageFrame>
  );
}
