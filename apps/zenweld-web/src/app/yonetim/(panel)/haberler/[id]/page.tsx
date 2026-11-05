import { ContentPanelData } from "@/components/admin/ContentPanelData";
import { EditNewsClient } from "./EditNewsClient";

/** Duzenleme sayfasi. Veritabani modunda kayit son degisiklik aniyla veritabanindan okunur (KARARLAR K-99). */
export default async function EditNewsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <ContentPanelData>
      <EditNewsClient id={id} />
    </ContentPanelData>
  );
}
