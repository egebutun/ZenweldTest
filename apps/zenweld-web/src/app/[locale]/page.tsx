import { isLocale, type Locale } from "@zenweld/i18n";
import { JsonLd } from "@/components/common/JsonLd";
import { organizationJsonLd } from "@/lib/seo";
import {
  BlogTeaser,
  DealerStrip,
  Hero,
  HotSale,
  NewArrivals,
  ProductFinderStrip,
  QuoteBanner,
  WhyZenweld,
} from "@/components/home/HomeSections";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const lang = (isLocale(locale) ? locale : "tr") as Locale;

  return (
    <>
      <JsonLd data={organizationJsonLd(lang)} />
      <ProductFinderStrip />
      <Hero />
      <HotSale />
      <NewArrivals />
      <QuoteBanner />
      <WhyZenweld />
      <DealerStrip />
      <BlogTeaser />
    </>
  );
}
