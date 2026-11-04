import { WarrantyPage } from "@/components/warranty/WarrantyPage";
import { pageMetadataFor } from "@/lib/server/page-metadata";

export const generateMetadata = pageMetadataFor("/garanti/kayit");

export default function WarrantyRegisterPage() {
  return <WarrantyPage action="kayit" />;
}
