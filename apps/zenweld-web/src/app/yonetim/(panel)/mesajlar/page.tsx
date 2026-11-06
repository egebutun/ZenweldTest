import { Suspense } from "react";
import { readMessagesPage } from "@zenweld/db";
import { messageListFilter, readerOf } from "@/lib/admin-lists";
import { hasPanelSession } from "@/lib/server/admin";
import { database, usesDatabase } from "@/lib/server/db";
import { MessagesClient } from "./MessagesClient";

type Params = Promise<Record<string, string | string[] | undefined>>;

/**
 * Mesajlar: sitedeki iletisim formu ve urun sayfasindaki destek sorulari.
 * Veritabani modunda adresteki suzgecle (tur, sayfa) yalnizca bir sayfa her
 * acilista ve her kayittan sonra sunucuda okunur (KARARLAR K-100). Demo
 * modunda tarayicidaki kayitlar gosterilir (KARARLAR K-109).
 */
export default async function MessagesPage({ searchParams }: { searchParams: Params }) {
  if (!usesDatabase()) {
    return (
      <Suspense>
        <MessagesClient />
      </Suspense>
    );
  }
  if (!(await hasPanelSession())) return null;
  const page = await readMessagesPage(database(), messageListFilter(readerOf(await searchParams)));
  return (
    <Suspense>
      <MessagesClient page={page} />
    </Suspense>
  );
}
