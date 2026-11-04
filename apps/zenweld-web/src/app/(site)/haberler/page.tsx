import { NewsList } from "@/components/events/NewsList";
import { pageMetadataFor } from "@/lib/server/page-metadata";

export const generateMetadata = pageMetadataFor("/haberler");

export default function NewsPage() {
  return <NewsList />;
}
