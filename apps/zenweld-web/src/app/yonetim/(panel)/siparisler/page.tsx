import { readOrdersPanel } from "@zenweld/db";
import { PageData } from "@/components/common/PageData";
import { hasPanelSession } from "@/lib/server/admin";
import { database, usesDatabase } from "@/lib/server/db";
import { OrdersClient } from "./OrdersClient";

/**
 * Siparisler. Veritabani modunda siparisler her acilista ve her kayittan
 * sonra sunucuda okunur; once odeme suresi dolan havaleler iptal edilir
 * (Asama 5, 1. alan; KARARLAR K-99). Demo modunda tarayicidaki veri.
 */
export default async function AdminOrdersPage() {
  if (!usesDatabase()) return <OrdersClient />;
  if (!(await hasPanelSession())) return null;
  return (
    <PageData data={await database().transaction((tx) => readOrdersPanel(tx, new Date()))}>
      <OrdersClient />
    </PageData>
  );
}
