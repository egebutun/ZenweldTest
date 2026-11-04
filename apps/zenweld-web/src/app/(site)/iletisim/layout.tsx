import { pageMetadataFor } from "@/lib/server/page-metadata";

export const generateMetadata = pageMetadataFor("/iletisim");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
