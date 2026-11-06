import { Suspense } from "react";
import { readQuotesPage } from "@zenweld/db";
import { quoteListFilter, readerOf } from "@/lib/admin-lists";
import { hasPanelSession } from "@/lib/server/admin";
import { database, usesDatabase } from "@/lib/server/db";
import { QuotesClient } from "./QuotesClient";

type Params = Promise<Record<string, string | string[] | undefined>>;

/**
 * Teklifler. Veritabani modunda adresteki suzgecle (durum, sayfa) yalnizca
 * bir sayfa her acilista ve her kayittan sonra sunucuda okunur (KARARLAR K-99).
 */
export default async function AdminQuotesPage({ searchParams }: { searchParams: Params }) {
  if (!usesDatabase()) {
    return (
      <Suspense>
        <QuotesClient />
      </Suspense>
    );
  }
  if (!(await hasPanelSession())) return null;
  const page = await readQuotesPage(database(), quoteListFilter(readerOf(await searchParams)));
  return (
    <Suspense>
      <QuotesClient page={page} />
    </Suspense>
  );
}
