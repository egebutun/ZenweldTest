"use client";

import { use } from "react";
import { findCategoryById, useDatabase } from "@zenweld/store";
import { Alert } from "@zenweld/ui";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { CategoryForm, SiteLink } from "@/components/admin/CategoryForms";
import { categoryHref } from "@/lib/catalog";

export default function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const db = useDatabase();
  const category = findCategoryById(id, db);

  if (!category) return <Alert tone="danger">Kategori bulunamadı.</Alert>;

  return (
    <>
      <AdminPageHeader
        title={category.name}
        description={categoryHref(category)}
        action={<SiteLink href={categoryHref(category)} />}
      />
      <CategoryForm key={category.id} category={category} />
    </>
  );
}
