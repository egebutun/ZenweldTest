"use client";

import { use } from "react";
import { findEventById, useDatabase } from "@zenweld/store";
import { Alert } from "@zenweld/ui";
import { formatDate } from "@zenweld/utils";
import { EventForm } from "@/components/admin/EventForm";
import { EditPageFrame } from "@/components/admin/content-form";

export default function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const item = findEventById(id, useDatabase());
  if (!item) return <Alert tone="danger">Etkinlik bulunamadı.</Alert>;

  return (
    <EditPageFrame
      title={item.title}
      description={`${formatDate(item.startDate)} — ${formatDate(item.endDate)}`}
      sitePath={`/etkinlikler/${item.slug}`}
      siteLinkLabel="Etkinlik sayfasını gör"
    >
      <EventForm event={item} />
    </EditPageFrame>
  );
}
