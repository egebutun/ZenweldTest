import { pageMetadataFor } from "@/lib/server/page-metadata";

export const generateMetadata = pageMetadataFor("/welders-club");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
