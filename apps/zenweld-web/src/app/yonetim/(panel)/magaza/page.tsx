import { readShopPanel } from "@zenweld/db";
import { PageData } from "@/components/common/PageData";
import { hasPanelSession } from "@/lib/server/admin";
import { database, usesDatabase } from "@/lib/server/db";
import { SUPPORT_EMAIL } from "@/lib/server/mail";
import { ShopSettingsClient } from "./ShopSettingsClient";

/**
 * Mağaza Ayarları. Veritabani modunda her acilista ve her kayittan sonra
 * ayarlar ve e-posta alicilari veritabanindan okunur (KARARLAR K-99, K-104).
 */
export default async function AdminShopSettingsPage() {
  if (!usesDatabase()) return <ShopSettingsClient defaultRecipient={SUPPORT_EMAIL} />;
  if (!(await hasPanelSession())) return null;
  return (
    <PageData data={await readShopPanel(database())}>
      <ShopSettingsClient defaultRecipient={SUPPORT_EMAIL} />
    </PageData>
  );
}
