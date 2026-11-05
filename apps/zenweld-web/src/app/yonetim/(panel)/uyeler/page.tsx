import { readMembersPanel } from "@zenweld/db";
import { PageData } from "@/components/common/PageData";
import { hasPanelSession } from "@/lib/server/admin";
import { database, usesDatabase } from "@/lib/server/db";
import { MembersClient } from "./MembersClient";

/**
 * Uyeler. Veritabani modunda butun hesaplar her acilista ve her kayittan
 * sonra sunucuda okunur (Asama 5, 6. alan; KARARLAR K-99); sifre ozeti
 * gonderilmez.
 */
export default async function AdminUsersPage() {
  if (!usesDatabase()) return <MembersClient />;
  if (!(await hasPanelSession())) return null;
  return (
    <PageData data={{ users: await readMembersPanel(database()) }}>
      <MembersClient />
    </PageData>
  );
}
