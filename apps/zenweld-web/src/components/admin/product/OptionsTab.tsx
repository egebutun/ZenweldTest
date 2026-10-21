"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Trash2, X } from "lucide-react";
import {
  normalizeCode,
  type OptionDefinition,
  type Product,
  type ProductOptions,
  type ProductVariant,
} from "@zenweld/data";
import { useDatabase } from "@zenweld/store";
import { Alert, Button, FormRow, Input, ProductImage, Select } from "@zenweld/ui";
import { formatPrice, priceWithVat } from "@zenweld/utils";
import type { ProductTabProps } from "./types";

/**
 * Secenekler sekmesi: urunun tek secenegi (orn. Hortum Uzunluğu) ve bu
 * urunde satilan degerleri. Secenek, urunun kategorisinde isaretli
 * tanimlardan secilir (Kategoriler › Seçenekler). Her degerin urun kodu
 * zorunludur; fiyat farki, fotograf, farkli teknik ozellikler ve kutu
 * icerigi istege baglidir (bossa urununki gecerli).
 */
export function OptionsTab({ draft, set }: ProductTabProps) {
  const db = useDatabase();
  const own = draft.options;

  if (!own) return <OptionChooser draft={draft} onChoose={(optionId) => set("options", { optionId, variants: [] })} />;

  const definition = db.optionDefinitions.find((d) => d.id === own.optionId);
  const remove = () => {
    if (own.variants.length && !window.confirm("Seçenek ve tüm değerleri bu üründen kaldırılsın mı?")) return;
    set("options", undefined);
  };

  if (!definition) {
    return (
      <Panel>
        <Alert tone="warning">Bu ürünün seçenek tanımı bulunamadı (silinmiş olabilir).</Alert>
        <div className="mt-4">
          <Button type="button" variant="outline" onClick={remove}>
            Seçeneği Kaldır
          </Button>
        </div>
      </Panel>
    );
  }

  const setVariants = (variants: ProductVariant[]) => set("options", { ...own, variants });
  const variantOf = (valueId: string) => own.variants.find((v) => v.valueId === valueId);
  const used = definition.values.filter((value) => variantOf(value.id));
  const unused = definition.values.filter((value) => !variantOf(value.id));

  return (
    <Panel>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-zw-grey-600">Seçenek</div>
          <div className="font-display text-lg font-bold">{definition.name}</div>
        </div>
        <Button type="button" variant="outline" size="sm" leftIcon={<X size={14} />} onClick={remove}>
          Seçeneği Kaldır
        </Button>
      </div>

      <div className="mt-5 space-y-4">
        {used.map((value) => (
          <VariantCard
            key={value.id}
            label={value.label}
            definition={definition}
            variant={variantOf(value.id)!}
            draft={draft}
            onChange={(next) => setVariants(own.variants.map((v) => (v.valueId === value.id ? next : v)))}
            onRemove={() => setVariants(own.variants.filter((v) => v.valueId !== value.id))}
          />
        ))}
        {used.length === 0 && (
          <p className="rounded-[4px] border border-dashed border-zw-grey-300 px-4 py-6 text-center text-sm text-zw-grey-500">
            Henüz değer eklenmedi. Bu üründe satılan değerleri aşağıdan ekleyin.
          </p>
        )}
      </div>

      <div className="mt-5 border-t border-zw-grey-100 pt-4">
        {unused.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-zw-grey-600">Değer ekle:</span>
            {unused.map((value) => (
              <Button
                key={value.id}
                type="button"
                size="sm"
                variant="outline"
                leftIcon={<Plus size={14} />}
                onClick={() => setVariants([...own.variants, { valueId: value.id, sku: "", priceDeltaExVat: 0 }])}
              >
                {value.label}
              </Button>
            ))}
          </div>
        )}
        <p className="mt-3 text-xs text-zw-grey-500">
          Listede olmayan bir değer gerekiyorsa{" "}
          <Link href="/yonetim/secenekler" className="font-semibold text-zw-red-600 hover:underline">
            Seçenek Tanımları
          </Link>{" "}
          ekranında &quot;{definition.name}&quot; tanımına ekleyin.
        </p>
      </div>
    </Panel>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return <div className="rounded-[4px] border border-zw-grey-200 bg-white p-5">{children}</div>;
}

