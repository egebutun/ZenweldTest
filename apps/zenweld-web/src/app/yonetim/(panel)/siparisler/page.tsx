import { Suspense } from "react";
import { readOrdersPage } from "@zenweld/db";
import { orderListFilter, readerOf } from "@/lib/admin-lists";
import { hasPanelSession } from "@/lib/server/admin";
import { database, usesDatabase } from "@/lib/server/db";
import { OrdersClient } from "./OrdersClient";

type Params = Promise<Record<string, string | string[] | undefined>>;

/**
 * Siparisler. Veritabani modunda adresteki suzgeclerle (durum, arama,
 * sayfa) yalnizca bir sayfa sunucuda okunur; once odeme suresi dolan
 * havaleler iptal edilir (KARARLAR K-99). Demo modunda tarayicidaki veri.
 */
export default async function AdminOrdersPage({ searchParams }: { searchParams: Params }) {
  if (!usesDatabase()) {
    return (
      <Suspense>
        <OrdersClient />
      </Suspense>
    );
  }
  if (!(await hasPanelSession())) return null;
  const filter = orderListFilter(readerOf(await searchParams));
  const page = await database().transaction((tx) => readOrdersPage(tx, new Date(), filter));
  return (
    <Suspense>
      <OrdersClient page={page} />
    </Suspense>
  );
}
