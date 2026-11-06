import { Suspense } from "react";
import { readDealerApplicationsPage } from "@zenweld/db";
import { pageParam, readerOf } from "@/lib/admin-lists";
import { hasPanelSession } from "@/lib/server/admin";
import { database, usesDatabase } from "@/lib/server/db";
import { DealerApplicationsClient } from "./DealerApplicationsClient";

type Params = Promise<Record<string, string | string[] | undefined>>;

/**
 * Bayilik basvurulari (sitedeki Bayimiz Olun formu). Veritabani modunda
 * adresteki sayfa her acilista ve her kayittan sonra sunucuda okunur
 * (KARARLAR K-100). Demo modunda tarayicidaki kayitlar (KARARLAR K-109).
 */
export default async function DealerApplicationsPage({ searchParams }: { searchParams: Params }) {
  if (!usesDatabase()) {
    return (
      <Suspense>
        <DealerApplicationsClient />
      </Suspense>
    );
  }
  if (!(await hasPanelSession())) return null;
  const page = await readDealerApplicationsPage(database(), pageParam(readerOf(await searchParams)));
  return (
    <Suspense>
      <DealerApplicationsClient page={page} />
    </Suspense>
  );
}
