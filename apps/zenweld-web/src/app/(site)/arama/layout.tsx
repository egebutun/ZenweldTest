import { pageMetadataFor } from "@/lib/page-meta";

export const generateMetadata = pageMetadataFor("/arama");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
