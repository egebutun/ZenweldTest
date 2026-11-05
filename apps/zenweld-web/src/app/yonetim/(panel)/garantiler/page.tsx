import { readWarrantiesPanel } from "@zenweld/db";
import { PageData } from "@/components/common/PageData";
import { hasPanelSession, panelCatalog } from "@/lib/server/admin";
import { database, usesDatabase } from "@/lib/server/db";
import { WarrantiesClient } from "./WarrantiesClient";

/** Garantiler. Veritabani modunda kayitlar, uyeler ve urun adlari sunucudan gelir (KARARLAR K-99). */
export default async function AdminWarrantiesPage() {
  if (!usesDatabase()) return <WarrantiesClient />;
  if (!(await hasPanelSession())) return null;
  return (
    <PageData data={{ ...(await readWarrantiesPanel(database())), ...(await panelCatalog()) }}>
      <WarrantiesClient />
    </PageData>
  );
}
