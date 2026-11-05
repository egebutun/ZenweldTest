import { readCatalogPanel } from "@zenweld/db";
import { PageData } from "@/components/common/PageData";
import { hasPanelSession } from "@/lib/server/admin";
import { database, usesDatabase } from "@/lib/server/db";
import { CategoriesClient } from "./CategoriesClient";

/** Kategoriler. Veritabani modunda katalog her acilista ve her kayittan sonra onbelleksiz okunur (KARARLAR K-99). */
export default async function AdminCategoriesPage() {
  if (!usesDatabase()) return <CategoriesClient />;
  if (!(await hasPanelSession())) return null;
  return (
    <PageData data={await readCatalogPanel(database())}>
      <CategoriesClient />
    </PageData>
  );
}
