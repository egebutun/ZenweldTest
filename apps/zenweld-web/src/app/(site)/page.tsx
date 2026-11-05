import { JsonLd } from "@/components/common/JsonLd";
import { faqJsonLd, organizationJsonLd } from "@/lib/seo";
import { ReviewMarquee } from "@/components/home/ReviewMarquee";
import { PageData } from "@/components/common/PageData";
import { defaultSettings } from "@zenweld/data";
import { getHomePageData, getServerCatalog } from "@/lib/server/catalog";
import { getServerContent } from "@/lib/server/content";
import { pageMetadataFor } from "@/lib/server/page-metadata";
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

/**
 * Ana sayfanin basligi, aciklamasi, asil adresi ve onizlemesi; panelde
 * Sayfa SEO'dan degistirilen deger veritabani modunda buradan gelir.
 */
export const generateMetadata = pageMetadataFor("/");

export default async function HomePage() {
  // Veritabani modunda bayi bulucunun bayileri ve one cikan yorumlar
  // sunucudan; demo modunda null.
  const pageData = await getHomePageData();
  const { faqs } = await getServerContent();
  // Sirket satiri yoksa baslangic degerleri (Magaza Ayarlari > Sirket ve Iletisim).
  const { settings } = await getServerCatalog();
  const company = { ...defaultSettings.company, ...settings.company };

  return (
    <PageData data={pageData}>
      <JsonLd data={organizationJsonLd(company)} />
      {/* Sorular arama sonuclarinda acilir baslik olarak cikabilsin */}
      <JsonLd data={faqJsonLd(faqs)} />
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
    </PageData>
  );
}
