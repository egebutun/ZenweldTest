import type { Metadata } from "next";
import { legalPages, legalPath, type LegalPageId } from "@zenweld/data";
import { PageData } from "@/components/common/PageData";
import { LegalPageView } from "@/components/legal/LegalPageView";
import { placeholderPageMetadata } from "@/lib/seo";
import { getLegalPageData, getServerContent } from "@/lib/server/content";

/**
 * YASAL METIN SAYFALARI
 *
 * Her yasal sayfa tek satirdir:
 *
 *   const route = legalRoute("kvkk");
 *   export const generateMetadata = route.generateMetadata;
 *   export default route.Page;
 *
 * Baslik sunucunun iceriginden gelir (veritabani modunda panelde
 * degistirilen baslik; demo modunda baslangic basligi). Metnin govdesi
 * veritabani modunda yalnizca bu sayfaya gider. Metinler hala taslak
 * oldugundan sayfalar aramaya kapalidir.
 */
export function legalRoute(id: LegalPageId) {
  const seed = legalPages.find((p) => p.id === id)!;

  async function generateMetadata(): Promise<Metadata> {
    const title = (await getServerContent()).legalPages.find((p) => p.id === id)?.title ?? seed.title;
    return placeholderPageMetadata({
      path: legalPath(id),
      title,
      description: `Zenweld ${title}.`,
    });
  }

  async function Page() {
    return (
      <PageData data={await getLegalPageData([id])}>
        <LegalPageView id={id} />
      </PageData>
    );
  }

  return { generateMetadata, Page };
}
