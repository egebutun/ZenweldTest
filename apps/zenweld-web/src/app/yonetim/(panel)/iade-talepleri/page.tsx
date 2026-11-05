import { readReturnsPanel } from "@zenweld/db";
import { PageData } from "@/components/common/PageData";
import { hasPanelSession } from "@/lib/server/admin";
import { database, usesDatabase } from "@/lib/server/db";
import { ReturnRequestsClient } from "./ReturnRequestsClient";

/** Iade talepleri. Veritabani modunda her acilista ve her kayittan sonra sunucuda okunur (KARARLAR K-99). */
export default async function AdminReturnRequestsPage() {
  if (!usesDatabase()) return <ReturnRequestsClient />;
  if (!(await hasPanelSession())) return null;
  return (
    <PageData data={await readReturnsPanel(database())}>
      <ReturnRequestsClient />
    </PageData>
  );
}
