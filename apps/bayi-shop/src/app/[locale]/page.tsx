import { isLocale, type Locale } from "@zenweld/i18n";
import { JsonLd } from "@/components/JsonLd";
import { storeJsonLd } from "@/lib/seo";
import { ShopHomeContent } from "./ShopHomeContent";

export default async function ShopHome({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const lang = (isLocale(locale) ? locale : "tr") as Locale;

  return (
    <>
      <JsonLd data={storeJsonLd(lang)} />
      <ShopHomeContent />
    </>
  );
}
