"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Upload } from "lucide-react";
import type { BlogPost } from "@zenweld/data";
import { createBlogPost, saveBlogPost, useDatabase } from "@zenweld/store";
import { Alert, Badge, Button, Checkbox, FormRow, Input, Tabs, Textarea } from "@zenweld/ui";
import { ProductImage } from "@zenweld/ui";
import { readImageFiles, slugify } from "@zenweld/utils";

/** "2026-08-12T09:00:00+03:00" -> "2026-08-12T09:00" (datetime-local girdisi) */
const toLocalInput = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/**
 * BLOG YAZISI FORMU
 *
 * Haber formunun aynisi; blog yazisinda galeri yerine kategori ve
 * yazar alanlari var. Kaydedilen yazi ANA SITEDE ve BAYI MAGAZASINDA
 * ayni anda gorunur — iki site de ayni listeyi okur.
 */
export function BlogForm({ item }: { item?: BlogPost }) {
  const db = useDatabase();
  const router = useRouter();
  const isNew = !item;

  const [tab, setTab] = useState("temel");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [coverInput, setCoverInput] = useState("");

  const [draft, setDraft] = useState<BlogPost>(
    item ?? {
      id: "",
      slug: "",
      slugEn: "",
      title: { tr: "", en: "" },
      excerpt: { tr: "", en: "" },
      body: { tr: "", en: "" },
      coverUrl: "",
      category: { tr: "", en: "" },
      author: "Zenweld",
      publishedAt: new Date().toISOString(),
      active: true,
    },
  );

  const set = <K extends keyof BlogPost>(key: K, value: BlogPost[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const setI18n = (key: "title" | "excerpt" | "body" | "category", lang: "tr" | "en", value: string) =>
    setDraft((d) => ({ ...d, [key]: { ...d[key], [lang]: value } }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!draft.title.tr.trim()) {
      setError("Yazı başlığı (TR) zorunludur.");
      setTab("temel");
      return;
    }

    const slug = draft.slug.trim() || slugify(draft.title.tr);
    // Ingilizce adres bos birakilirsa Ingilizce basliktan uretilir;
    // baslik da cevrilmemisse Turkce adres kullanilir.
    const slugEn =
      draft.slugEn?.trim() || (draft.title.en.trim() ? slugify(draft.title.en) : "");

    const used = [slug, slugEn].filter(Boolean);
    const clash = db.blogPosts.find(
      (p) => p.id !== draft.id && (used.includes(p.slug) || (p.slugEn && used.includes(p.slugEn))),
    );
    if (clash) {
      setError(`"${clash.slug}" adresi başka bir yazıda kullanılıyor.`);
      setTab("temel");
      return;
    }

    // Ingilizce alanlar bos birakilirsa Turkce metin kullanilir.
    const next: BlogPost = {
      ...draft,
      slug,
      slugEn: slugEn || undefined,
      author: draft.author.trim() || "Zenweld",
      title: { tr: draft.title.tr, en: draft.title.en.trim() || draft.title.tr },
      excerpt: { tr: draft.excerpt.tr, en: draft.excerpt.en.trim() || draft.excerpt.tr },
      body: { tr: draft.body.tr, en: draft.body.en.trim() || draft.body.tr },
      category: { tr: draft.category.tr, en: draft.category.en.trim() || draft.category.tr },
    };

    if (isNew) {
      const created = createBlogPost(next);
      router.push(`/yonetim/blog/${created.id}`);
    } else {
      saveBlogPost(next);
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
          <Alert tone="success">Yazı kaydedildi.</Alert>
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

          {/* Her dilin kendi adresi olur; Ingilizce sayfada Turkce slug
              gorunmesi hem okunaksiz hem de SEO acisindan zayiftir. */}
          <div className="grid gap-4 sm:grid-cols-2">
            <FormRow label="Türkçe adres (slug)" hint={`/tr/kesfet/blog/${draft.slug || "…"}`}>
              <Input value={draft.slug} onChange={(e) => set("slug", slugify(e.target.value))} />
            </FormRow>
            <FormRow
              label="İngilizce adres (slug)"
              hint={`/en/explore/blog/${draft.slugEn?.trim() || draft.slug || "…"}`}
            >
              <Input
                value={draft.slugEn ?? ""}
                onChange={(e) => set("slugEn", slugify(e.target.value))}
                placeholder="Boş bırakılırsa Türkçe adres kullanılır"
              />
            </FormRow>
          </div>

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

          <Checkbox
            label="Yayında (ana sitede ve bayi mağazasında görünür)"
            checked={draft.active !== false}
            onChange={(e) => set("active", e.target.checked)}
          />
        </div>
      )}

      {tab === "icerik" && (
        <div className="space-y-5 rounded-[4px] border border-zw-grey-200 bg-white p-5">
          <Alert tone="info">
            Özet yazı kartında, metin yazı sayfasında görünür. Metinde boş satır bırakarak
            paragraf oluşturabilirsiniz. Biçimlendirme için: satır başına <code>## </code>
            koyarsanız ara başlık, <code>- </code> koyarsanız madde olur;{" "}
            <code>**kelime**</code> yazarsanız kalın görünür.
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
                  value={draft.excerpt[lang]}
                  onChange={(e) => setI18n("excerpt", lang, e.target.value)}
                />
              </FormRow>
              <FormRow label="Yazı Metni">
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
            otomatik olarak küçültülüp WebP&apos;ye çevrilir; boyutla uğraşmanıza gerek yok.
          </Alert>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <div className="aspect-[16/9] w-64 shrink-0 overflow-hidden rounded-[4px] border border-zw-grey-200 bg-zw-grey-50">
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
                  placeholder="https://… veya /images/blog/yazi.jpg"
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
          {isNew ? "Yazıyı Oluştur" : "Değişiklikleri Kaydet"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Vazgeç
        </Button>
      </div>
    </form>
  );
}
