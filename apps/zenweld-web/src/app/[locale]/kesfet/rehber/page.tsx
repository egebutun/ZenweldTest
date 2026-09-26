import { redirect } from "next/navigation";

/**
 * ESKI ADRES — KALICI YONLENDIRME
 *
 * "rehber" tek basina neyin rehberi oldugunu soylemiyordu.
 * Eski adres disaridan verilmis baglantilarda ve arama sonuclarinda
 * kalabildigi icin 404 yerine yeni sayfaya yonlendiriliyor.
 */
export default async function Redirect({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/kesfet/kaynak-rehberi`);
}
