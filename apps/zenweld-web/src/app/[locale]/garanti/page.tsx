import { WarrantyPage } from "@/components/warranty/WarrantyPage";
import { pageMetadataFor } from "@/lib/page-meta";

export const generateMetadata = pageMetadataFor("/garanti");

export default async function WarrantyIndexPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <WarrantyPage action={null} locale={locale} />;
}
