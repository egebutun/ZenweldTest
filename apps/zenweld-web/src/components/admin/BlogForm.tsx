"use client";

import { useRouter } from "next/navigation";
import { blogDraftError, blogSlugTakenText, type BlogPost } from "@zenweld/data";
import { useDatabase } from "@zenweld/store";
import { Alert, Checkbox, FormRow, Input } from "@zenweld/ui";
import { slugify } from "@zenweld/utils";
import {
  ContentFormShell,
  FormPanel,
  ContentTextFields,
  PublishedAtField,
  SingleImageField,
  EMPTY_SLUG_ERROR,
  errorTab,
  findSlugClash,
  resolveSlug,
  useContentForm,
} from "./content-form";
import { SeoPanel, storedLinks } from "./SeoPanel";
import { blogPostSeo } from "@/lib/seo";
import { useContentActions } from "@/lib/admin-content";

const EMPTY: BlogPost = {
  id: "",
  slug: "",
  title: "",
  excerpt: "",
  body: "",
  coverUrl: "",
  category: "",
  author: "Zenweld",
  publishedAt: "",
  active: true,
};

/** BLOG YAZISI FORMU — haber formunun aynisi; galeri yerine kategori ve yazar var. */
export function BlogForm({ item }: { item?: BlogPost }) {
  const db = useDatabase();
  const router = useRouter();
  const actions = useContentActions();
  const isNew = !item;
  const form = useContentForm<BlogPost>(
    item ?? { ...EMPTY, publishedAt: new Date().toISOString() },
  );
  const { draft, set } = form;

  const submit = async () => {
    form.setError(null);
    const problem = blogDraftError(draft);
    if (problem) return form.fail(problem);

    const slug = resolveSlug(draft.slug, draft.title);
    if (!slug) return form.fail(EMPTY_SLUG_ERROR, "seo");
    const clash = findSlugClash(db.blogPosts, draft.id, slug);
    if (clash) return form.fail(blogSlugTakenText(slug, clash.title), "seo");

    const next: BlogPost = {
      ...draft,
      slug,
      author: draft.author.trim() || "Zenweld",
      // Eski kayitta alan yoksa yayinda sayilir.
      active: draft.active !== false,
    };
    const answer = await actions.blog.save(next, item);
    if (!answer.ok) return form.fail(answer.error, errorTab(answer.error, "gorsel"));
    if (isNew) router.push(`/yonetim/blog/${answer.id}`);
    else form.flashSaved();
  };

  return (
    <ContentFormShell
      form={form}
      onSubmit={() => void submit()}
      pending={actions.pending}
      savedText="Yazı kaydedildi."
      submitLabel={isNew ? "Yazıyı Oluştur" : "Değişiklikleri Kaydet"}
      tabs={[
        { id: "temel", label: "Temel Bilgiler" },
        { id: "icerik", label: "İçerik" },
        { id: "gorsel", label: "Kapak Görseli" },
        { id: "seo", label: "SEO" },
      ]}
    >
      {form.tab === "temel" && (
        <FormPanel>
          {/* Yazi linki SEO sekmesinde; yeni yazida basliktan otomatik olusur. */}
          <FormRow label="Yazı Başlığı" required>
            <Input
              required
              value={draft.title}
              onChange={(e) => {
                set("title", e.target.value);
                if (isNew) set("slug", slugify(e.target.value));
              }}
            />
          </FormRow>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormRow label="Kategori" hint="Örn. Teknik Rehber, İpuçları, Bakım">
              <Input
                value={draft.category}
                onChange={(e) => set("category", e.target.value)}
                list="blog-kategorileri"
              />
              <datalist id="blog-kategorileri">
                {Array.from(new Set(db.blogPosts.map((p) => p.category)))
                  .filter(Boolean)
                  .map((c) => (
                    <option key={c} value={c} />
                  ))}
              </datalist>
            </FormRow>
            <FormRow label="Yazar">
              <Input value={draft.author} onChange={(e) => set("author", e.target.value)} />
            </FormRow>
          </div>

          <PublishedAtField value={draft.publishedAt} onChange={(v) => set("publishedAt", v)} />

          <Checkbox
            label="Yayında (sitede görünür)"
            checked={draft.active !== false}
            onChange={(e) => set("active", e.target.checked)}
          />
        </FormPanel>
      )}

      {form.tab === "icerik" && (
        <ContentTextFields
          intro="Özet yazı kartında, metin yazı sayfasında görünür."
          fields={[
            { key: "excerpt", label: "Özet" },
            { key: "body", label: "Yazı Metni", tall: true },
          ]}
          values={draft}
          onChange={set}
        />
      )}

      {form.tab === "gorsel" && (
        <FormPanel>
          <Alert tone="info">
            {actions.uploadNote ??
              "Kapak görseli için URL girebilir veya dosya yükleyebilirsiniz. Yüklenen dosyalar otomatik olarak küçültülüp WebP'ye çevrilir; boyutla uğraşmanıza gerek yok."}
          </Alert>
          <SingleImageField
            value={draft.coverUrl}
            onChange={(url) => set("coverUrl", url)}
            onError={form.setError}
            alt={draft.title}
            placeholder="https://… veya /images/blog/yazi.jpg"
            previewClassName="aspect-[16/9] w-64"
            uploadNote={actions.uploadNote}
          />
        </FormPanel>
      )}

      {form.tab === "seo" && (
        <SeoPanel
          noun="Yazı"
          path="/blog"
          slug={draft.slug}
          onSlugChange={(v) => set("slug", v)}
          {...storedLinks("/blog", item && db.blogPosts.find((x) => x.id === item.id))}
          value={draft.seo}
          onChange={(seo) => set("seo", seo)}
          compute={(seo) => blogPostSeo({ ...draft, seo })}
          descriptionFallback="yazının özeti"
        />
      )}
    </ContentFormShell>
  );
}
