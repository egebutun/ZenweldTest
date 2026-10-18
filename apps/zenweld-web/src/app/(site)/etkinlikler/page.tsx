import type { Metadata } from "next";
import { EventList } from "@/components/events/EventList";
import { SITE_NAME, absoluteUrl, canonical } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const title = "Etkinlik Takvimi";
  const description =
    "Zenweld'in katılacağı veya sponsor olacağı fuar ve diğer etkinlikler hakkında bilgi bulabilirsiniz.";

  return {
    title: { default: title, template: `%s | ${SITE_NAME}` },
    description,
    alternates: canonical("/etkinlikler"),
    openGraph: { title, description, url: absoluteUrl(`/etkinlikler`) },
  };
}

export default function EventsPage() {
  return <EventList />;
}
