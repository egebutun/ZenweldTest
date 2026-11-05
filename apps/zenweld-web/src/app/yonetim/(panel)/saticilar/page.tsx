import { readRetailersPanel } from "@zenweld/db";
import { PageData } from "@/components/common/PageData";
import { hasPanelSession } from "@/lib/server/admin";
import { database, usesDatabase } from "@/lib/server/db";
import { RetailersClient } from "./RetailersClient";

/** Online Satıcılar. Veritabani modunda her acilista ve her kayittan sonra sunucudan okunur (KARARLAR K-99). */
export default async function AdminRetailersPage() {
  if (!usesDatabase()) return <RetailersClient />;
  if (!(await hasPanelSession())) return null;
  return (
    <PageData data={await readRetailersPanel(database())}>
      <RetailersClient />
    </PageData>
  );
}
