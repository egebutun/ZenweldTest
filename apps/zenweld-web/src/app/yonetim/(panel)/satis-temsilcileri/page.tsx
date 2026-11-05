import { readSalesRepsPanel } from "@zenweld/db";
import { PageData } from "@/components/common/PageData";
import { hasPanelSession } from "@/lib/server/admin";
import { database, usesDatabase } from "@/lib/server/db";
import { SalesRepsClient } from "./SalesRepsClient";

/** Satış Temsilcileri. Veritabani modunda her acilista ve her kayittan sonra sunucudan okunur (KARARLAR K-99). */
export default async function AdminSalesRepsPage() {
  if (!usesDatabase()) return <SalesRepsClient />;
  if (!(await hasPanelSession())) return null;
  return (
    <PageData data={await readSalesRepsPanel(database())}>
      <SalesRepsClient />
    </PageData>
  );
}
