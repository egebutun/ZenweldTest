import { Suspense } from "react";
import { readServicePage } from "@zenweld/db";
import { PageData } from "@/components/common/PageData";
import { pageParam, readerOf } from "@/lib/admin-lists";
import { hasPanelSession, panelCatalog } from "@/lib/server/admin";
import { database, usesDatabase } from "@/lib/server/db";
import { ServiceRequestsClient } from "./ServiceRequestsClient";

type Params = Promise<Record<string, string | string[] | undefined>>;

/**
 * Servis talepleri. Veritabani modunda adresteki sayfa ve kategori adlari
 * sunucudan gelir (KARARLAR K-99); demo modunda tarayicidaki veri.
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
  const page = await readServicePage(database(), pageParam(readerOf(await searchParams)));
  return (
    <PageData data={await panelCatalog()}>
      <Suspense>
        <ServiceRequestsClient page={page} />
      </Suspense>
    </PageData>
  );
}
