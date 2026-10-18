import { pageMetadataFor } from "@/lib/page-meta";

export const generateMetadata = pageMetadataFor("/iletisim");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
