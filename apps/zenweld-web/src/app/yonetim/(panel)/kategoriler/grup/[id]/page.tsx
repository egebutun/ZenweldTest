"use client";

import { use } from "react";
import { findGroupById, useDatabase } from "@zenweld/store";
import { Alert } from "@zenweld/ui";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { GroupForm, SiteLink } from "@/components/admin/CategoryForms";
import { groupHref } from "@/lib/catalog";

export default function EditGroupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const db = useDatabase();
  const group = findGroupById(id, db);

  if (!group) return <Alert tone="danger">Grup bulunamadı.</Alert>;

  return (
    <>
      <AdminPageHeader title={group.name} description={groupHref(group)} action={<SiteLink href={groupHref(group)} />} />
      <GroupForm key={group.id} group={group} />
    </>
  );
}
