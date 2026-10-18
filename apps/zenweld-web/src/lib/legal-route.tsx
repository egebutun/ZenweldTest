import type { Metadata } from "next";
import { legalPages, legalPath, type LegalPageId } from "@zenweld/data";
import { isLocale, type Locale } from "@zenweld/i18n";
import { LegalPageView } from "@/components/legal/LegalPageView";
import { placeholderPageMetadata } from "@/lib/seo";

/**
 * YASAL METIN SAYFALARI
 *
 * Her yasal sayfa tek satirdir:
 *
 *   const route = legalRoute("kvkk");
 *   export const generateMetadata = route.generateMetadata;
 *   export default route.Page;
 *
 * Metinler panelden degistigi icin arama basligi baslangic basligindan
 * gelir. Metinler hala taslak oldugundan sayfalar aramaya kapalidir.
 */
export function legalRoute(id: LegalPageId) {
  const seed = legalPages.find((p) => p.id === id)!;

  async function generateMetadata({
    params,
  }: {
    params: Promise<{ locale: string }>;
  }): Promise<Metadata> {
    const { locale } = await params;
    const lang: Locale = isLocale(locale) ? locale : "tr";
    return placeholderPageMetadata({
      path: legalPath(id),
      locale: lang,
      title: seed.title,
      description: {
        tr: `Zenweld ${seed.title.tr}.`,
        en: `Zenweld ${seed.title.en}.`,
      },
    });
  }

  function Page() {
    return <LegalPageView id={id} />;
  }

  return { generateMetadata, Page };
}
