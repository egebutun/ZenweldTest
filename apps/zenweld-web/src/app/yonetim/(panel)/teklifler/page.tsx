import { readQuotesPanel } from "@zenweld/db";
import { PageData } from "@/components/common/PageData";
import { hasPanelSession } from "@/lib/server/admin";
import { database, usesDatabase } from "@/lib/server/db";
import { QuotesClient } from "./QuotesClient";

/** Teklifler. Veritabani modunda her acilista ve her kayittan sonra sunucuda okunur (KARARLAR K-99). */
export default async function AdminQuotesPage() {
  if (!usesDatabase()) return <QuotesClient />;
  if (!(await hasPanelSession())) return null;
  return (
    <PageData data={await readQuotesPanel(database())}>
      <QuotesClient />
    </PageData>
  );
}
