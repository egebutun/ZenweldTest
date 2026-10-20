import { DealerFinder } from "@/components/dealers/DealerFinder";
import { pageMetadataFor } from "@/lib/page-meta";

export const generateMetadata = pageMetadataFor("/yetkili-bayi-ve-servis-agi");

export default function WhereToBuyPage() {
  return <DealerFinder />;
}
