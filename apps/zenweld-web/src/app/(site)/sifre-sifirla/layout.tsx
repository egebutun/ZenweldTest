import { pageMetadataFor } from "@/lib/server/page-metadata";

export const generateMetadata = pageMetadataFor("/sifre-sifirla");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
