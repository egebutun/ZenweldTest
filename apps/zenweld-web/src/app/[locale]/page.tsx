import { isLocale, type Locale } from "@zenweld/i18n";
import { JsonLd } from "@/components/common/JsonLd";
import { organizationJsonLd } from "@/lib/seo";
import {
  BlogTeaser,
  CategoryTiles,
  DealerStrip,
  FeaturedProducts,
  Hero,
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
      <Hero />
      <CategoryTiles />
      <FeaturedProducts />
      <QuoteBanner />
      <WhyZenweld />
      <DealerStrip />
      <BlogTeaser />
    </>
  );
}
