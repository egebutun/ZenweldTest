import { ContentPanelData } from "@/components/admin/ContentPanelData";
import { NewsListClient } from "./NewsListClient";

/** Haberler listesi. Veritabani modunda her acilista ve her kayittan sonra veritabanindan okunur (KARARLAR K-99). */
export default function AdminNewsPage() {
  return (
    <ContentPanelData>
      <NewsListClient />
    </ContentPanelData>
  );
}
