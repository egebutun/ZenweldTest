"use client";

import { useRouter } from "next/navigation";
import type { BlogPost } from "@zenweld/data";
import { createBlogPost, saveBlogPost, useDatabase } from "@zenweld/store";
import { Alert, Checkbox, FormRow, Input } from "@zenweld/ui";
import { slugify } from "@zenweld/utils";
import {
  ContentFormShell,
  FormPanel,
  ContentTextFields,
  PublishedAtField,
  SingleImageField,
  EMPTY_SLUG_ERROR,
  findSlugClash,
  resolveSlug,
  useContentForm,
} from "./content-form";
import { SeoPanel, storedLinks } from "./SeoPanel";
import { blogPostSeo } from "@/lib/seo";

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
  const isNew = !item;
  const form = useContentForm<BlogPost>(
    item ?? { ...EMPTY, publishedAt: new Date().toISOString() },
  );
  const { draft, set } = form;

  const submit = () => {
    form.setError(null);
    if (!draft.title.trim()) return form.fail("Yazı başlığı zorunludur.");

    const slug = resolveSlug(draft.slug, draft.title);
    if (!slug) return form.fail(EMPTY_SLUG_ERROR, "seo");
    const clash = findSlugClash(db.blogPosts, draft.id, slug);
    if (clash) return form.fail(`"${slug}" adresi "${clash.title}" yazısında kullanılıyor.`, "seo");

    const next: BlogPost = {
      ...draft,
      slug,
      author: draft.author.trim() || "Zenweld",
    };

    if (isNew) {
      router.push(`/yonetim/blog/${createBlogPost(next).id}`);
    } else {
      saveBlogPost(next);
      form.flashSaved();
    }
  };

  return (
    <ContentFormShell
      form={form}
      onSubmit={submit}
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
            Kapak görseli için URL girebilir veya dosya yükleyebilirsiniz. Yüklenen dosyalar
            otomatik olarak küçültülüp WebP&apos;ye çevrilir; boyutla uğraşmanıza gerek yok.
          </Alert>
          <SingleImageField
            value={draft.coverUrl}
            onChange={(url) => set("coverUrl", url)}
            onError={form.setError}
            alt={draft.title}
            placeholder="https://… veya /images/blog/yazi.jpg"
            previewClassName="aspect-[16/9] w-64"
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
