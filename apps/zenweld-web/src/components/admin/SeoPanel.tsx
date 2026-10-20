"use client";

import { useState, type ReactNode } from "react";
import { CornerDownRight } from "lucide-react";
import type { SeoFields } from "@zenweld/data";
import { FormRow, Input, Textarea } from "@zenweld/ui";
import { slugify } from "@zenweld/utils";
import type { PageSeo } from "@/lib/seo";
import { FormPanel } from "./content-form";

/** Google'in arama sonucunda kesmeden gosterdigi yaklasik uzunluklar */
export const TITLE_MAX = 60;
export const DESCRIPTION_MAX = 160;

/** "tig, kaynak makinesi, , tig" -> ["tig", "kaynak makinesi"] */
const parseKeywords = (text: string) => [
  ...new Set(text.split(",").map((k) => k.trim()).filter(Boolean)),
];

/**
 * SEO SEKMESI (urun, blog yazisi, haber, etkinlik)
 *
 * Link, sayfa basligi, aciklama, anahtar kelimeler ve Google onizlemesi.
 * Bos alanlarda otomatik deger kullanilir; `compute` sayfanin kendi
 * hesaplamasidir (lib/seo.ts), boylece onizleme sitedeki sonucla aynidir.
 * Kayitli bir kaydin linki degisirse eski link yeni linke yonlenir
 * (store: withPreviousSlugs).
 */
export function SeoPanel({
  noun,
  path,
  slug,
  onSlugChange,
  stored,
  value,
  onChange,
  compute,
  descriptionFallback,
}: {
  /** Etiketlerde: "Ürün" -> "Ürün Linki", "Ürün Sayfa Başlığı" */
  noun: string;
  /** Adres oneki: "/urun" */
  path: string;
  slug: string;
  onSlugChange: (slug: string) => void;
  /** Kayitli hali (yeni kayitta yok) */
  stored?: { slug: string; previousSlugs?: string[] };
  value?: SeoFields;
  onChange: (seo: SeoFields | undefined) => void;
  compute: (seo: SeoFields | undefined) => PageSeo;
  /** "ürünün kısa açıklaması" */
  descriptionFallback: string;
}) {
  const seo = compute(value);
  const auto = compute(undefined);
  // Virgul yazilirken bos kelime silinmesin diye metin ayrica tutulur.
  const [keywordText, setKeywordText] = useState(value?.keywords?.join(", ") ?? "");

  const setSeo = (patch: Partial<SeoFields>) => {
    const next = { ...value, ...patch };
    const empty = !next.title?.trim() && !next.description?.trim() && !next.keywords?.length;
    onChange(empty ? undefined : next);
  };

  const slugChanged = stored && slug && slug !== stored.slug;
  const titleLength = (value?.title ?? "").length;
  const descriptionLength = (value?.description ?? "").length;

  return (
    <div className="space-y-5">
      <FormPanel>
        <FormRow
          label={`${noun} Linki`}
          hint="Linkte Türkçe karakter ve boşluk kullanılmaz; yazdığınız metin otomatik düzeltilir."
        >
          <div className="flex">
            <span className="flex shrink-0 items-center rounded-l-[4px] border border-r-0 border-zw-grey-300 bg-zw-grey-50 px-3 text-sm text-zw-grey-500">
              {path}/
            </span>
            <Input
              className="rounded-l-none"
              value={slug}
              onChange={(e) => onSlugChange(slugify(e.target.value))}
            />
          </div>
        </FormRow>

        {slugChanged && (
          <p className="rounded-[4px] bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Kaydedince eski link <strong>{path}/{stored.slug}</strong> yeni linke yönlendirilir;
            paylaşılmış bağlantılar ve Google'daki eski sonuç çalışmaya devam eder.
          </p>
        )}

        {stored?.previousSlugs && stored.previousSlugs.length > 0 && (
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-zw-grey-600">
              Yeni linke yönlenen eski linkler
            </div>
            <ul className="mt-1.5 space-y-1 text-sm text-zw-grey-600">
              {stored.previousSlugs.map((s) => (
                <li key={s} className="flex items-center gap-1.5">
                  <CornerDownRight size={14} className="shrink-0 text-zw-grey-400" />
                  {path}/{s}
                </li>
              ))}
            </ul>
          </div>
        )}
      </FormPanel>

      <FormPanel>
        <FormRow
          label={`${noun} Sayfa Başlığı`}
          hint={
            <Counter length={titleLength} max={TITLE_MAX}>
              Boş bırakılırsa: {auto.title}
            </Counter>
          }
        >
          <Input
            value={value?.title ?? ""}
            placeholder={auto.title}
            onChange={(e) => setSeo({ title: e.target.value })}
          />
        </FormRow>

        <FormRow
          label="Açıklama"
          hint={
            <Counter length={descriptionLength} max={DESCRIPTION_MAX}>
              Boş bırakılırsa {descriptionFallback} kullanılır.
            </Counter>
          }
        >
          <Textarea
            className="min-h-20"
            value={value?.description ?? ""}
            placeholder={auto.description}
            onChange={(e) => setSeo({ description: e.target.value })}
          />
        </FormRow>

        <FormRow
          label="Anahtar Kelimeler"
          hint="Virgülle ayırın. Site içi aramada bu kelimelerle de bulunur ve sayfanın keywords etiketine yazılır."
        >
          <Input
            value={keywordText}
            placeholder="örnek: tig kaynak makinesi, argon kaynak, inverter"
            onChange={(e) => {
              setKeywordText(e.target.value);
              setSeo({ keywords: parseKeywords(e.target.value) });
            }}
          />
        </FormRow>
      </FormPanel>

      <FormPanel>
        <GooglePreview path={`${path}/${slug || "…"}`} title={seo.title} description={seo.description} />
      </FormPanel>
    </div>
  );
}

/** Arama sonucundaki gorunum; gercek alan adiyla (lib/seo.ts INDEXABLE_HOSTS). */
export function GooglePreview({ path, title, description }: { path: string; title: string; description: string }) {
  return (
    <>
      <div className="text-xs font-semibold uppercase tracking-wide text-zw-grey-600">Google Önizlemesi</div>
      <div className="max-w-[600px] font-sans">
        <div className="truncate text-sm text-zw-grey-700">
          {["zenweld.com", ...path.split("/").filter(Boolean)].join(" › ")}
        </div>
        <div className="mt-1 truncate text-xl leading-snug text-[#1a0dab]">{title}</div>
        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-zw-grey-600">
          {description || "Açıklama girilmedi."}
        </p>
      </div>
    </>
  );
}

/** Karakter sayaci: sinir asilinca kirmizi uyari verir. */
export function Counter({ length, max, children }: { length: number; max: number; children: ReactNode }) {
  return (
    <span className="flex flex-wrap justify-between gap-x-3">
      <span className="min-w-0">{children}</span>
      <span className={length > max ? "font-semibold text-zw-red-600" : undefined}>
        {length}/{max}
        {length > max && " — Google bu uzunlukta kesebilir"}
      </span>
    </span>
  );
}
