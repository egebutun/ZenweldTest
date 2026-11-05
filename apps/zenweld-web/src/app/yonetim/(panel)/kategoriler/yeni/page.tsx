import { readCatalogPanel } from "@zenweld/db";
import { PageData } from "@/components/common/PageData";
import { hasPanelSession } from "@/lib/server/admin";
import { database, usesDatabase } from "@/lib/server/db";
import { NewCategoryClient } from "./NewCategoryClient";

/** Yeni kategori. Veritabani modunda katalog her acilista ve her kayittan sonra onbelleksiz okunur (KARARLAR K-99). */
export default async function NewCategoryPage() {
  if (!usesDatabase()) return <NewCategoryClient />;
  if (!(await hasPanelSession())) return null;
  return (
    <PageData data={await readCatalogPanel(database())}>
      <NewCategoryClient />
    </PageData>
  );
}
