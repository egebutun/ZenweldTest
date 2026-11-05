import { readCouponsPanel } from "@zenweld/db";
import { PageData } from "@/components/common/PageData";
import { hasPanelSession } from "@/lib/server/admin";
import { database, usesDatabase } from "@/lib/server/db";
import { CouponsClient } from "./CouponsClient";

/** Kuponlar. Veritabani modunda kuponlar ve kullanimlari her acilista ve her kayittan sonra sunucuda okunur (KARARLAR K-99). */
export default async function AdminCouponsPage() {
  if (!usesDatabase()) return <CouponsClient />;
  if (!(await hasPanelSession())) return null;
  return (
    <PageData data={await readCouponsPanel(database())}>
      <CouponsClient />
    </PageData>
  );
}
