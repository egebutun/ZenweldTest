"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Upload } from "lucide-react";
import type { NewsItem } from "@zenweld/data";
import { createNews, saveNews, useDatabase } from "@zenweld/store";
import { Alert, Badge, Button, Checkbox, FormRow, Input, Tabs, Textarea } from "@zenweld/ui";
import { ProductImage } from "@/components/common/ProductImage";
import { useHref } from "@/lib/i18n-client";
import { readImageFiles, slugify } from "@/lib/slugify";

/** "2026-08-12T09:00:00+03:00" -> "2026-08-12T09:00" (datetime-local girdisi) */
const toLocalInput = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export function NewsForm({ item }: { item?: NewsItem }) {
  const db = useDatabase();
  const router = useRouter();
  const href = useHref();
  const isNew = !item;

  const [tab, setTab] = useState("temel");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [coverInput, setCoverInput] = useState("");

  const [draft, setDraft] = useState<NewsItem>(
    item ?? {
      id: "",
      slug: "",
      title: { tr: "", en: "" },
      summary: { tr: "", en: "" },
      body: { tr: "", en: "" },
      coverUrl: "",
      category: { tr: "Kurumsal", en: "Corporate" },
      publishedAt: new Date().toISOString(),
      featured: false,
      active: true,
    },
  );

  const set = <K extends keyof NewsItem>(key: K, value: NewsItem[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const setI18n = (key: "title" | "summary" | "body" | "category", lang: "tr" | "en", value: string) =>
    setDraft((d) => ({ ...d, [key]: { ...d[key], [lang]: value } }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!draft.title.tr.trim()) {
      setError("Haber başlığı (TR) zorunludur.");
      setTab("temel");
      return;
    }

    const slug = draft.slug.trim() || slugify(draft.title.tr);
    const clash = db.news.find((n) => n.slug === slug && n.id !== draft.id);
    if (clash) {
      setError(`"${slug}" adresi başka bir haberde kullanılıyor.`);
      setTab("temel");
      return;
    }

    // Ingilizce alanlar bos birakilirsa Turkce metin kullanilir.
    const next: NewsItem = {
      ...draft,
      slug,
      title: { tr: draft.title.tr, en: draft.title.en.trim() || draft.title.tr },
      summary: { tr: draft.summary.tr, en: draft.summary.en.trim() || draft.summary.tr },
      body: { tr: draft.body.tr, en: draft.body.en.trim() || draft.body.tr },
      category: { tr: draft.category.tr, en: draft.category.en.trim() || draft.category.tr },
    };

    if (isNew) {
      const created = createNews(next);
      router.push(href(`/admin/haberler/${created.id}`));
    } else {
      saveNews(next);
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
          <Alert tone="success">Haber kaydedildi.</Alert>
        </div>
      )}

      <Tabs
        className="mb-6"
        active={tab}
        onChange={setTab}
        tabs={[
          { id: "temel", label: "Temel Bilgiler" },
          { id: "icerik", label: "İçerik" },
          { id: "gorsel", label: "Kapak Görseli" },
        ]}
      />

      {tab === "temel" && (
        <div className="space-y-4 rounded-[4px] border border-zw-grey-200 bg-white p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormRow label="Haber Başlığı (TR)" required>
              <Input
                required
                value={draft.title.tr}
                onChange={(e) => {
                  setI18n("title", "tr", e.target.value);
                  if (isNew) set("slug", slugify(e.target.value));
                }}
              />
            </FormRow>
            <FormRow label="Haber Başlığı (EN)" hint="Boş bırakılırsa Türkçe başlık kullanılır">
              <Input
                value={draft.title.en}
                onChange={(e) => setI18n("title", "en", e.target.value)}
              />
            </FormRow>
          </div>

          <FormRow label="URL (slug)" hint={`/kesfet/haberler/${draft.slug || "…"}`}>
            <Input value={draft.slug} onChange={(e) => set("slug", slugify(e.target.value))} />
          </FormRow>

          <div className="grid gap-4 sm:grid-cols-3">
            <FormRow label="Kategori (TR)" hint="Örn. Kurumsal, Ürün, İhracat">
              <Input
                value={draft.category.tr}
                onChange={(e) => setI18n("category", "tr", e.target.value)}
              />
            </FormRow>
            <FormRow label="Kategori (EN)">
              <Input
                value={draft.category.en}
                onChange={(e) => setI18n("category", "en", e.target.value)}
              />
            </FormRow>
            <FormRow label="Yayın Tarihi">
              <Input
                type="datetime-local"
                value={toLocalInput(draft.publishedAt)}
                onChange={(e) => {
                  const d = new Date(e.target.value);
                  if (!Number.isNaN(d.getTime())) set("publishedAt", d.toISOString());
                }}
              />
            </FormRow>
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
        </div>
      )}

      {tab === "icerik" && (
        <div className="space-y-5 rounded-[4px] border border-zw-grey-200 bg-white p-5">
          <Alert tone="info">
            Özet haber kartında, metin haber sayfasında görünür. Metinde boş satır bırakarak
            paragraf oluşturabilirsiniz.
          </Alert>
          {(["tr", "en"] as const).map((lang) => (
            <div key={lang} className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge tone="dark">{lang.toUpperCase()}</Badge>
                <span className="text-sm font-semibold text-zw-grey-600">
                  {lang === "tr" ? "Türkçe içerik" : "İngilizce içerik (boşsa Türkçesi kullanılır)"}
                </span>
              </div>
              <FormRow label="Özet">
                <Textarea
                  className="min-h-20"
                  value={draft.summary[lang]}
                  onChange={(e) => setI18n("summary", lang, e.target.value)}
                />
              </FormRow>
              <FormRow label="Haber Metni">
                <Textarea
                  className="min-h-56"
                  value={draft.body[lang]}
                  onChange={(e) => setI18n("body", lang, e.target.value)}
                />
              </FormRow>
            </div>
          ))}
        </div>
      )}

      {tab === "gorsel" && (
        <div className="space-y-4 rounded-[4px] border border-zw-grey-200 bg-white p-5">
          <Alert tone="info">
            Kapak görseli için URL girebilir veya dosya yükleyebilirsiniz. Yüklenen dosyalar
            tarayıcı deposunda saklandığı için 1.5 MB altında olmalıdır.
          </Alert>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <div className="aspect-[4/3] w-56 shrink-0 overflow-hidden rounded-[4px] border border-zw-grey-200 bg-zw-grey-50">
              <ProductImage
                src={draft.coverUrl}
                alt={draft.title.tr}
                label={draft.title.tr || "Kapak"}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  placeholder="https://… veya /images/news/haber.jpg"
                  value={coverInput}
                  onChange={(e) => setCoverInput(e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  leftIcon={<ImagePlus size={16} />}
                  onClick={() => {
                    if (!coverInput.trim()) return;
                    set("coverUrl", coverInput.trim());
                    setCoverInput("");
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
                      readImageFiles(e.target.files, (url) => set("coverUrl", url), setError);
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>
              {draft.coverUrl && (
                <button
                  type="button"
                  onClick={() => set("coverUrl", "")}
                  className="text-sm font-semibold text-zw-red-600 hover:underline"
                >
                  Görseli kaldır
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="sticky bottom-0 mt-6 flex gap-3 border-t border-zw-grey-200 bg-zw-grey-50 py-4">
        <Button type="submit" size="lg">
          {isNew ? "Haberi Oluştur" : "Değişiklikleri Kaydet"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Vazgeç
        </Button>
      </div>
    </form>
  );
}
