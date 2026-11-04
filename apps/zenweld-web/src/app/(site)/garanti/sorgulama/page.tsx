import { WarrantyPage } from "@/components/warranty/WarrantyPage";
import { pageMetadataFor } from "@/lib/server/page-metadata";

export const generateMetadata = pageMetadataFor("/garanti/sorgulama");

export default function WarrantyCheckPage() {
  return <WarrantyPage action="sorgula" />;
}
