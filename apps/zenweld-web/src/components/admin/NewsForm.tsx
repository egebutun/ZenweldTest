"use client";

import { useRouter } from "next/navigation";
import { newsDraftError, newsSlugTakenText, type NewsItem } from "@zenweld/data";
import { useDatabase } from "@zenweld/store";
import { Alert, Checkbox, FormRow, Input } from "@zenweld/ui";
import { slugify } from "@zenweld/utils";
import {
  ContentFormShell,
  FormPanel,
  GalleryField,
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
import { newsSeo } from "@/lib/seo";
import { useContentActions } from "@/lib/admin-content";

const EMPTY: NewsItem = {
  id: "",
  slug: "",
  title: "",
  summary: "",
  body: "",
  coverUrl: "",
  images: [],
  publishedAt: "",
  active: true,
};

export function NewsForm({ item }: { item?: NewsItem }) {
  const db = useDatabase();
  const router = useRouter();
  const actions = useContentActions();
  const isNew = !item;
  const form = useContentForm<NewsItem>(
    item ?? { ...EMPTY, publishedAt: new Date().toISOString() },
  );
  const { draft, set } = form;

  const submit = async () => {
    form.setError(null);
    const problem = newsDraftError(draft);
    if (problem) return form.fail(problem);

    const slug = resolveSlug(draft.slug, draft.title);
    if (!slug) return form.fail(EMPTY_SLUG_ERROR, "seo");
    const clash = findSlugClash(db.news, draft.id, slug);
    if (clash) return form.fail(newsSlugTakenText(slug, clash.title), "seo");

    const answer = await actions.news.save({ ...draft, slug }, item);
    if (!answer.ok) return form.fail(answer.error, errorTab(answer.error, "gorsel"));
    if (isNew) router.push(`/yonetim/haberler/${answer.id}`);
    else form.flashSaved();
  };

  return (
    <ContentFormShell
      form={form}
      onSubmit={() => void submit()}
      pending={actions.pending}
      savedText="Haber kaydedildi."
      submitLabel={isNew ? "Haberi Oluştur" : "Değişiklikleri Kaydet"}
      tabs={[
        { id: "temel", label: "Temel Bilgiler" },
        { id: "icerik", label: "İçerik" },
        { id: "gorsel", label: "Görseller" },
        { id: "seo", label: "SEO" },
      ]}
    >
      {form.tab === "temel" && (
        <FormPanel>
          {/* Haber linki SEO sekmesinde; yeni haberde basliktan otomatik olusur. */}
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

          <div className="grid gap-4 sm:grid-cols-2">
            <PublishedAtField value={draft.publishedAt} onChange={(v) => set("publishedAt", v)} />
          </div>

          <Checkbox
            label="Yayında (aktif)"
            checked={draft.active}
            onChange={(e) => set("active", e.target.checked)}
          />
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
            {actions.uploadNote ??
              "Kapak görseli ve galeri fotoğrafları için URL girebilir veya dosya yükleyebilirsiniz. Yüklenen dosyalar otomatik olarak küçültülüp WebP'ye çevrilir; boyutla uğraşmanıza gerek yok."}
          </Alert>
          <SingleImageField
            value={draft.coverUrl}
            onChange={(url) => set("coverUrl", url)}
            onError={form.setError}
            alt={draft.title}
            placeholder="https://… veya /images/news/haber.jpg"
            previewClassName="aspect-[4/3] w-56"
            uploadNote={actions.uploadNote}
          />
          <div className="border-t border-zw-grey-200 pt-5">
            <GalleryField
              images={draft.images}
              onChange={(update) => form.setDraft((d) => ({ ...d, images: update(d.images) }))}
              onError={form.setError}
              alt={draft.title}
              placeholder="/images/news/haber/1.jpg"
              description="Kapak görselinin yanı sıra habere istediğiniz kadar fotoğraf ekleyebilirsiniz. Bunlar haber sayfasının altında görünür."
              uploadNote={actions.uploadNote}
            />
          </div>
        </FormPanel>
      )}

      {form.tab === "seo" && (
        <SeoPanel
          noun="Haber"
          path="/haberler"
          slug={draft.slug}
          onSlugChange={(v) => set("slug", v)}
          {...storedLinks("/haberler", item && db.news.find((x) => x.id === item.id))}
          value={draft.seo}
          onChange={(seo) => set("seo", seo)}
          compute={(seo) => newsSeo({ ...draft, seo })}
          descriptionFallback="haberin özeti"
        />
      )}
    </ContentFormShell>
  );
}
