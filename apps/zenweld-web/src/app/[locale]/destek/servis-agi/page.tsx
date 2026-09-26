import { redirect } from "next/navigation";

/**
 * Servis agi sayfasi bayi bulucuyla birlestirildi.
 *
 * Eski adres calismaya devam etsin diye kalici yonlendirme birakildi:
 * disaridan verilmis baglantilar ve arama sonuclari 404 gormez.
 */
export default async function ServiceNetworkRedirect({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/bayi-ve-servis-agi`);
}
