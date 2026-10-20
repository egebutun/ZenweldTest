import { EventList } from "@/components/events/EventList";
import { pageMetadataFor } from "@/lib/page-meta";

export const generateMetadata = pageMetadataFor("/etkinlikler");

export default function EventsPage() {
  return <EventList />;
}
