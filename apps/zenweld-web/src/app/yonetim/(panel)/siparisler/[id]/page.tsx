import { readOrdersPanel } from "@zenweld/db";
import { PageData } from "@/components/common/PageData";
import { hasPanelSession } from "@/lib/server/admin";
import { database, usesDatabase } from "@/lib/server/db";
import { OrderDetailClient } from "./OrderDetailClient";

/**
 * Siparis detayi. Veritabani modunda siparis ve kargo firmalari her
 * acilista ve her islemden sonra sunucuda okunur (KARARLAR K-99).
 */
export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!usesDatabase()) return <OrderDetailClient id={id} />;
  if (!(await hasPanelSession())) return null;
  return (
    <PageData data={await database().transaction((tx) => readOrdersPanel(tx, new Date(), id))}>
      <OrderDetailClient id={id} />
    </PageData>
  );
}
