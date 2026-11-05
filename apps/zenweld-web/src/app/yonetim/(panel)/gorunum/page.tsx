import { readAppearancePanel } from "@zenweld/db";
import { PageData } from "@/components/common/PageData";
import { hasPanelSession } from "@/lib/server/admin";
import { database, usesDatabase } from "@/lib/server/db";
import { AppearanceClient } from "./AppearanceClient";

/** Görünüm. Veritabani modunda her acilista ve her kayittan sonra ayar veritabanindan okunur (KARARLAR K-99). */
export default async function AdminAppearancePage() {
  if (!usesDatabase()) return <AppearanceClient />;
  if (!(await hasPanelSession())) return null;
  return (
    <PageData data={await readAppearancePanel(database())}>
      <AppearanceClient />
    </PageData>
  );
}
