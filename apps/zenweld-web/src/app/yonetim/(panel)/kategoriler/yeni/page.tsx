"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { CategoryForm } from "@/components/admin/CategoryForms";

/** /yonetim/kategoriler/yeni?grup=<grup id>: grup secili gelir. */
export default function NewCategoryPage() {
  return (
    <>
      <AdminPageHeader title="Yeni Kategori" description="Kategori, seçtiğiniz grubun altında menüye ve grup sayfasına eklenir." />
      <Suspense>
        <NewCategoryForm />
      </Suspense>
    </>
  );
}

function NewCategoryForm() {
  return <CategoryForm groupId={useSearchParams().get("grup") ?? undefined} />;
}
