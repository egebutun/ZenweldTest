import { ContentPanelData } from "@/components/admin/ContentPanelData";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { NewsForm } from "@/components/admin/NewsForm";

export default function NewNewsPage() {
  return (
    <ContentPanelData>
      <AdminPageHeader
        title="Yeni Haber"
        description="Duyuru, basın açıklaması veya kurumsal haber ekleyin."
      />
      <NewsForm />
    </ContentPanelData>
  );
}
