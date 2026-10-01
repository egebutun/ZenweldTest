"use client";

import { AdminPageHeader } from "@/components/AdminShell";
import { BlogForm } from "@/components/BlogForm";

export default function NewBlogPostPage() {
  return (
    <>
      <AdminPageHeader
        title="Yeni Blog Yazısı"
        description="Yazı ana sitede ve bayi mağazalarında aynı anda yayınlanır."
      />
      <BlogForm />
    </>
  );
}
