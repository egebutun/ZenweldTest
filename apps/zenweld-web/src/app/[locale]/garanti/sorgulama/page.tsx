import { WarrantyPage } from "@/components/warranty/WarrantyPage";
import { pageMetadataFor } from "@/lib/page-meta";

export const generateMetadata = pageMetadataFor("/garanti/sorgulama");

export default async function WarrantyCheckPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <WarrantyPage action="sorgula" locale={locale} />;
}
