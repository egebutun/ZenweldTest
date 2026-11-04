import { EventList } from "@/components/events/EventList";
import { pageMetadataFor } from "@/lib/server/page-metadata";

export const generateMetadata = pageMetadataFor("/etkinlikler");

export default function EventsPage() {
  return <EventList />;
}
