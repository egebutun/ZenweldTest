import { WarrantyPage, warrantyMetadata } from "@/components/warranty/WarrantyPage";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return warrantyMetadata("kayit", locale);
}

export default async function WarrantyRegisterPage({ params }: Props) {
  const { locale } = await params;
  return <WarrantyPage action="kayit" locale={locale} />;
}
