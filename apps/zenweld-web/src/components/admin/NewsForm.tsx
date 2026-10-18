"use client";

import { useRouter } from "next/navigation";
import type { NewsItem } from "@zenweld/data";
import { createNews, saveNews, useDatabase } from "@zenweld/store";
import { Alert, Checkbox, FormRow, Input } from "@zenweld/ui";
import { slugify } from "@zenweld/utils";
import {
  ContentFormShell,
  FormPanel,
  GalleryField,
  ContentTextFields,
  PublishedAtField,
  SingleImageField,
  SlugField,
  findSlugClash,
  resolveSlug,
  useContentForm,
} from "./content-form";

const EMPTY: NewsItem = {
  id: "",
  slug: "",
  title: "",
  summary: "",
  body: "",
  coverUrl: "",
  images: [],
  publishedAt: "",
  featured: false,
  active: true,
};

export function NewsForm({ item }: { item?: NewsItem }) {
  const db = useDatabase();
  const router = useRouter();
  const isNew = !item;
  const form = useContentForm<NewsItem>(
    item ?? { ...EMPTY, publishedAt: new Date().toISOString() },
  );
  const { draft, set } = form;

  const submit = () => {
    form.setError(null);
    if (!draft.title.trim()) return form.fail("Haber başlığı zorunludur.");

    const slug = resolveSlug(draft.slug, draft.title);
    const clash = findSlugClash(db.news, draft.id, slug);
    if (clash) return form.fail(`"${clash.slug}" adresi başka bir haberde kullanılıyor.`);

    const next: NewsItem = { ...draft, slug };

    if (isNew) {
      router.push(`/yonetim/haberler/${createNews(next).id}`);
    } else {
      saveNews(next);
      form.flashSaved();
    }
  };

  return (
    <ContentFormShell
      form={form}
      onSubmit={submit}
      savedText="Haber kaydedildi."
      submitLabel={isNew ? "Haberi Oluştur" : "Değişiklikleri Kaydet"}
      tabs={[
        { id: "temel", label: "Temel Bilgiler" },
        { id: "icerik", label: "İçerik" },
        { id: "gorsel", label: "Görseller" },
      ]}
    >
      {form.tab === "temel" && (
        <FormPanel>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormRow label="Haber Başlığı" required>
              <Input
                required
                value={draft.title}
                onChange={(e) => {
                  set("title", e.target.value);
                  if (isNew) set("slug", slugify(e.target.value));
                }}
              />
            </FormRow>
            <SlugField slug={draft.slug} onChange={(v) => set("slug", v)} path="/haberler" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <PublishedAtField value={draft.publishedAt} onChange={(v) => set("publishedAt", v)} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Checkbox
              label="Yayında (aktif)"
              checked={draft.active}
              onChange={(e) => set("active", e.target.checked)}
            />
            <Checkbox
              label="Öne çıkan (haberler sayfasında manşet)"
              checked={draft.featured}
              onChange={(e) => set("featured", e.target.checked)}
            />
          </div>
        </FormPanel>
      )}

      {form.tab === "icerik" && (
        <ContentTextFields
          intro="Özet haber kartında, metin haber sayfasında görünür."
          fields={[
            { key: "summary", label: "Özet" },
            { key: "body", label: "Haber Metni", tall: true },
          ]}
          values={draft}
          onChange={set}
        />
      )}

      {form.tab === "gorsel" && (
        <FormPanel>
          <Alert tone="info">
            Kapak görseli ve galeri fotoğrafları için URL girebilir veya dosya yükleyebilirsiniz.
            Yüklenen dosyalar otomatik olarak küçültülüp WebP&apos;ye çevrilir; boyutla uğraşmanıza
            gerek yok.
          </Alert>
          <SingleImageField
            value={draft.coverUrl}
            onChange={(url) => set("coverUrl", url)}
            onError={form.setError}
            alt={draft.title}
            placeholder="https://… veya /images/news/haber.jpg"
            previewClassName="aspect-[4/3] w-56"
          />
          <div className="border-t border-zw-grey-200 pt-5">
            <GalleryField
              images={draft.images}
              onChange={(update) => form.setDraft((d) => ({ ...d, images: update(d.images) }))}
              onError={form.setError}
              alt={draft.title}
              placeholder="/images/news/haber/1.jpg"
              description="Kapak görselinin yanı sıra habere istediğiniz kadar fotoğraf ekleyebilirsiniz. Bunlar haber sayfasının altında görünür."
            />
          </div>
        </FormPanel>
      )}
    </ContentFormShell>
  );
}
