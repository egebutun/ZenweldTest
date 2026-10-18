import { pageMetadataFor } from "@/lib/page-meta";

export const generateMetadata = pageMetadataFor("/sifremi-unuttum");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