/** Seceneksiz urun: kategoride isaretli tanimlardan biri secilir. */
function OptionChooser({ draft, onChoose }: { draft: Product; onChoose: (optionId: string) => void }) {
  const db = useDatabase();
  const category = db.categories.find((c) => c.slug === draft.categorySlug);
  const pool = (category?.optionIds ?? []).flatMap((id) => db.optionDefinitions.filter((d) => d.id === id));
  const [choice, setChoice] = useState("");
  const selected = pool.some((d) => d.id === choice) ? choice : pool[0]?.id ?? "";

  return (
    <Panel>
      <p className="text-sm text-zw-grey-600">
        Ürün tek sayfada seçenekleriyle satılır (ör. 3 m / 5 m); her seçeneğin kendi ürün kodu ve fiyatı olur.
      </p>
      {pool.length === 0 ? (
        <div className="mt-4">
          <Alert tone="info">
            {category ? (
              <>
                &quot;{category.name}&quot; kategorisinde işaretli seçenek yok. Seçenekler kategorinin Seçenekler
                sekmesinden işaretlenir:{" "}
                <Link href={`/yonetim/kategoriler/${category.id}`} className="font-semibold underline">
                  Kategoriyi aç
                </Link>
              </>
            ) : (
              "Önce Temel Bilgiler sekmesinden kategori seçin."
            )}
          </Alert>
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="sm:w-80">
            <FormRow label="Seçenek">
              <Select value={selected} onChange={(e) => setChoice(e.target.value)}>
                {pool.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.values.map((v) => v.label).join(", ")})
                  </option>
                ))}
              </Select>
            </FormRow>
          </div>
          <Button type="button" leftIcon={<Plus size={16} />} onClick={() => onChoose(selected)}>
            Seçenek Ekle
          </Button>
        </div>
      )}
    </Panel>
  );
}

