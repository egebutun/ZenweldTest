import { pageMetadataFor } from "@/lib/server/page-metadata";

export const generateMetadata = pageMetadataFor("/sss");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
