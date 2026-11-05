import { readDealersPanel } from "@zenweld/db";
import { PageData } from "@/components/common/PageData";
import { hasPanelSession } from "@/lib/server/admin";
import { database, usesDatabase } from "@/lib/server/db";
import { DealersClient } from "./DealersClient";

/** Bayiler. Veritabani modunda her acilista ve her kayittan sonra sunucudan okunur (KARARLAR K-99). */
export default async function AdminDealersPage() {
  if (!usesDatabase()) return <DealersClient />;
  if (!(await hasPanelSession())) return null;
  return (
    <PageData data={await readDealersPanel(database())}>
      <DealersClient />
    </PageData>
  );
}
