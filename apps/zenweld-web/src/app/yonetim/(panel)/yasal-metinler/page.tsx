import { PagesPanelData } from "@/components/admin/PagesPanelData";
import { LegalListClient } from "./LegalListClient";

/** Yasal Metinler. Veritabani modunda her acilista veritabanindan okunur (KARARLAR K-99). */
export default function AdminLegalPagesPage() {
  return (
    <PagesPanelData>
      <LegalListClient />
    </PagesPanelData>
  );
}
