import { Suspense } from "react";
import { readWeldersClubPage } from "@zenweld/db";
import { readerOf, weldersClubListFilter } from "@/lib/admin-lists";
import { hasPanelSession } from "@/lib/server/admin";
import { database, usesDatabase } from "@/lib/server/db";
import { WeldersClubClient } from "./WeldersClubClient";

type Params = Promise<Record<string, string | string[] | undefined>>;

/**
 * Welders Club katilimlari. Veritabani modunda adresteki suzgecle (arama,
 * sayfa) yalnizca bir sayfa her acilista ve her kayittan sonra sunucuda
 * okunur (KARARLAR K-100). Demo modunda tarayicidaki kayitlar (K-109).
 */
export default async function WeldersClubPage({ searchParams }: { searchParams: Params }) {
  if (!usesDatabase()) {
    return (
      <Suspense>
        <WeldersClubClient />
      </Suspense>
    );
  }
  if (!(await hasPanelSession())) return null;
  const page = await readWeldersClubPage(database(), weldersClubListFilter(readerOf(await searchParams)));
  return (
    <Suspense>
      <WeldersClubClient page={page} />
    </Suspense>
  );
}
