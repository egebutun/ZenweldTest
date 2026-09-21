"use client";

import { AdminPageHeader } from "@/components/admin/AdminShell";
import { NewsForm } from "@/components/admin/NewsForm";

export default function NewNewsPage() {
  return (
    <>
      <AdminPageHeader
        title="Yeni Haber"
        description="Duyuru, basın açıklaması veya kurumsal haber ekleyin."
      />
      <NewsForm />
    </>
  );
}
