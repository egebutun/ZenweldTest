"use client";

import { useState } from "react";
import { CornerDownRight } from "lucide-react";
import type { ProductSeo } from "@zenweld/data";
import { useDatabase } from "@zenweld/store";
import { FormRow, Input, Textarea } from "@zenweld/ui";
import { slugify } from "@zenweld/utils";
import { productSeo } from "@/lib/seo";
import { FormPanel } from "../content-form";
import type { ProductTabProps } from "./types";

/** Google'in arama sonucunda kesmeden gosterdigi yaklasik uzunluklar */
const TITLE_MAX = 60;
const DESCRIPTION_MAX = 160;

/** "tig, kaynak makinesi, , tig" -> ["tig", "kaynak makinesi"] */
const parseKeywords = (text: string) => [
  ...new Set(text.split(",").map((k) => k.trim()).filter(Boolean)),
];

/**
 * SEO sekmesi: urun linki, sayfa basligi, aciklama, anahtar kelimeler ve
 * Google onizlemesi. Bos alanlarda otomatik deger kullanilir (lib/seo.ts).
 */
export function SeoTab({ draft, set, isNew }: ProductTabProps & { isNew: boolean }) {
  const db = useDatabase();
  const stored = db.products.find((p) => p.id === draft.id);
  const category = db.categories.find((c) => c.slug === draft.categorySlug);
  const seo = productSeo(draft, category);
  const auto = productSeo({ ...draft, seo: undefined }, category);
  // Virgul yazilirken bos kelime silinmesin diye metin ayrica tutulur.
  const [keywordText, setKeywordText] = useState(draft.seo?.keywords?.join(", ") ?? "");

  const setSeo = (patch: Partial<ProductSeo>) => {
    const next = { ...draft.seo, ...patch };
    const empty = !next.title?.trim() && !next.description?.trim() && !next.keywords?.length;
    set("seo", empty ? undefined : next);
  };

  const slugChanged = !isNew && stored && draft.slug && draft.slug !== stored.slug;
  const titleLength = (draft.seo?.title ?? "").length;
  const descriptionLength = (draft.seo?.description ?? "").length;

  return (
    <div className="space-y-5">
      <FormPanel>
        <FormRow
          label="Ürün Linki"
          hint="Linkte Türkçe karakter ve boşluk kullanılmaz; yazdığınız metin otomatik düzeltilir."
        >
          <div className="flex">
            <span className="flex shrink-0 items-center rounded-l-[4px] border border-r-0 border-zw-grey-300 bg-zw-grey-50 px-3 text-sm text-zw-grey-500">
              /urun/
            </span>
            <Input
              className="rounded-l-none"
              value={draft.slug}
              onChange={(e) => set("slug", slugify(e.target.value))}
            />
          </div>
        </FormRow>

        {slugChanged && (
          <p className="rounded-[4px] bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Kaydedince eski link <strong>/urun/{stored.slug}</strong> yeni linke yönlendirilir;
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
                  /urun/{s}
                </li>
              ))}
            </ul>
          </div>
        )}
      </FormPanel>

      <FormPanel>
        <FormRow
          label="Ürün Sayfa Başlığı"
          hint={
            <Counter length={titleLength} max={TITLE_MAX}>
              Boş bırakılırsa: {auto.title}
            </Counter>
          }
        >
          <Input
            value={draft.seo?.title ?? ""}
            placeholder={auto.title}
            onChange={(e) => setSeo({ title: e.target.value })}
          />
        </FormRow>

        <FormRow
          label="Açıklama"
          hint={
            <Counter length={descriptionLength} max={DESCRIPTION_MAX}>
              Boş bırakılırsa ürünün kısa açıklaması kullanılır.
            </Counter>
          }
        >
          <Textarea
            className="min-h-20"
            value={draft.seo?.description ?? ""}
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
        <div className="text-xs font-semibold uppercase tracking-wide text-zw-grey-600">
          Google Önizlemesi
        </div>
        {/* Gercek alan adiyla (lib/seo.ts INDEXABLE_HOSTS) gosterilir. */}
        <div className="max-w-[600px] font-sans">
          <div className="truncate text-sm text-zw-grey-700">
            zenweld.com › urun › {draft.slug || "…"}
          </div>
          <div className="mt-1 truncate text-xl leading-snug text-[#1a0dab]">{seo.title}</div>
          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-zw-grey-600">
            {seo.description || "Açıklama girilmedi."}
          </p>
        </div>
      </FormPanel>
    </div>
  );
}

/** Karakter sayaci: sinir asilinca kirmizi uyari verir. */
function Counter({ length, max, children }: { length: number; max: number; children: React.ReactNode }) {
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
