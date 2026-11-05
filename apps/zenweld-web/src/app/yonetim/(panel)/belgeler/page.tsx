import { PagesPanelData } from "@/components/admin/PagesPanelData";
import { DocumentsClient } from "./DocumentsClient";

/** Belgeler. Veritabani modunda her acilista ve her kayittan sonra veritabanindan okunur (KARARLAR K-99, K-104); urun secimi de. */
export default function AdminDocumentsPage() {
  return (
    <PagesPanelData products>
      <DocumentsClient />
    </PagesPanelData>
  );
}
