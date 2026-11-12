import { ForcePage } from "@/components/force/ForcePage";
import { pageMetadataFor } from "@/lib/server/page-metadata";

export const generateMetadata = pageMetadataFor("/force");

export default function Page() {
  return <ForcePage />;
}
