"use client";

import { useRouter } from "next/navigation";
import type { BlogPost } from "@zenweld/data";
import { createBlogPost, saveBlogPost, useDatabase } from "@zenweld/store";
import { Alert, Checkbox, FormRow, Input } from "@zenweld/ui";
import { slugify } from "@zenweld/utils";
import {
  ContentFormShell,
  FormPanel,
  LocalizedTextFields,
  PublishedAtField,
  SingleImageField,
  SlugFields,
  findSlugClash,
  resolveSlugs,
  useContentForm,
  withTrFallback,
} from "./content-form";

const EMPTY: BlogPost = {
  id: "",
  slug: "",
  slugEn: "",
  title: { tr: "", en: "" },
  excerpt: { tr: "", en: "" },
  body: { tr: "", en: "" },
  coverUrl: "",
  category: { tr: "", en: "" },
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
  const { draft, set, setI18n } = form;

  const submit = () => {
    form.setError(null);
    if (!draft.title.tr.trim()) return form.fail("Yazı başlığı (TR) zorunludur.");

    const { slug, slugEn } = resolveSlugs(draft, draft.title);
    const clash = findSlugClash(db.blogPosts, draft.id, [slug, slugEn]);
    if (clash) return form.fail(`"${clash.slug}" adresi başka bir yazıda kullanılıyor.`);

    const next: BlogPost = {
      ...draft,
      slug,
      slugEn: slugEn || undefined,
      author: draft.author.trim() || "Zenweld",
      title: withTrFallback(draft.title),
      excerpt: withTrFallback(draft.excerpt),
      body: withTrFallback(draft.body),
      category: withTrFallback(draft.category),
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
      ]}
    >
      {form.tab === "temel" && (
        <FormPanel>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormRow label="Yazı Başlığı (TR)" required>
              <Input
                required
                value={draft.title.tr}
                onChange={(e) => {
                  setI18n("title", "tr", e.target.value);
                  if (isNew) set("slug", slugify(e.target.value));
                }}
              />
            </FormRow>
            <FormRow label="Yazı Başlığı (EN)" hint="Boş bırakılırsa Türkçe başlık kullanılır">
              <Input
                value={draft.title.en}
                onChange={(e) => {
                  setI18n("title", "en", e.target.value);
                  // Ingilizce adres, Ingilizce basliktan kendiliginden uretilir.
                  if (isNew) set("slugEn", slugify(e.target.value));
                }}
              />
            </FormRow>
          </div>

          <SlugFields
            slug={draft.slug}
            slugEn={draft.slugEn}
            onChange={set}
            trPath="/tr/blog"
            enPath="/en/blog"
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <FormRow label="Kategori (TR)" hint="Örn. Teknik Rehber, İpuçları, Bakım">
              <Input
                value={draft.category.tr}
                onChange={(e) => setI18n("category", "tr", e.target.value)}
                list="blog-kategorileri"
              />
              <datalist id="blog-kategorileri">
                {Array.from(new Set(db.blogPosts.map((p) => p.category.tr)))
                  .filter(Boolean)
                  .map((c) => (
                    <option key={c} value={c} />
                  ))}
              </datalist>
            </FormRow>
            <FormRow label="Kategori (EN)" hint="Boş bırakılırsa Türkçesi kullanılır">
              <Input
                value={draft.category.en}
                onChange={(e) => setI18n("category", "en", e.target.value)}
              />
            </FormRow>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormRow label="Yazar">
              <Input value={draft.author} onChange={(e) => set("author", e.target.value)} />
            </FormRow>
            <PublishedAtField value={draft.publishedAt} onChange={(v) => set("publishedAt", v)} />
          </div>

          <Checkbox
            label="Yayında (sitede görünür)"
            checked={draft.active !== false}
            onChange={(e) => set("active", e.target.checked)}
          />
        </FormPanel>
      )}

      {form.tab === "icerik" && (
        <LocalizedTextFields
          intro="Özet yazı kartında, metin yazı sayfasında görünür."
          fields={[
            { key: "excerpt", label: "Özet" },
            { key: "body", label: "Yazı Metni", tall: true },
          ]}
          values={draft}
          onChange={setI18n}
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
            alt={draft.title.tr}
            placeholder="https://… veya /images/blog/yazi.jpg"
            previewClassName="aspect-[16/9] w-64"
          />
        </FormPanel>
      )}
    </ContentFormShell>
  );
}
