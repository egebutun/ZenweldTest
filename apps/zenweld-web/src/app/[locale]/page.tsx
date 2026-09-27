import { isLocale, type Locale } from "@zenweld/i18n";
import { JsonLd } from "@/components/common/JsonLd";
import { faqJsonLd, organizationJsonLd } from "@/lib/seo";
import {
  BlogTeaser,
  DealerApplyBanner,
  DealerStrip,
  Hero,
  HomeFaq,
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
      {/* Sorular arama sonuclarinda acilir baslik olarak cikabilsin */}
      <JsonLd data={faqJsonLd(lang)} />
      <ProductFinderStrip />
      <Hero />
      <HotSale />
      <NewArrivals />
      <QuoteBanner />
      <WhyZenweld />
      <HomeFaq />
      <DealerStrip />
      <DealerApplyBanner />
      <BlogTeaser />
    </>
  );
}
