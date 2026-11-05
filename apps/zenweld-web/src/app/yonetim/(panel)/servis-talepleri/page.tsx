import { readServicePanel } from "@zenweld/db";
import { PageData } from "@/components/common/PageData";
import { hasPanelSession, panelCatalog } from "@/lib/server/admin";
import { database, usesDatabase } from "@/lib/server/db";
import { ServiceRequestsClient } from "./ServiceRequestsClient";

/** Servis talepleri. Veritabani modunda talepler ve kategori adlari sunucudan gelir (KARARLAR K-99). */
export default async function AdminServiceRequestsPage() {
  if (!usesDatabase()) return <ServiceRequestsClient />;
  if (!(await hasPanelSession())) return null;
  return (
    <PageData data={{ ...(await readServicePanel(database())), ...(await panelCatalog()) }}>
      <ServiceRequestsClient />
    </PageData>
  );
}
