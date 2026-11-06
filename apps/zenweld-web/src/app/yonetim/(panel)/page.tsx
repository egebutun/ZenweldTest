import { cookies } from "next/headers";
import { readDashboardPanel } from "@zenweld/db";
import { dashboardSummary, parseRange, RANGE_COOKIE } from "@/lib/admin-stats";
import { hasPanelSession } from "@/lib/server/admin";
import { database, usesDatabase } from "@/lib/server/db";
import { DashboardClient } from "./DashboardClient";

/**
 * Panel ana sayfasi. Veritabani modunda kayitlar her acilista sunucuda
 * okunur ve ozet, grafikler, listeler sunucuda hesaplanir; tarayiciya
 * yalnizca sonuc gider (siparislerin, uyelerin kendileri gitmez). Tarih
 * secimi cerezden okunur; secim degisince sayfa sunucuda yeniden hesaplanir.
 * Demo modunda ayni hesap tarayicida yapilir (lib/admin-stats.ts).
 */
export default async function AdminDashboardPage() {
  if (!usesDatabase()) return <DashboardClient />;
  if (!(await hasPanelSession())) return null;
  const now = new Date();
  const range = parseRange((await cookies()).get(RANGE_COOKIE)?.value);
  const data = await readDashboardPanel(database(), now);
  return <DashboardClient summary={dashboardSummary(data, range, now)} />;
}
