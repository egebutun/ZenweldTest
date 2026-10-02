import { isLocale, type Locale } from "@zenweld/i18n";
import { JsonLd } from "@/components/common/JsonLd";
import { faqJsonLd, organizationJsonLd } from "@/lib/seo";
import { ReviewMarquee } from "@/components/home/ReviewMarquee";
import {
  BlogTeaser,
  DealerApplyBanner,
  DealerStrip,
  Hero,
  HomeActionStrip,
  HomeFaq,
  HotSale,
  NewArrivals,
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
      <HomeActionStrip />
      <Hero />
      <HotSale />
      <NewArrivals />
      <WhyZenweld />
      <ReviewMarquee />
      <HomeFaq />
      <DealerStrip />
      <DealerApplyBanner />
      <BlogTeaser />
    </>
  );
}
