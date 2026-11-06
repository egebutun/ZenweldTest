import { Suspense } from "react";
import { readWarrantiesPage } from "@zenweld/db";
import { PageData } from "@/components/common/PageData";
import { readerOf, warrantyListFilter } from "@/lib/admin-lists";
import { istanbulDateKey } from "@/lib/admin-stats";
import { hasPanelSession, panelCatalog } from "@/lib/server/admin";
import { database, usesDatabase } from "@/lib/server/db";
import { WarrantiesClient } from "./WarrantiesClient";

type Params = Promise<Record<string, string | string[] | undefined>>;

/**
 * Garantiler. Veritabani modunda adresteki suzgeclerle (arama, durum, sayfa)
 * yalnizca bir sayfa, sayilar ve sayfadaki uyeler sunucudan gelir; urun
 * adlari sitenin katalogundan (KARARLAR K-99).
 */
export default async function AdminWarrantiesPage({ searchParams }: { searchParams: Params }) {
  if (!usesDatabase()) {
    return (
      <Suspense>
        <WarrantiesClient />
      </Suspense>
    );
  }
  if (!(await hasPanelSession())) return null;
  const filter = warrantyListFilter(readerOf(await searchParams), istanbulDateKey(new Date()));
  const page = await readWarrantiesPage(database(), filter);
  return (
    <PageData data={await panelCatalog()}>
      <Suspense>
        <WarrantiesClient page={page} />
      </Suspense>
    </PageData>
  );
}
