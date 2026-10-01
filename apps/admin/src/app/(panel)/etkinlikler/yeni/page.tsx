"use client";

import { AdminPageHeader } from "@/components/AdminShell";
import { EventForm } from "@/components/EventForm";

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
