import { PageData } from "@/components/common/PageData";
import { ForcePage } from "@/components/force/ForcePage";
import { pageMetadataFor } from "@/lib/server/page-metadata";
import { getDealerPageData } from "@/lib/server/catalog";

export const generateMetadata = pageMetadataFor("/force");

export default async function Page() {
  // Veritabani modunda bayiler (en alttaki Force bayileri haritasi icin) sunucudan; demo modunda null.
  return (
    <PageData data={await getDealerPageData()}>
      <ForcePage />
    </PageData>
  );
}
