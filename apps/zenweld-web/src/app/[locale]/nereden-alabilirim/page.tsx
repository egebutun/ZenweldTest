import { redirect } from "next/navigation";

/**
 * ESKI ADRES — KALICI YONLENDIRME
 *
 * Sayfa artik yalnizca bayileri degil yetkili servisleri de listeliyor;
 * adres icerige uyacak sekilde degistirildi.
 * Eski adres disaridan verilmis baglantilarda ve arama sonuclarinda
 * kalabildigi icin 404 yerine yeni sayfaya yonlendiriliyor.
 */
export default async function Redirect({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/bayi-ve-servis-agi`);
}
