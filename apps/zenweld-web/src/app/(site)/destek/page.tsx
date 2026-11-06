import { SupportHub } from "@/components/support/SupportHub";
import { pageMetadataFor } from "@/lib/server/page-metadata";

export const generateMetadata = pageMetadataFor("/destek");

export default function SupportPage() {
  return <SupportHub />;
}
