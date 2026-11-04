import { PageData } from "@/components/common/PageData";
import { DealerFinder } from "@/components/dealers/DealerFinder";
import { pageMetadataFor } from "@/lib/page-meta";
import { getDealerPageData } from "@/lib/server/catalog";

export const generateMetadata = pageMetadataFor("/yetkili-bayi-ve-servis-agi");

export default async function WhereToBuyPage() {
  // Veritabani modunda bayiler sunucudan; demo modunda null.
  return (
    <PageData data={await getDealerPageData()}>
      <DealerFinder />
    </PageData>
  );
}