/** Bir degerin bu urundeki satiri: kod, fiyat farki ve istege bagli farklar. */
function VariantCard({
  label,
  definition,
  variant,
  draft,
  onChange,
  onRemove,
}: {
  label: string;
  definition: OptionDefinition;
  variant: ProductVariant;
  draft: Product;
  onChange: (variant: ProductVariant) => void;
  onRemove: () => void;
}) {
  const patch = (p: Partial<ProductVariant>) => onChange({ ...variant, ...p });
  const priceExVat = draft.priceExVat + (variant.priceDeltaExVat || 0);
  const specs = variant.specOverrides ?? [];
  const extras = Boolean(variant.image || specs.length || variant.inTheBox);

  return (
    <div className="rounded-[4px] border border-zw-grey-200">
      <div className="flex items-center justify-between gap-3 border-b border-zw-grey-100 bg-zw-grey-50 px-4 py-2">
        <span className="font-semibold">{label}</span>
        <button
          type="button"
          aria-label={`${label} değerini kaldır`}
          onClick={onRemove}
          className="rounded-[3px] p-1.5 text-zw-grey-400 hover:bg-zw-grey-100 hover:text-zw-red-600"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="space-y-4 p-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <FormRow label="Ürün kodu (SKU)" required>
            <Input
              value={variant.sku}
              placeholder={draft.sku ? `ör. ${draft.sku}-…` : ""}
              onChange={(e) => patch({ sku: e.target.value })}
            />
          </FormRow>
          <FormRow label="Fiyat farkı (KDV hariç, ₺)" hint="Ana fiyata eklenir; eksi olabilir">
            <Input
              type="number"
              step="any"
              value={variant.priceDeltaExVat}
              onChange={(e) => patch({ priceDeltaExVat: Number(e.target.value) || 0 })}
            />
          </FormRow>
          <FormRow label="Normal fiyat">
            <Input
              disabled
              value={`${formatPrice(priceExVat)} + KDV · ${formatPrice(priceWithVat(priceExVat, draft.vatRate))}`}
            />
          </FormRow>
        </div>

        {variant.previousSlugs?.map((slug) => (
          <p key={slug} className="text-xs text-zw-grey-500">
            Eski ürün linki <span className="font-mono">/urun/{slug}</span> bu seçenekle açılır.
          </p>
        ))}

        <details open={extras} className="rounded-[4px] border border-zw-grey-100">
          <summary className="cursor-pointer px-3 py-2 text-sm font-semibold text-zw-grey-700">
            Bu değerde farklı olanlar (isteğe bağlı)
          </summary>
          <div className="space-y-5 border-t border-zw-grey-100 p-3">
            <VariantImage draft={draft} value={variant.image} onChange={(image) => patch({ image })} />

            <div>
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-zw-grey-600">
                Teknik özellik farkları
              </div>
              <p className="mb-2 text-xs text-zw-grey-500">
                Yalnızca bu değerde farklı olan satırlar (ör. Ağırlık); aynı adlı satırın yerine geçer.
                &quot;{definition.name}: {label}&quot; satırı kendiliğinden eklenir.
              </p>
              <div className="space-y-2">
                {specs.map((row, i) => (
                  <div key={i} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                    <Input
                      placeholder="Özellik"
                      value={row.label}
                      onChange={(e) => patch({ specOverrides: specs.map((r, x) => (x === i ? { ...r, label: e.target.value } : r)) })}
                    />
                    <Input
                      placeholder="Değer"
                      value={row.value}
                      onChange={(e) => patch({ specOverrides: specs.map((r, x) => (x === i ? { ...r, value: e.target.value } : r)) })}
                    />
                    <button
                      type="button"
                      aria-label="Satırı sil"
                      onClick={() => patch({ specOverrides: specs.filter((_, x) => x !== i) })}
                      className="self-center px-2 text-zw-grey-400 hover:text-zw-red-600"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="mt-2"
                leftIcon={<Plus size={14} />}
                onClick={() => patch({ specOverrides: [...specs, { label: "", value: "" }] })}
              >
                Satır Ekle
              </Button>
            </div>

            <VariantBox draft={draft} value={variant.inTheBox} onChange={(inTheBox) => patch({ inTheBox })} />
          </div>
        </details>
      </div>
    </div>
  );
}

/** Fotograf: urunun gorsellerinden biri; secilmezse urunun fotograflari. */
function VariantImage({
  draft,
  value,
  onChange,
}: {
  draft: Product;
  value?: string;
  onChange: (image: string | undefined) => void;
}) {
  return (
    <div>
      <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-zw-grey-600">Fotoğraf</div>
      {draft.images.length === 0 ? (
        <p className="text-xs text-zw-grey-500">Önce Görseller sekmesinden ürüne fotoğraf ekleyin.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            aria-pressed={!value}
            onClick={() => onChange(undefined)}
            className={`flex h-16 w-16 items-center justify-center rounded-[3px] border-2 px-1 text-center text-[11px] leading-tight ${
              !value ? "border-zw-red-600 bg-zw-red-50" : "border-zw-grey-200 text-zw-grey-600 hover:border-zw-grey-500"
            }`}
          >
            Ürünün fotoğrafı
          </button>
          {draft.images.map((img, i) => (
            <button
              key={i}
              type="button"
              aria-label={`${i + 1}. görsel`}
              aria-pressed={value === img.url}
              onClick={() => onChange(img.url)}
              className={`h-16 w-16 overflow-hidden rounded-[3px] border-2 bg-zw-grey-50 ${
                value === img.url ? "border-zw-red-600" : "border-zw-grey-200 hover:border-zw-grey-500"
              }`}
            >
              <ProductImage src={img.url} alt={img.alt} label={draft.name} className="h-full w-full object-contain" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Kutu icerigi: bossa urunun listesi; istenirse bu deger icin ayri liste. */
function VariantBox({
  draft,
  value,
  onChange,
}: {
  draft: Product;
  value?: string[];
  onChange: (inTheBox: string[] | undefined) => void;
}) {
  return (
    <div>
      <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-zw-grey-600">Kutu içeriği</div>
      {!value ? (
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs text-zw-grey-500">Ürünün kutu içeriği kullanılıyor.</span>
          <Button type="button" size="sm" variant="outline" onClick={() => onChange([...draft.inTheBox])}>
            Bu değer için ayrı liste
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {value.map((item, i) => (
              <div key={i} className="flex gap-2">
                <Input value={item} onChange={(e) => onChange(value.map((x, n) => (n === i ? e.target.value : x)))} />
                <button
                  type="button"
                  aria-label="Maddeyi sil"
                  onClick={() => onChange(value.filter((_, n) => n !== i))}
                  className="shrink-0 px-2 text-zw-grey-400 hover:text-zw-red-600"
                >
                  <Trash2 size={17} />
                </button>
              </div>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" leftIcon={<Plus size={14} />} onClick={() => onChange([...value, ""])}>
              Madde Ekle
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => onChange(undefined)}>
              Ürünün listesine dön
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Kayit oncesi                                                        */
/* ------------------------------------------------------------------ */

/**
 * Urun kodlari: her degerde zorunlu; urunun kendi koduyla, ayni urunun
 * baska degeriyle ya da baska bir urunun (veya seceneginin) koduyla ayni
 * olamaz. Fiyat eksiye dusemez.
 */
export function optionsError(draft: Product, definitions: OptionDefinition[], products: Product[]): string | null {
  const own = draft.options;
  if (!own) return null;
  const definition = definitions.find((d) => d.id === own.optionId);
  const name = (valueId: string) => definition?.values.find((v) => v.id === valueId)?.label ?? valueId;

  const taken = new Map<string, string>();
  products
    .filter((p) => p.id !== draft.id)
    .forEach((p) => {
      taken.set(normalizeCode(p.sku), `"${p.name}" ürününde kullanılıyor`);
      p.options?.variants.forEach((v) => taken.set(normalizeCode(v.sku), `"${p.name}" ürününün seçeneğinde kullanılıyor`));
    });
  if (draft.sku.trim()) taken.set(normalizeCode(draft.sku), "ürünün kendi koduyla aynı olamaz");

  for (const v of own.variants) {
    const label = name(v.valueId);
    const code = normalizeCode(v.sku);
    if (!code) return `"${label}" seçeneğinin ürün kodu zorunludur.`;
    const clash = taken.get(code);
    if (clash) return `"${label}" seçeneğinin kodu (${v.sku.trim()}) ${clash}.`;
    taken.set(code, `"${label}" seçeneğinde de var`);
    if (draft.priceExVat + v.priceDeltaExVat < 0) return `"${label}" seçeneğinin fiyatı eksiye düşüyor.`;
  }
  return null;
}

/**
 * Kayit icin toparlar: degersiz secenek kaldirilir, bos satir ve maddeler
 * atilir, urunden silinmis fotograf secimi temizlenir. Eski ayri urunun
 * linki (previousSlugs) korunur.
 */
export function tidyOptions(draft: Product): ProductOptions | undefined {
  const own = draft.options;
  if (!own?.variants.length) return undefined;
  const images = new Set(draft.images.map((i) => i.url));
  return {
    optionId: own.optionId,
    variants: own.variants.map(({ valueId, sku, priceDeltaExVat, specOverrides, inTheBox, image, previousSlugs }) => {
      const specs = (specOverrides ?? [])
        .map((r) => ({ label: r.label.trim(), value: r.value.trim() }))
        .filter((r) => r.label && r.value);
      const box = (inTheBox ?? []).map((x) => x.trim()).filter(Boolean);
      return {
        valueId,
        sku: sku.trim(),
        priceDeltaExVat,
        ...(specs.length ? { specOverrides: specs } : {}),
        ...(box.length ? { inTheBox: box } : {}),
        ...(image && images.has(image) ? { image } : {}),
        ...(previousSlugs?.length ? { previousSlugs } : {}),
      };
    }),
  };
}
