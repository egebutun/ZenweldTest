import { pageMetadataFor } from "@/lib/server/page-metadata";

export const generateMetadata = pageMetadataFor("/urun-secici");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
