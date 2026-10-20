import { NewsList } from "@/components/events/NewsList";
import { pageMetadataFor } from "@/lib/page-meta";

export const generateMetadata = pageMetadataFor("/haberler");

export default function NewsPage() {
  return <NewsList />;
}
