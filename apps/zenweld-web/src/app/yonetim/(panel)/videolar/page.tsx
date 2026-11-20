import { readVideosPanel } from "@zenweld/db";
import { PageData } from "@/components/common/PageData";
import { hasPanelSession, panelCatalog } from "@/lib/server/admin";
import { database, usesDatabase } from "@/lib/server/db";
import { VideosClient } from "./VideosClient";

/**
 * Anasayfa Videoları. Veritabani modunda her acilista ve her kayittan sonra
 * ayar veritabanindan okunur; urun listesi sitenin katalogundan (KARARLAR
 * K-99, K-125).
 */
export default async function AdminVideosPage() {
  if (!usesDatabase()) return <VideosClient />;
  if (!(await hasPanelSession())) return null;
  return (
    <PageData data={{ ...(await panelCatalog()), ...(await readVideosPanel(database())) }}>
      <VideosClient />
    </PageData>
  );
}
