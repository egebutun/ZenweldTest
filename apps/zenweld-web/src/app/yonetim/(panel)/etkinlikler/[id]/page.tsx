import { ContentPanelData } from "@/components/admin/ContentPanelData";
import { EditEventClient } from "./EditEventClient";

/** Duzenleme sayfasi. Veritabani modunda kayit son degisiklik aniyla veritabanindan okunur (KARARLAR K-99). */
export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <ContentPanelData>
      <EditEventClient id={id} />
    </ContentPanelData>
  );
}
