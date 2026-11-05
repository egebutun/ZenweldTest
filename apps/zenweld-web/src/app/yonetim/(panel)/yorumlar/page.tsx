import { readReviewsPanel } from "@zenweld/db";
import { PageData } from "@/components/common/PageData";
import { hasPanelSession, panelCatalog } from "@/lib/server/admin";
import { database, usesDatabase } from "@/lib/server/db";
import { ReviewsClient } from "./ReviewsClient";

/** Yorumlar. Veritabani modunda butun yorumlar (onay bekleyenler dahil) ve urunler sunucudan gelir (KARARLAR K-99). */
export default async function AdminReviewsPage() {
  if (!usesDatabase()) return <ReviewsClient />;
  if (!(await hasPanelSession())) return null;
  return (
    <PageData data={{ ...(await readReviewsPanel(database())), ...(await panelCatalog()) }}>
      <ReviewsClient />
    </PageData>
  );
}
