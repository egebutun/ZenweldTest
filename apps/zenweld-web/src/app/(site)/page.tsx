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

export default async function HomePage() {

  return (
    <>
      <JsonLd data={organizationJsonLd()} />
      {/* Sorular arama sonuclarinda acilir baslik olarak cikabilsin */}
      <JsonLd data={faqJsonLd()} />
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
