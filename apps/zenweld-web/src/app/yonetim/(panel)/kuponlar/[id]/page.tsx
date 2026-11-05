import { readCouponsPanel } from "@zenweld/db";
import { PageData } from "@/components/common/PageData";
import { hasPanelSession, panelCatalog } from "@/lib/server/admin";
import { database, usesDatabase } from "@/lib/server/db";
import { EditCouponClient } from "./EditCouponClient";

/**
 * Kupon duzenleme. Veritabani modunda kupon, kullanimlari, kullanildigi
 * siparisler, uyeler ve kapsam secimi icin katalog sunucudan gelir
 * (KARARLAR K-99).
 */
export default async function EditCouponPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!usesDatabase()) return <EditCouponClient id={id} />;
  if (!(await hasPanelSession())) return null;
  const data = { ...(await readCouponsPanel(database(), id)), ...(await panelCatalog()) };
  return (
    <PageData data={data}>
      <EditCouponClient id={id} />
    </PageData>
  );
}
