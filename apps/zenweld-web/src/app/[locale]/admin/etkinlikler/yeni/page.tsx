"use client";

import { AdminPageHeader } from "@/components/admin/AdminShell";
import { EventForm } from "@/components/admin/EventForm";

export default function NewEventPage() {
  return (
    <>
      <AdminPageHeader
        title="Yeni Etkinlik"
        description="Fuar, sponsorluk veya etkinlik ekleyin. Bitiş tarihi bugünden ileride olan etkinlikler sitede 'Yaklaşan' filtresinde görünür."
      />
      <EventForm />
    </>
  );
}
