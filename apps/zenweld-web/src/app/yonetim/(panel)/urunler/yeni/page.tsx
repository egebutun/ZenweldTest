import { readCatalogPanel } from "@zenweld/db";
import { PageData } from "@/components/common/PageData";
import { hasPanelSession } from "@/lib/server/admin";
import { database, usesDatabase } from "@/lib/server/db";
import { NewProductClient } from "./NewProductClient";

/** Yeni ürün. Veritabani modunda katalog her acilista onbelleksiz okunur (KARARLAR K-99). */
export default async function NewProductPage() {
  if (!usesDatabase()) return <NewProductClient />;
  if (!(await hasPanelSession())) return null;
  return (
    <PageData data={await readCatalogPanel(database())}>
      <NewProductClient />
    </PageData>
  );
}
