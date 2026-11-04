import { PageData } from "@/components/common/PageData";
import { getContractPageData } from "@/lib/server/content";
import { pageMetadataFor } from "@/lib/server/page-metadata";

export const generateMetadata = pageMetadataFor("/odeme");

/** Siparis sozlesmelerinin metni yalnizca bu sayfaya gider (veritabani modu); demo modunda null. */
export default async function Layout({ children }: { children: React.ReactNode }) {
  return <PageData data={await getContractPageData()}>{children}</PageData>;
}
