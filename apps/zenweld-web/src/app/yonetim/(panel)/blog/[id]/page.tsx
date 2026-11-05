import { ContentPanelData } from "@/components/admin/ContentPanelData";
import { EditBlogPostClient } from "./EditBlogPostClient";

/** Duzenleme sayfasi. Veritabani modunda kayit son degisiklik aniyla veritabanindan okunur (KARARLAR K-99). */
export default async function EditBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <ContentPanelData>
      <EditBlogPostClient id={id} />
    </ContentPanelData>
  );
}
