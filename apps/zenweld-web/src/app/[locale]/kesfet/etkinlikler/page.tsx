import type { Metadata } from "next";
import { isLocale, type Locale } from "@zenweld/i18n";
import { EventList } from "@/components/events/EventList";
import { SITE_NAME, languageAlternates } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const lang = (isLocale(locale) ? locale : "tr") as Locale;
  const title = lang === "tr" ? "Etkinlik Takvimi" : "Event Calendar";
  const description =
    lang === "tr"
      ? "Zenweld'in katılacağı veya sponsor olacağı fuar ve diğer etkinlikler hakkında bilgi bulabilirsiniz."
      : "Find out about the fairs and other events Zenweld attends or sponsors.";

  return {
    title: { default: title, template: `%s | ${SITE_NAME}` },
    description,
    alternates: languageAlternates("/kesfet/etkinlikler", lang),
    openGraph: { title, description, url: `/${lang}/kesfet/etkinlikler` },
  };
}

export default function EventsPage() {
  return <EventList />;
}
