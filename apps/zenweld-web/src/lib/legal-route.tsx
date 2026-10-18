import type { Metadata } from "next";
import { legalPages, legalPath, type LegalPageId } from "@zenweld/data";
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

  function generateMetadata(): Metadata {
    return placeholderPageMetadata({
      path: legalPath(id),
      title: seed.title,
      description: `Zenweld ${seed.title}.`,
    });
  }

  function Page() {
    return <LegalPageView id={id} />;
  }

  return { generateMetadata, Page };
}
