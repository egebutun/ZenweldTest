import { WarrantyPage } from "@/components/warranty/WarrantyPage";
import { pageMetadataFor } from "@/lib/page-meta";

export const generateMetadata = pageMetadataFor("/garanti/kayit");

export default async function WarrantyRegisterPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <WarrantyPage action="kayit" locale={locale} />;
}
