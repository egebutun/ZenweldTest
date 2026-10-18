import type { Metadata } from "next";
import { NewsList } from "@/components/events/NewsList";
import { SITE_NAME, absoluteUrl, canonical } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const title = "Haberler";
  const description =
    "Zenweld'den son gelişmeler, duyurular ve basın açıklamaları.";

  return {
    title: { default: title, template: `%s | ${SITE_NAME}` },
    description,
    alternates: canonical("/haberler"),
    openGraph: { title, description, url: absoluteUrl(`/haberler`) },
  };
}

export default function NewsPage() {
  return <NewsList />;
}
