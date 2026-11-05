import { readDealerApplications } from "@zenweld/db";
import { hasPanelSession } from "@/lib/server/admin";
import { database, usesDatabase } from "@/lib/server/db";
import { DealerApplicationsClient } from "./DealerApplicationsClient";

/**
 * Bayilik basvurulari (sitedeki Bayimiz Olun formu). Kayitlar yalnizca
 * veritabaninda tutulur; her acilista ve her kayittan sonra sunucuda okunur
 * (Asama 5, 2. alan; KARARLAR K-100). Demo modunda tarayicidaki kayitlar
 * gosterilir (KARARLAR K-109).
 */
export default async function DealerApplicationsPage() {
  if (!usesDatabase()) return <DealerApplicationsClient />;
  if (!(await hasPanelSession())) return null;
  return <DealerApplicationsClient applications={await readDealerApplications(database())} />;
}
