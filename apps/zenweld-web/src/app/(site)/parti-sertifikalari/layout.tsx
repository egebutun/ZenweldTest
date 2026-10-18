import { pageMetadataFor } from "@/lib/page-meta";

export const generateMetadata = pageMetadataFor("/parti-sertifikalari");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
