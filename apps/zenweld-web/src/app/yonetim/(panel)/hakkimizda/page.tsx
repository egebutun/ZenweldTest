import { ContentPanelData } from "@/components/admin/ContentPanelData";
import { AboutClient } from "./AboutClient";

/** Hakkımızda. Veritabani modunda her acilista ve her kayittan sonra veritabanindan okunur (KARARLAR K-99). */
export default function AdminAboutPage() {
  return (
    <ContentPanelData>
      <AboutClient />
    </ContentPanelData>
  );
}
