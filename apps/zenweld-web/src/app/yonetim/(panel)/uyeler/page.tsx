import { Suspense } from "react";
import { readMembersPage } from "@zenweld/db";
import { memberListFilter, readerOf } from "@/lib/admin-lists";
import { hasPanelSession } from "@/lib/server/admin";
import { database, usesDatabase } from "@/lib/server/db";
import { MembersClient } from "./MembersClient";

type Params = Promise<Record<string, string | string[] | undefined>>;

/**
 * Uyeler. Veritabani modunda adresteki suzgeclerle (arama, rol, durum,
 * sayfa) yalnizca bir sayfa her acilista ve her kayittan sonra sunucuda
 * okunur (KARARLAR K-99); sifre ozeti gonderilmez.
 */
export default async function AdminUsersPage({ searchParams }: { searchParams: Params }) {
  if (!usesDatabase()) {
    return (
      <Suspense>
        <MembersClient />
      </Suspense>
    );
  }
  if (!(await hasPanelSession())) return null;
  const page = await readMembersPage(database(), memberListFilter(readerOf(await searchParams)));
  return (
    <Suspense>
      <MembersClient page={page} />
    </Suspense>
  );
}
