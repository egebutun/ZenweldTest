import { WarrantyPage } from "@/components/warranty/WarrantyPage";
import { pageMetadataFor } from "@/lib/server/page-metadata";

export const generateMetadata = pageMetadataFor("/garanti");

export default function WarrantyIndexPage() {
  return <WarrantyPage action={null} />;
}
