import { pageMetadataFor } from "@/lib/page-meta";

export const generateMetadata = pageMetadataFor("/cikis");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
