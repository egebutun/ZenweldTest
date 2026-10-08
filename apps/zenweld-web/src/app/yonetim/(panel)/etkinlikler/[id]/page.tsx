"use client";

import { use } from "react";
import { findEventById, useDatabase } from "@zenweld/store";
import { Alert } from "@zenweld/ui";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { EventForm } from "@/components/admin/EventForm";
import { formatDate } from "@zenweld/utils";
import { siteUrl } from "@/lib/admin-links";

export default function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const db = useDatabase();
  const event = findEventById(id, db);

  if (!event) {
    return <Alert tone="danger">Etkinlik bulunamadı.</Alert>;
  }

  return (
    <>
      <AdminPageHeader
        title={event.title}
        description={`${formatDate(event.startDate, "tr")} — ${formatDate(event.endDate, "tr")}`}
        action={
          <a
            href={siteUrl(`/etkinlikler/${event.slug}`)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-zw-red-600 hover:underline"
          >
            Etkinlik sayfasını gör ↗
          </a>
        }
      />
      <EventForm event={event} />
    </>
  );
}
