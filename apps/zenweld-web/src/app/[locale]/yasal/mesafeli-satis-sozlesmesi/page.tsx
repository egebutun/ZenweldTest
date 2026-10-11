import type { Metadata } from "next";
import { isLocale, type Locale } from "@zenweld/i18n";
import { PageHero } from "@/components/common/PageShell";
import { LegalDocument } from "@/components/shop/LegalDocument";
import { placeholderPageMetadata } from "@/lib/seo";

const TITLE = { tr: "Mesafeli Satış Sözleşmesi", en: "Distance Sales Contract" };
const DESCRIPTION = {
  tr: "Zenweld online mağazası mesafeli satış sözleşmesi.",
  en: "Zenweld online store distance sales contract.",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const lang = (isLocale(locale) ? locale : "tr") as Locale;
  // Metin hala taslak; hukuk danismaninin metni gelene kadar aramaya kapali.
  return placeholderPageMetadata({
    path: "/yasal/mesafeli-satis-sozlesmesi",
    locale: lang,
    title: TITLE,
    description: DESCRIPTION,
  });
}

/** Bos sablon; odeme sayfasinda ayni metin siparis bilgileriyle doldurulur. */
export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const lang = (isLocale(locale) ? locale : "tr") as Locale;
  return (
    <>
      <PageHero title={TITLE[lang]} />
      <div className="zw-container max-w-4xl py-10">
        <LegalDocument kind="contract" />
      </div>
    </>
  );
}
