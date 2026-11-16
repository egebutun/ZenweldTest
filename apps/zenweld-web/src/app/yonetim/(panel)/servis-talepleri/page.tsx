import { Suspense } from "react";
import { readDealers, readServicePage } from "@zenweld/db";
import { PageData } from "@/components/common/PageData";
import { pageParam, readerOf } from "@/lib/admin-lists";
import { hasPanelSession, panelCatalog } from "@/lib/server/admin";
import { database, usesDatabase } from "@/lib/server/db";
import { ServiceRequestsClient } from "./ServiceRequestsClient";

type Params = Promise<Record<string, string | string[] | undefined>>;

/**
 * Servis talepleri. Veritabani modunda adresteki sayfa, kategori adlari ve
 * bayiler (en yakin yetkili servis onerisi; K-117) sunucudan gelir
 * (KARARLAR K-99); demo modunda tarayicidaki veri.
 */
export default async function AdminServiceRequestsPage({ searchParams }: { searchParams: Params }) {
  if (!usesDatabase()) {
    return (
      <Suspense>
        <ServiceRequestsClient />
      </Suspense>
    );
  }
  if (!(await hasPanelSession())) return null;
  const db = database();
  const page = await readServicePage(db, pageParam(readerOf(await searchParams)));
  const [catalog, dealers] = await Promise.all([panelCatalog(), readDealers(db)]);
  return (
    <PageData data={{ ...catalog, dealers }}>
      <Suspense>
        <ServiceRequestsClient page={page} />
      </Suspense>
    </PageData>
  );
}
