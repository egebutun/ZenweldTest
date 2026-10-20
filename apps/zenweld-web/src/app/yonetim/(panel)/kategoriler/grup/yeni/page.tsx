"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import type { TopLevelSection } from "@zenweld/data";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { GroupForm } from "@/components/admin/CategoryForms";
import { SECTION_TITLES } from "@/lib/catalog";

/** /yonetim/kategoriler/grup/yeni?bolum=ekipmanlar: bolum secili gelir. */
export default function NewGroupPage() {
  return (
    <>
      <AdminPageHeader title="Yeni Grup" description="Grup, menüde bölümün altında sol kolona ve bölüm sayfasına eklenir." />
      <Suspense>
        <NewGroupForm />
      </Suspense>
    </>
  );
}

function NewGroupForm() {
  const section = useSearchParams().get("bolum");
  return <GroupForm section={section && section in SECTION_TITLES ? (section as TopLevelSection) : undefined} />;
}
