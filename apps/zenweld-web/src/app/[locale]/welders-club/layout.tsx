import { pageMetadataFor } from "@/lib/page-meta";

export const generateMetadata = pageMetadataFor("/welders-club");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
