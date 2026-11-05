import { readCatalogPanel } from "@zenweld/db";
import { PageData } from "@/components/common/PageData";
import { hasPanelSession } from "@/lib/server/admin";
import { database, usesDatabase } from "@/lib/server/db";
import { EditGroupClient } from "./EditGroupClient";

/** Grup duzenleme. Veritabani modunda katalog her acilista ve her kayittan sonra onbelleksiz okunur (KARARLAR K-99). */
export default async function EditGroupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!usesDatabase()) return <EditGroupClient id={id} />;
  if (!(await hasPanelSession())) return null;
  return (
    <PageData data={await readCatalogPanel(database())}>
      <EditGroupClient id={id} />
    </PageData>
  );
}
