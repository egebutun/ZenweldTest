import type { Metadata } from "next";
import { events } from "@zenweld/data";
import { JsonLd } from "@/components/common/JsonLd";
import { EventDetail } from "@/components/events/EventDetail";
import { SITE_NAME, absoluteUrl, canonical } from "@/lib/seo";

export function generateStaticParams() {
  return events.filter((e) => e.active).map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = events.find((e) => e.slug === slug);

  if (!event) return { title: "Etkinlik" };

  const title = event.title;
  const description = event.summary;

  return {
    title,
    description,
    alternates: canonical(`/etkinlikler/${event.slug}`),
    openGraph: {
      type: "article",
      siteName: SITE_NAME,
      title,
      description,
      url: absoluteUrl(`/etkinlikler/${event.slug}`),
      images: [{ url: event.images[0] ?? event.logoUrl, alt: title }],
    },
  };
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = events.find((e) => e.slug === slug);

  // Tohum verisinde olmayan slug'lar yonetim panelinden eklenmis olabilir;
  // bu kayitlar yalnizca tarayici deposunda oldugu icin sunucuda bulunamaz.
  // Sayfayi istemci bilesenine birakiyoruz, gercekten yoksa o notFound() atar.
  if (!event) return <EventDetail slug={slug} />;

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Event",
          name: event.title,
          description: event.summary,
          startDate: event.startDate,
          endDate: event.endDate,
          eventStatus: "https://schema.org/EventScheduled",
          eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
          image: event.images.map((i) => absoluteUrl(i)),
          location: {
            "@type": "Place",
            name: event.venue,
            address: {
              "@type": "PostalAddress",
              addressLocality: event.city,
              addressCountry: event.country,
            },
          },
          organizer: { "@type": "Organization", name: SITE_NAME },
        }}
      />
      <EventDetail slug={slug} />
    </>
  );
}
