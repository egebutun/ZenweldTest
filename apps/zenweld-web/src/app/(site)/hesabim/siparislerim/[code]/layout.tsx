import { PageData } from "@/components/common/PageData";
import { getContractPageData } from "@/lib/server/content";

/**
 * Hesabim › siparis detayi: siparisin sozlesmeleri (Ön Bilgilendirme Formu,
 * Mesafeli Satis Sozlesmesi) gosterilir; metinleri yalnizca bu sayfaya gider
 * (veritabani modu). Demo modunda null.
 */
export default async function Layout({ children }: { children: React.ReactNode }) {
  return <PageData data={await getContractPageData()}>{children}</PageData>;
}
