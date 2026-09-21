"use client";

import { use } from "react";
import { findEventById, useDatabase } from "@zenweld/store";
import { Alert } from "@zenweld/ui";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { EventForm } from "@/components/admin/EventForm";
import { LocaleLink } from "@/components/common/LocaleLink";
import { formatDate } from "@/lib/format";

export default function EditEventPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
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
        title={event.title.tr}
        description={`${formatDate(event.startDate, "tr")} — ${formatDate(event.endDate, "tr")}`}
        action={
          <LocaleLink
            href={`/kesfet/etkinlikler/${event.slug}`}
            className="text-sm font-semibold text-zw-red-600 hover:underline"
          >
            Etkinlik sayfasını gör →
          </LocaleLink>
        }
      />
      <EventForm event={event} />
    </>
  );
}
