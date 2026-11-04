import type { Metadata } from "next";
import { staticPageMetadata, type StaticPagePath } from "@/lib/page-meta";
import { getPageSeoOverride } from "./content";

/**
 * Sabit sayfalarin layout/page dosyalari icin hazir generateMetadata:
 *
 *   export const generateMetadata = pageMetadataFor("/msds");
 *
 * Panelde Icerik › Sayfa SEO'dan girilen baslik ve aciklama veritabani
 * modunda veritabanindan okunur (KARARLAR K-88); bos alanlarda ve demo
 * modunda lib/page-meta.ts'teki varsayilan kullanilir.
 */
export function pageMetadataFor(path: StaticPagePath) {
  return async (): Promise<Metadata> => staticPageMetadata(path, await getPageSeoOverride(path));
}
