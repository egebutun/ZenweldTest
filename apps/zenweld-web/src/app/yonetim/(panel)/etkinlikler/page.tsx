import { ContentPanelData } from "@/components/admin/ContentPanelData";
import { EventsListClient } from "./EventsListClient";

/** Etkinlikler listesi. Veritabani modunda her acilista ve her kayittan sonra veritabanindan okunur (KARARLAR K-99). */
export default function AdminEventsPage() {
  return (
    <ContentPanelData>
      <EventsListClient />
    </ContentPanelData>
  );
}
