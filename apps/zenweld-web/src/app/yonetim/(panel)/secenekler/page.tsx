import { readCatalogPanel } from "@zenweld/db";
import { PageData } from "@/components/common/PageData";
import { hasPanelSession } from "@/lib/server/admin";
import { database, usesDatabase } from "@/lib/server/db";
import { OptionsClient } from "./OptionsClient";

/** Seçenek Tanımları. Veritabani modunda katalog her acilista ve her kayittan sonra onbelleksiz okunur (KARARLAR K-99). */
export default async function AdminOptionsPage() {
  if (!usesDatabase()) return <OptionsClient />;
  if (!(await hasPanelSession())) return null;
  return (
    <PageData data={await readCatalogPanel(database())}>
      <OptionsClient />
    </PageData>
  );
}
