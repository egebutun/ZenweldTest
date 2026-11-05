import { ContentPanelData } from "@/components/admin/ContentPanelData";
import { FaqClient } from "./FaqClient";

/** Sık Sorulan Sorular. Veritabani modunda her acilista ve her kayittan sonra veritabanindan okunur (KARARLAR K-99). */
export default function AdminFaqPage() {
  return (
    <ContentPanelData>
      <FaqClient />
    </ContentPanelData>
  );
}
