import { redirect } from "next/navigation";

/**
 * ESKI ADRES — KALICI YONLENDIRME
 *
 * Kurumsal tanitim sayfasi ust seviyeye tasindi; /kesfet/ katmani
 * adresi uzatiyor ve SEO acisindan bir sey katmiyordu.
 * Eski adres disaridan verilmis baglantilarda ve arama sonuclarinda
 * kalabildigi icin 404 yerine yeni sayfaya yonlendiriliyor.
 */
export default async function Redirect({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/hakkimizda`);
}
