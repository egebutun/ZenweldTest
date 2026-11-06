import { Suspense } from "react";
import { readReturnsPage } from "@zenweld/db";
import { pageParam, readerOf } from "@/lib/admin-lists";
import { hasPanelSession } from "@/lib/server/admin";
import { database, usesDatabase } from "@/lib/server/db";
import { ReturnRequestsClient } from "./ReturnRequestsClient";

type Params = Promise<Record<string, string | string[] | undefined>>;

/**
 * Iade talepleri. Veritabani modunda adresteki sayfa her acilista ve her
 * kayittan sonra sunucuda okunur (KARARLAR K-99); demo modunda tarayicidaki veri.
 */
export default async function AdminReturnRequestsPage({ searchParams }: { searchParams: Params }) {
  if (!usesDatabase()) {
    return (
      <Suspense>
        <ReturnRequestsClient />
      </Suspense>
    );
  }
  if (!(await hasPanelSession())) return null;
  const page = await readReturnsPage(database(), pageParam(readerOf(await searchParams)));
  return (
    <Suspense>
      <ReturnRequestsClient page={page} />
    </Suspense>
  );
}
