import { PagesPanelData } from "@/components/admin/PagesPanelData";
import { PageSeoClient } from "./PageSeoClient";

/** Sayfa SEO. Veritabani modunda her acilista ve her kayittan sonra veritabanindan okunur (KARARLAR K-99). */
export default function AdminPageSeoPage() {
  return (
    <PagesPanelData>
      <PageSeoClient />
    </PagesPanelData>
  );
}
