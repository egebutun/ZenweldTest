import { readContentPanel, readVideosPanel } from "@zenweld/db";
import { PageData } from "@/components/common/PageData";
import { hasPanelSession, panelCatalog } from "@/lib/server/admin";
import { database, usesDatabase } from "@/lib/server/db";
import { VideosClient } from "./VideosClient";

/**
 * Videolar. Veritabani modunda her acilista ve her kayittan sonra videolar
 * (son degisiklik anlariyla) ve bolum basligi veritabanindan okunur; urun
 * listesi sitenin katalogundan (KARARLAR K-99, K-125).
 */
export default async function AdminVideosPage() {
  if (!usesDatabase()) return <VideosClient />;
  if (!(await hasPanelSession())) return null;
  const db = database();
  const { videos } = await readContentPanel(db);
  return (
    <PageData data={{ ...(await panelCatalog()), ...(await readVideosPanel(db)), videos }}>
      <VideosClient />
    </PageData>
  );
}
