"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Trash2, Upload } from "lucide-react";
import type { ZenweldEvent } from "@zenweld/data";
import { createEvent, saveEvent, useDatabase } from "@zenweld/store";
import { Alert, Badge, Button, Checkbox, FormRow, Input, Tabs, Textarea } from "@zenweld/ui";
import { ProductImage } from "@/components/common/ProductImage";
import { useHref } from "@/lib/i18n-client";
import { readImageFiles, slugify } from "@/lib/slugify";

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

export function EventForm({ event }: { event?: ZenweldEvent }) {
  const db = useDatabase();
  const router = useRouter();
  const href = useHref();
  const isNew = !event;

  const [tab, setTab] = useState("temel");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [logoInput, setLogoInput] = useState("");
  const [imageInput, setImageInput] = useState("");

  const today = new Date().toISOString().slice(0, 10);

  const [draft, setDraft] = useState<ZenweldEvent>(
    event ?? {
      id: "",
      slug: "",
      title: { tr: "", en: "" },
      summary: { tr: "", en: "" },
      description: { tr: "", en: "" },
      startDate: today,
      endDate: today,
      venue: { tr: "", en: "" },
      city: "",
      country: "Türkiye",
      logoUrl: "",
      images: [],
      featured: false,
      active: true,
    },
  );

  const set = <K extends keyof ZenweldEvent>(key: K, value: ZenweldEvent[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const setI18n = (key: "title" | "summary" | "description" | "venue", lang: "tr" | "en", value: string) =>
    setDraft((d) => ({ ...d, [key]: { ...d[key], [lang]: value } }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!draft.title.tr.trim()) {
      setError("Etkinlik başlığı (TR) zorunludur.");
      setTab("temel");
      return;
    }
    if (draft.endDate < draft.startDate) {
      setError("Bitiş tarihi başlangıç tarihinden önce olamaz.");
      setTab("temel");
      return;
    }

    const slug = draft.slug.trim() || slugify(draft.title.tr);
    const clash = db.events.find((x) => x.slug === slug && x.id !== draft.id);
    if (clash) {
      setError(`"${slug}" adresi başka bir etkinlikte kullanılıyor.`);
      setTab("temel");
      return;
    }

    // Ingilizce alanlar bos birakilirsa Turkce metin kullanilir.
    const next: ZenweldEvent = {
      ...draft,
      slug,
      title: { tr: draft.title.tr, en: draft.title.en.trim() || draft.title.tr },
      summary: { tr: draft.summary.tr, en: draft.summary.en.trim() || draft.summary.tr },
      description: {
        tr: draft.description.tr,
        en: draft.description.en.trim() || draft.description.tr,
      },
      venue: { tr: draft.venue.tr, en: draft.venue.en.trim() || draft.venue.tr },
    };

    if (isNew) {
      const created = createEvent(next);
      router.push(href(`/admin/etkinlikler/${created.id}`));
    } else {
      saveEvent(next);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  };

  return (
    <form onSubmit={submit}>
      {error && (
        <div className="mb-4">
          <Alert tone="danger">{error}</Alert>
        </div>
      )}
      {saved && (
        <div className="mb-4">
          <Alert tone="success">Etkinlik kaydedildi.</Alert>
        </div>
      )}

      <Tabs
        className="mb-6"
        active={tab}
        onChange={setTab}
        tabs={[
          { id: "temel", label: "Temel Bilgiler" },
          { id: "aciklama", label: "Açıklamalar" },
          { id: "gorseller", label: "Logo & Fotoğraflar", badge: draft.images.length },
        ]}
      />

      {tab === "temel" && (
        <div className="space-y-4 rounded-[4px] border border-zw-grey-200 bg-white p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormRow label="Etkinlik Başlığı (TR)" required>
              <Input
                required
                value={draft.title.tr}
                onChange={(e) => {
                  setI18n("title", "tr", e.target.value);
                  if (isNew) set("slug", slugify(e.target.value));
                }}
              />
            </FormRow>
            <FormRow label="Etkinlik Başlığı (EN)" hint="Boş bırakılırsa Türkçe başlık kullanılır">
              <Input
                value={draft.title.en}
                onChange={(e) => setI18n("title", "en", e.target.value)}
              />
            </FormRow>
          </div>

          <FormRow label="URL (slug)" hint={`/kesfet/etkinlikler/${draft.slug || "…"}`}>
            <Input value={draft.slug} onChange={(e) => set("slug", slugify(e.target.value))} />
          </FormRow>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormRow label="Başlangıç Tarihi" required>
              <Input
                type="date"
                required
                value={draft.startDate}
                onChange={(e) => {
                  const startDate = e.target.value;
                  setDraft((d) => ({
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

          <div className="grid gap-4 sm:grid-cols-2">
            <FormRow label="Mekan (TR)" hint="Örn. İstanbul Fuar Merkezi">
              <Input
                value={draft.venue.tr}
                onChange={(e) => setI18n("venue", "tr", e.target.value)}
              />
            </FormRow>
            <FormRow label="Mekan (EN)">
              <Input
                value={draft.venue.en}
                onChange={(e) => setI18n("venue", "en", e.target.value)}
              />
            </FormRow>
          </div>

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
        </div>
      )}

      {tab === "aciklama" && (
        <div className="space-y-5 rounded-[4px] border border-zw-grey-200 bg-white p-5">
          <Alert tone="info">
            Kısa açıklama etkinlik kartında, detaylı açıklama etkinlik sayfasında görünür.
            Detaylı açıklamada boş satır bırakarak paragraf oluşturabilirsiniz. Biçimlendirme
            için: satır başına <code>## </code> koyarsanız ara başlık, <code>- </code> koyarsanız
            madde olur; <code>**kelime**</code> yazarsanız kalın görünür.
          </Alert>
          {(["tr", "en"] as const).map((lang) => (
            <div key={lang} className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge tone="dark">{lang.toUpperCase()}</Badge>
                <span className="text-sm font-semibold text-zw-grey-600">
                  {lang === "tr" ? "Türkçe içerik" : "İngilizce içerik (boşsa Türkçesi kullanılır)"}
                </span>
              </div>
              <FormRow label="Kısa Açıklama">
                <Textarea
                  className="min-h-20"
                  value={draft.summary[lang]}
                  onChange={(e) => setI18n("summary", lang, e.target.value)}
                />
              </FormRow>
              <FormRow label="Detaylı Açıklama">
                <Textarea
                  className="min-h-48"
                  value={draft.description[lang]}
                  onChange={(e) => setI18n("description", lang, e.target.value)}
                />
              </FormRow>
            </div>
          ))}
        </div>
      )}

      {tab === "gorseller" && (
        <div className="space-y-6 rounded-[4px] border border-zw-grey-200 bg-white p-5">
          <Alert tone="info">
            Logo ve fotoğraflar için URL girebilir veya dosya yükleyebilirsiniz. Yüklenen
            dosyalar tarayıcı deposunda saklandığı için 1.5 MB altında olmalıdır. Kalıcı
            kullanım için görselleri <code>public/images/events/</code> klasörüne koyup
            <code> /images/events/dosya.png</code> yolunu girin.
          </Alert>

          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-zw-grey-600">
              Etkinlik Logosu
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
              <div className="flex h-24 w-48 shrink-0 items-center justify-center rounded-[4px] border border-zw-grey-200 bg-zw-grey-50 p-2">
                <ProductImage
                  src={draft.logoUrl}
                  alt={draft.title.tr}
                  label={draft.title.tr || "Logo"}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    placeholder="/images/events/etkinlik.png"
                    value={logoInput}
                    onChange={(e) => setLogoInput(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    leftIcon={<ImagePlus size={16} />}
                    onClick={() => {
                      if (!logoInput.trim()) return;
                      set("logoUrl", logoInput.trim());
                      setLogoInput("");
                    }}
                  >
                    URL Kullan
                  </Button>
                  <label className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-[4px] border border-zw-grey-300 px-4 text-sm font-semibold hover:border-zw-ink">
                    <Upload size={16} />
                    Dosya Yükle
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        readImageFiles(e.target.files, (url) => set("logoUrl", url), setError);
                        e.target.value = "";
                      }}
                    />
                  </label>
                </div>
                {draft.logoUrl && (
                  <button
                    type="button"
                    onClick={() => set("logoUrl", "")}
                    className="text-sm font-semibold text-zw-red-600 hover:underline"
                  >
                    Logoyu kaldır
                  </button>
                )}
              </div>
            </div>
          </div>

          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-zw-grey-600">
              Fotoğraf Galerisi
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                placeholder="/images/events/etkinlik/1.jpg"
                value={imageInput}
                onChange={(e) => setImageInput(e.target.value)}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                leftIcon={<ImagePlus size={16} />}
                onClick={() => {
                  if (!imageInput.trim()) return;
                  set("images", [...draft.images, imageInput.trim()]);
                  setImageInput("");
                }}
              >
                URL Ekle
              </Button>
              <label className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-[4px] border border-zw-grey-300 px-4 text-sm font-semibold hover:border-zw-ink">
                <Upload size={16} />
                Dosya Yükle
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    readImageFiles(
                      e.target.files,
                      (url) => setDraft((d) => ({ ...d, images: [...d.images, url] })),
                      setError,
                    );
                    e.target.value = "";
                  }}
                />
              </label>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {draft.images.map((img, i) => (
                <div key={i} className="rounded-[4px] border border-zw-grey-200 p-2">
                  <div className="aspect-[4/3] overflow-hidden rounded-[3px] bg-zw-grey-50">
                    <ProductImage
                      src={img}
                      alt={`${draft.title.tr} — ${i + 1}`}
                      label={draft.title.tr || "Fotoğraf"}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => set("images", draft.images.filter((_, x) => x !== i))}
                    className="mt-2 w-full rounded-[3px] border border-zw-grey-300 py-1 text-xs text-zw-red-600 hover:border-zw-red-600"
                  >
                    <Trash2 size={13} className="mx-auto" />
                  </button>
                </div>
              ))}
              {draft.images.length === 0 && (
                <p className="col-span-full py-6 text-center text-sm text-zw-grey-500">
                  Henüz fotoğraf eklenmedi.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="sticky bottom-0 mt-6 flex gap-3 border-t border-zw-grey-200 bg-zw-grey-50 py-4">
        <Button type="submit" size="lg">
          {isNew ? "Etkinliği Oluştur" : "Değişiklikleri Kaydet"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Vazgeç
        </Button>
      </div>
    </form>
  );
}
