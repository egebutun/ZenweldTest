import { readShopPanel } from "@zenweld/db";
import { PageData } from "@/components/common/PageData";
import { hasPanelSession } from "@/lib/server/admin";
import { database, usesDatabase } from "@/lib/server/db";
import { ShopSettingsClient } from "./ShopSettingsClient";

/**
 * Mağaza Ayarları. Veritabani modunda her acilista ve her kayittan sonra
 * ayarlar veritabanindan okunur (KARARLAR K-99).
 */
export default async function AdminShopSettingsPage() {
  if (!usesDatabase()) return <ShopSettingsClient />;
  if (!(await hasPanelSession())) return null;
  return (
    <PageData data={await readShopPanel(database())}>
      <ShopSettingsClient />
    </PageData>
  );
}
