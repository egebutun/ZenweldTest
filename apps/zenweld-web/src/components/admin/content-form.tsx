"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Trash2, Upload } from "lucide-react";
import { Alert, Button, FormRow, Input, ProductImage, Tabs, Textarea } from "@zenweld/ui";
import { readImageFiles, slugify } from "@zenweld/utils";
import { siteUrl } from "@/lib/admin-links";
import { AdminPageHeader } from "./AdminShell";

/**
 * ICERIK FORMLARININ ORTAK PARCALARI
 *
 * Haber, blog ve etkinlik formlari ayni iskeleti kullanir: sekmeler,
 * hata/kaydedildi uyarilari, metin alanlari, adres (slug) alani,
 * kapak/logo secici, fotograf galerisi ve alttaki Kaydet/Vazgec cubugu.
 * Her form yalnizca kendine ozgu alanlari ekler.
 */

/** T icindeki metin alanlarinin adlari. */
type TextKeys<T> = { [K in keyof T]-?: T[K] extends string ? K : never }[keyof T];

/* ------------------------------------------------------------------ */
/* Durum                                                               */
/* ------------------------------------------------------------------ */

/** Formun taslagi, sekmesi ve uyarilari. */
export function useContentForm<T extends object>(initial: T, firstTab = "temel") {
  const [draft, setDraft] = useState<T>(initial);
  const [tab, setTab] = useState(firstTab);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  return {
    draft,
    setDraft,
    tab,
    setTab,
    error,
    setError,
    saved,
    set: <K extends keyof T>(key: K, value: T[K]) => setDraft((d) => ({ ...d, [key]: value })),
    /** Hatayi gosterir ve ilgili sekmeye gecer. */
    fail: (message: string, onTab = firstTab) => {
      setError(message);
      setTab(onTab);
    },
    /** "Kaydedildi" uyarisini kisa sure gosterir. */
    flashSaved: () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
  };
}

/* ------------------------------------------------------------------ */
/* Kayit oncesi yardimcilar                                            */
/* ------------------------------------------------------------------ */

/** Adres bos birakildiysa basliktan uretilir. */
export const resolveSlug = (slug: string, title: string) => slug.trim() || slugify(title);

/** Ayni adresi kullanan baska kayit varsa onu dondurur. */
export function findSlugClash<R extends { id: string; slug: string }>(
  rows: R[],
  selfId: string,
  slug: string,
): R | undefined {
  return rows.find((r) => r.id !== selfId && r.slug === slug);
}

/* ------------------------------------------------------------------ */
/* Iskelet                                                             */
/* ------------------------------------------------------------------ */

export function ContentFormShell({
  form,
  tabs,
  savedText,
  submitLabel,
  onSubmit,
  children,
}: {
  form: { tab: string; setTab: (tab: string) => void; error: string | null; saved: boolean };
  tabs: { id: string; label: string; badge?: number }[];
  savedText: string;
  submitLabel: string;
  onSubmit: () => void;
  children: ReactNode;
}) {
  const router = useRouter();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      {form.error && (
        <div className="mb-4">
          <Alert tone="danger">{form.error}</Alert>
        </div>
      )}
      {form.saved && (
        <div className="mb-4">
          <Alert tone="success">{savedText}</Alert>
        </div>
      )}

      <Tabs className="mb-6" active={form.tab} onChange={form.setTab} tabs={tabs} />

      {children}

      <div className="sticky bottom-0 mt-6 flex gap-3 border-t border-zw-grey-200 bg-zw-grey-50 py-4">
        <Button type="submit" size="lg">
          {submitLabel}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Vazgeç
        </Button>
      </div>
    </form>
  );
}

/** Sekme iceriginin beyaz kutusu. */
export function FormPanel({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-4 rounded-[4px] border border-zw-grey-200 bg-white p-5">{children}</div>
  );
}

/* ------------------------------------------------------------------ */
/* Alanlar                                                             */
/* ------------------------------------------------------------------ */

/** Sayfa adresi (slug) alani. */
export function SlugField({
  slug,
  onChange,
  path,
}: {
  slug: string;
  onChange: (value: string) => void;
  /** Ornek: "/haberler" */
  path: string;
}) {
  return (
    <FormRow label="Adres (slug)" hint={`${path}/${slug || "…"}`}>
      <Input value={slug} onChange={(e) => onChange(slugify(e.target.value))} />
    </FormRow>
  );
}

/** "2026-08-12T09:00:00+03:00" -> "2026-08-12T09:00" (datetime-local girdisi) */
const toLocalInput = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export function PublishedAtField({
  value,
  onChange,
}: {
  value: string;
  onChange: (iso: string) => void;
}) {
  return (
    <FormRow label="Yayın Tarihi">
      <Input
        type="datetime-local"
        value={toLocalInput(value)}
        onChange={(e) => {
          const d = new Date(e.target.value);
          if (!Number.isNaN(d.getTime())) onChange(d.toISOString());
        }}
      />
    </FormRow>
  );
}

/**
 * Icerik sekmesi: ozet ve uzun metin. Bicimlendirme aciklamasi tum
 * formlarda aynidir; `intro` yalnizca ilk cumleyi verir.
 */
