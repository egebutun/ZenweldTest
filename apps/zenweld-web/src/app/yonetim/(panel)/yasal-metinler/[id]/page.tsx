import { PagesPanelData } from "@/components/admin/PagesPanelData";
import { EditLegalClient } from "./EditLegalClient";

/** Yasal metni duzenleme. Veritabani modunda metin son degisiklik aniyla veritabanindan okunur (KARARLAR K-99). */
export default async function EditLegalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <PagesPanelData>
      <EditLegalClient id={id} />
    </PagesPanelData>
  );
}
