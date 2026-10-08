import { WarrantyPage, warrantyMetadata } from "@/components/warranty/WarrantyPage";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return warrantyMetadata(null, locale);
}

export default async function WarrantyIndexPage({ params }: Props) {
  const { locale } = await params;
  return <WarrantyPage action={null} locale={locale} />;
}
