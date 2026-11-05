import { ContentPanelData } from "@/components/admin/ContentPanelData";
import { BlogListClient } from "./BlogListClient";

/** Blog listesi. Veritabani modunda her acilista ve her kayittan sonra veritabanindan okunur (KARARLAR K-99). */
export default function AdminBlogPage() {
  return (
    <ContentPanelData>
      <BlogListClient />
    </ContentPanelData>
  );
}
