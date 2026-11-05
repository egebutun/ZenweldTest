import { readDashboardPanel } from "@zenweld/db";
import { PageData } from "@/components/common/PageData";
import { hasPanelSession } from "@/lib/server/admin";
import { database, usesDatabase } from "@/lib/server/db";
import { DashboardClient } from "./DashboardClient";

/**
 * Panel ana sayfasi. Veritabani modunda siparisler, teklifler, uyeler,
 * servis ve garanti kayitlari, katalog, online satis stogu, haber ve
 * etkinlikler her acilista sunucuda okunur (Asama 5, 6. alan; KARARLAR
 * K-99); ozet ve grafikler demo modundakiyle ayni kurallarla hesaplanir.
 */
export default async function AdminDashboardPage() {
  if (!usesDatabase()) return <DashboardClient />;
  if (!(await hasPanelSession())) return null;
  return (
    <PageData data={await readDashboardPanel(database(), new Date())}>
      <DashboardClient />
    </PageData>
  );
}
