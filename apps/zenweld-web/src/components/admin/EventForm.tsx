"use client";

import { useRouter } from "next/navigation";
import type { ZenweldEvent } from "@zenweld/data";
import { createEvent, saveEvent, useDatabase } from "@zenweld/store";
import { Alert, Checkbox, FormRow, Input } from "@zenweld/ui";
import { localDateKey, logoAlternates, slugify } from "@zenweld/utils";
import {
  ContentFormShell,
  FormPanel,
  GalleryField,
  ContentTextFields,
  SingleImageField,
  findSlugClash,
  resolveSlug,
  useContentForm,
} from "./content-form";
import { SeoPanel, storedLinks } from "./SeoPanel";
import { eventSeo } from "@/lib/seo";

const COUNTRIES = [
  "Türkiye",
  "Birleşik Arap Emirlikleri",
  "Suudi Arabistan",
  "Almanya",
  "İtalya",
  "Fransa",
  "Rusya",
  "Mısır",
  "Irak",
  "Azerbaycan",
];

const EMPTY: ZenweldEvent = {
  id: "",
  slug: "",
  title: "",
  summary: "",
  description: "",
  startDate: "",
  endDate: "",
  venue: "",
  city: "",
  country: "Türkiye",
  logoUrl: "",
  images: [],
  featured: false,
  active: true,
};

/**
 * ETKINLIK FORMU
 *
 * Tarih, mekan ve logo alanlari haber/blog formlarindan farklidir.
 */
export function EventForm({ event }: { event?: ZenweldEvent }) {
  const db = useDatabase();
  const router = useRouter();
  const isNew = !event;
  const today = localDateKey();
  const form = useContentForm<ZenweldEvent>(
    event ?? { ...EMPTY, startDate: today, endDate: today },
  );
  const { draft, set } = form;

  const submit = () => {
    form.setError(null);
    if (!draft.title.trim()) return form.fail("Etkinlik adı zorunludur.");
    if (draft.endDate < draft.startDate) {
      return form.fail("Bitiş tarihi başlangıç tarihinden önce olamaz.");
    }

    const slug = resolveSlug(draft.slug, draft.title);
    if (findSlugClash(db.events, draft.id, slug)) {
      return form.fail(`"${slug}" adresi başka bir etkinlikte kullanılıyor.`);
    }

    const next: ZenweldEvent = { ...draft, slug };

    if (isNew) {
      router.push(`/yonetim/etkinlikler/${createEvent(next).id}`);
    } else {
      saveEvent(next);
      form.flashSaved();
    }
  };

  return (
    <ContentFormShell
      form={form}
      onSubmit={submit}
      savedText="Etkinlik kaydedildi."
      submitLabel={isNew ? "Etkinliği Oluştur" : "Değişiklikleri Kaydet"}
      tabs={[
        { id: "temel", label: "Temel Bilgiler" },
        { id: "aciklama", label: "Açıklamalar" },
        { id: "gorseller", label: "Logo & Fotoğraflar", badge: draft.images.length },
        { id: "seo", label: "SEO" },
      ]}
    >
      {form.tab === "temel" && (
        <FormPanel>
          {/* Etkinlik linki SEO sekmesinde; yeni etkinlikte addan otomatik olusur. */}
          <FormRow label="Etkinlik Adı" required>
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
            <FormRow label="Başlangıç Tarihi" required>
              <Input
                type="date"
                required
                value={draft.startDate}
                onChange={(e) => {
                  const startDate = e.target.value;
                  form.setDraft((d) => ({
                    ...d,
                    startDate,
                    endDate: d.endDate < startDate ? startDate : d.endDate,
                  }));
                }}
              />
            </FormRow>
            <FormRow label="Bitiş Tarihi" required>
              <Input
                type="date"
                required
                min={draft.startDate}
                value={draft.endDate}
                onChange={(e) => set("endDate", e.target.value)}
              />
            </FormRow>
          </div>

          <FormRow label="Mekan" hint="Örn. İstanbul Fuar Merkezi">
            <Input value={draft.venue} onChange={(e) => set("venue", e.target.value)} />
          </FormRow>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormRow label="Şehir">
              <Input value={draft.city} onChange={(e) => set("city", e.target.value)} />
            </FormRow>
            <FormRow label="Ülke" hint="Etkinlik sayfasındaki filtre bu alanı kullanır">
              <Input
                list="zw-country-list"
                value={draft.country}
                onChange={(e) => set("country", e.target.value)}
              />
              <datalist id="zw-country-list">
                {COUNTRIES.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </FormRow>
          </div>

          <FormRow label="Etkinlik Web Sitesi">
            <Input
              type="url"
              value={draft.websiteUrl ?? ""}
              onChange={(e) => set("websiteUrl", e.target.value || undefined)}
              placeholder="https://…"
            />
          </FormRow>

          <div className="grid gap-3 sm:grid-cols-2">
            <Checkbox
              label="Yayında (aktif)"
              checked={draft.active}
              onChange={(e) => set("active", e.target.checked)}
            />
            <Checkbox
              label="Öne çıkan"
              checked={draft.featured}
              onChange={(e) => set("featured", e.target.checked)}
            />
          </div>
        </FormPanel>
      )}

      {form.tab === "aciklama" && (
        <ContentTextFields
          intro="Kısa açıklama etkinlik kartında, detaylı açıklama etkinlik sayfasında görünür."
          fields={[
            { key: "summary", label: "Kısa Açıklama" },
            { key: "description", label: "Detaylı Açıklama", tall: true },
          ]}
          values={draft}
          onChange={set}
        />
      )}

      {form.tab === "gorseller" && (
        <FormPanel>
          <Alert tone="info">
            Logo ve fotoğraflar için URL girebilir veya dosya yükleyebilirsiniz. Yüklenen dosyalar
            otomatik olarak küçültülüp WebP&apos;ye çevrilir; boyutla uğraşmanıza gerek yok. Kalıcı
            kullanım için görselleri <code>public/images/events/</code> klasörüne koyup
            <code> /images/events/dosya.png</code> yolunu girin.
          </Alert>

          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-zw-grey-600">
              Etkinlik Logosu
            </div>
            {/* Logo yuklenirken cevresindeki bos beyaz kenar otomatik kesilir,
                boylece detay sayfasinda digerleriyle ayni agirlikta gorunur. */}
            <SingleImageField
              value={draft.logoUrl}
              onChange={(url) => set("logoUrl", url)}
              onError={form.setError}
              alt={draft.title}
              placeholder="/images/events/etkinlik.png"
              previewClassName="flex h-24 w-48 items-center justify-center p-2"
              imageClassName="max-h-full max-w-full object-contain"
              alternates={logoAlternates(draft.logoUrl)}
              trimEdges
              removeLabel="Logoyu kaldır"
            />
          </div>

          <GalleryField
            images={draft.images}
            onChange={(update) => form.setDraft((d) => ({ ...d, images: update(d.images) }))}
            onError={form.setError}
            alt={draft.title}
            placeholder="/images/events/etkinlik/1.jpg"
          />
        </FormPanel>
      )}

      {form.tab === "seo" && (
        <SeoPanel
          noun="Etkinlik"
          path="/etkinlikler"
          slug={draft.slug}
          onSlugChange={(v) => set("slug", v)}
          {...storedLinks("/etkinlikler", event && db.events.find((x) => x.id === event.id))}
          value={draft.seo}
          onChange={(seo) => set("seo", seo)}
          compute={(seo) => eventSeo({ ...draft, seo })}
          descriptionFallback="etkinliğin kısa açıklaması"
        />
      )}
    </ContentFormShell>
  );
}
