import { readCatalogPanel, readWarehouseStock } from "@zenweld/db";
import { PageData } from "@/components/common/PageData";
import { hasPanelSession } from "@/lib/server/admin";
import { database, usesDatabase } from "@/lib/server/db";
import { ProductsClient } from "./ProductsClient";

/**
 * Ürünler. Veritabani modunda katalog ve Zenweld depo stogu her acilista ve
 * her kayittan sonra onbelleksiz okunur (KARARLAR K-99).
 */
export default async function AdminProductsPage() {
  if (!usesDatabase()) return <ProductsClient />;
  if (!(await hasPanelSession())) return null;
  const db = database();
  return (
    <PageData data={{ ...(await readCatalogPanel(db)), warehouseStock: await readWarehouseStock(db) }}>
      <ProductsClient />
    </PageData>
  );
}