export function ContentTextFields<T>({
  intro,
  fields,
  values,
  onChange,
}: {
  intro: string;
  fields: { key: TextKeys<T>; label: string; tall?: boolean }[];
  values: T;
  onChange: (key: TextKeys<T>, value: string) => void;
}) {
  return (
    <div className="space-y-4 rounded-[4px] border border-zw-grey-200 bg-white p-5">
      <Alert tone="info">
        {intro} Metinde boş satır bırakarak paragraf oluşturabilirsiniz. Biçimlendirme için: satır
        başına <code>## </code> koyarsanız ara başlık, <code>- </code> koyarsanız madde olur;{" "}
        <code>**kelime**</code> yazarsanız kalın görünür.
      </Alert>
      {fields.map((f) => (
        <FormRow key={String(f.key)} label={f.label}>
          <Textarea
            className={f.tall ? "min-h-56" : "min-h-20"}
            value={values[f.key] as string}
            onChange={(e) => onChange(f.key, e.target.value)}
          />
        </FormRow>
      ))}
    </div>
  );
}

const UPLOAD_LABEL =
  "inline-flex h-11 cursor-pointer items-center gap-2 rounded-[4px] border border-zw-grey-300 px-4 text-sm font-semibold hover:border-zw-ink";

/** Tek gorsel (kapak veya logo): URL ile ya da dosya yukleyerek. */
export function SingleImageField({
  value,
  onChange,
  onError,
  alt,
  placeholder,
  previewClassName,
  imageClassName = "h-full w-full object-cover",
  alternates,
  trimEdges,
  removeLabel = "Görseli kaldır",
}: {
  value: string;
  onChange: (url: string) => void;
  onError: (message: string) => void;
  alt: string;
  placeholder: string;
  /** Onizleme kutusunun boyutu, ornegin "aspect-[4/3] w-56". */
  previewClassName: string;
  imageClassName?: string;
  alternates?: string[];
  /** Logolarda cevredeki bos beyaz kenari kirpar. */
  trimEdges?: boolean;
  removeLabel?: string;
}) {
  const [input, setInput] = useState("");

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
      <div
        className={`shrink-0 overflow-hidden rounded-[4px] border border-zw-grey-200 bg-zw-grey-50 ${previewClassName}`}
      >
        <ProductImage
          src={value}
          alternates={alternates}
          alt={alt}
          label={alt || "Görsel"}
          className={imageClassName}
        />
      </div>
      <div className="flex-1 space-y-2">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            placeholder={placeholder}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            leftIcon={<ImagePlus size={16} />}
            onClick={() => {
              if (!input.trim()) return;
              onChange(input.trim());
              setInput("");
            }}
          >
            URL Kullan
          </Button>
          <label className={UPLOAD_LABEL}>
            <Upload size={16} />
            Dosya Yükle
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                readImageFiles(e.target.files, onChange, onError, { trimEdges });
                e.target.value = "";
              }}
            />
          </label>
        </div>
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-sm font-semibold text-zw-red-600 hover:underline"
          >
            {removeLabel}
          </button>
        )}
      </div>
    </div>
  );
}

/** Fotograf galerisi: URL ekleme, coklu dosya yukleme, silme. */
export function GalleryField({
  images,
  onChange,
  onError,
  alt,
  placeholder,
  description,
}: {
  images: string[];
  onChange: (update: (images: string[]) => string[]) => void;
  onError: (message: string) => void;
  alt: string;
  placeholder: string;
  description?: string;
}) {
  const [input, setInput] = useState("");

  return (
    <div>
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-zw-grey-600">
        Fotoğraf Galerisi
      </div>
      {description && <p className="mb-3 text-sm text-zw-grey-500">{description}</p>}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          placeholder={placeholder}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          leftIcon={<ImagePlus size={16} />}
          onClick={() => {
            if (!input.trim()) return;
            const url = input.trim();
            onChange((list) => [...list, url]);
            setInput("");
          }}
        >
          URL Ekle
        </Button>
        <label className={UPLOAD_LABEL}>
          <Upload size={16} />
          Dosya Yükle
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              readImageFiles(e.target.files, (url) => onChange((list) => [...list, url]), onError);
              e.target.value = "";
            }}
          />
        </label>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {images.map((img, i) => (
          <div key={i} className="rounded-[4px] border border-zw-grey-200 p-2">
            <div className="aspect-[4/3] overflow-hidden rounded-[3px] bg-zw-grey-50">
              <ProductImage
                src={img}
                alt={`${alt} — ${i + 1}`}
                label={alt || "Fotoğraf"}
                className="h-full w-full object-cover"
              />
            </div>
            <button
              type="button"
              onClick={() => onChange((list) => list.filter((_, x) => x !== i))}
              className="mt-2 w-full rounded-[3px] border border-zw-grey-300 py-1 text-xs text-zw-red-600 hover:border-zw-red-600"
            >
              <Trash2 size={13} className="mx-auto" />
            </button>
          </div>
        ))}
        {images.length === 0 && (
          <p className="col-span-full py-6 text-center text-sm text-zw-grey-500">
            Henüz fotoğraf eklenmedi.
          </p>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Duzenleme sayfasi                                                   */
/* ------------------------------------------------------------------ */

/**
 * Haber, blog ve etkinlik duzenleme sayfalarinin ortak cercevesi: baslik,
 * "sitede gor" baglantisi ve form.
 */
export function EditPageFrame({
  title,
  description,
  sitePath,
  siteLinkLabel,
  children,
}: {
  title: string;
  description: string;
  /** Sitedeki sayfanin yolu, ornegin "/haberler/slug". */
  sitePath: string;
  siteLinkLabel: string;
  children: ReactNode;
}) {
  return (
    <>
      <AdminPageHeader
        title={title}
        description={description}
        action={
          <a
            href={siteUrl(sitePath)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-zw-red-600 hover:underline"
          >
            {siteLinkLabel} ↗
          </a>
        }
      />
      {children}
    </>
  );
}
