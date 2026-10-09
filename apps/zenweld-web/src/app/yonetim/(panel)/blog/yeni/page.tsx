"use client";

import { AdminPageHeader } from "@/components/admin/AdminShell";
import { BlogForm } from "@/components/admin/BlogForm";

export default function NewBlogPostPage() {
  return (
    <>
      <AdminPageHeader
        title="Yeni Blog Yazısı"
        description="Kaydedilen yazı sitede yayınlanır."
      />
      <BlogForm />
    </>
  );
}
