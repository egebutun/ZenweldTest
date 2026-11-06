import { Suspense } from "react";
import { readReviewsPage } from "@zenweld/db";
import { PageData } from "@/components/common/PageData";
import { readerOf, reviewListFilter } from "@/lib/admin-lists";
import { hasPanelSession, panelCatalog } from "@/lib/server/admin";
import { database, usesDatabase } from "@/lib/server/db";
import { ReviewsClient } from "./ReviewsClient";

type Params = Promise<Record<string, string | string[] | undefined>>;

/**
 * Yorumlar. Veritabani modunda adresteki suzgeclerle (arama, onay bekleyen,
 * sayfa) yalnizca bir sayfa (onay bekleyenler dahil) ve sayilar sunucudan
 * gelir; urun adlari sitenin katalogundan (KARARLAR K-99).
 */
export default async function AdminReviewsPage({ searchParams }: { searchParams: Params }) {
  if (!usesDatabase()) {
    return (
      <Suspense>
        <ReviewsClient />
      </Suspense>
    );
  }
  if (!(await hasPanelSession())) return null;
  const page = await readReviewsPage(database(), reviewListFilter(readerOf(await searchParams)));
  return (
    <PageData data={await panelCatalog()}>
      <Suspense>
        <ReviewsClient page={page} />
      </Suspense>
    </PageData>
  );
}
