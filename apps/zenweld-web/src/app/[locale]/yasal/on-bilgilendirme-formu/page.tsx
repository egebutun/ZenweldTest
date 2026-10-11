import type { Metadata } from "next";
import { isLocale, type Locale } from "@zenweld/i18n";
import { PageHero } from "@/components/common/PageShell";
import { LegalDocument } from "@/components/shop/LegalDocument";
import { placeholderPageMetadata } from "@/lib/seo";

const TITLE = { tr: "Ön Bilgilendirme Formu", en: "Pre-Information Form" };
const DESCRIPTION = {
  tr: "Zenweld online siparişleri için ön bilgilendirme formu.",
  en: "Pre-information form for Zenweld online orders.",
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
    path: "/yasal/on-bilgilendirme-formu",
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
        <LegalDocument kind="preInfo" />
      </div>
    </>
  );
}
