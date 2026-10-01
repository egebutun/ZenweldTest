"use client";

import { AdminPageHeader } from "@/components/AdminShell";
import { NewsForm } from "@/components/NewsForm";

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
