import { WarrantyPage, warrantyMetadata } from "@/components/warranty/WarrantyPage";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return warrantyMetadata("sorgula", locale);
}

export default async function WarrantyCheckPage({ params }: Props) {
  const { locale } = await params;
  return <WarrantyPage action="sorgula" locale={locale} />;
}
