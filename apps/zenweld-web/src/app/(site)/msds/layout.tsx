import { PageData } from "@/components/common/PageData";
import { getDocumentsPageData } from "@/lib/server/content";
import { pageMetadataFor } from "@/lib/server/page-metadata";

export const generateMetadata = pageMetadataFor("/msds");

/** Belge sayfasinin metni ve belge listesi yalnizca belge sayfalarina gider (veritabani modu); demo modunda null. */
export default async function Layout({ children }: { children: React.ReactNode }) {
  return <PageData data={await getDocumentsPageData()}>{children}</PageData>;
}
