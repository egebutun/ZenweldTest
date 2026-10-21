import { JsonLd } from "@/components/common/JsonLd";
import type { Metadata } from "next";
import { canonical, faqJsonLd, organizationJsonLd } from "@/lib/seo";
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
  QuoteBanner,
  WhyZenweld,
} from "@/components/home/HomeSections";

/** Ana sayfanin asil adresi; baslik ve onizleme site duzeninden gelir. */
export const metadata: Metadata = { alternates: canonical("/") };

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
      <DealerStrip />
      <WhyZenweld />
      <ReviewMarquee />
      <HomeFaq />
      <QuoteBanner />
      <DealerApplyBanner />
      <BlogTeaser />
    </>
  );
}
