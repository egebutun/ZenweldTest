import { ContentPanelData } from "@/components/admin/ContentPanelData";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { BlogForm } from "@/components/admin/BlogForm";

export default function NewBlogPostPage() {
  return (
    <ContentPanelData>
      <AdminPageHeader
        title="Yeni Blog Yazısı"
        description="Kaydedilen yazı sitede yayınlanır."
      />
      <BlogForm />
    </ContentPanelData>
  );
}
