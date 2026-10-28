"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUp, Plus, Trash2, X } from "lucide-react";
import {
  MAX_PRODUCT_OPTIONS,
  combinationLabel,
  normalizeCode,
  variantIdFor,
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
 * Secenekler sekmesi: urunun secenekleri (en fazla 3, orn. Soğutma ve
 * Torç Uzunluğu), her secenekte bu urunde satilan degerler ve bunlardan
 * olusan kombinasyonlar (varyantlar). Secenekler urunun kategorisinde
 * isaretli tanimlardan secilir (Kategoriler › Seçenekler). Her
 * kombinasyonun urun kodu zorunludur; fiyat farki, fotograf, farkli teknik
 * ozellikler ve kutu icerigi istege baglidir (bossa urununki gecerli).
 * Satilmayan kombinasyon listeden cikarilir; varyanti olmaz.
 */

/** Kombinasyonun anahtari: secenek sirasiyla deger kimlikleri. */
const comboKey = (optionIds: string[], values: Record<string, string>) => optionIds.map((o) => values[o]).join("|");

/** Seceneklerin isaretli degerlerinden olusan butun kombinasyonlar. */
function combinations(optionIds: string[], chosen: Record<string, string[]>): Record<string, string>[] {
  return optionIds.reduce<Record<string, string>[]>(
    (acc, o) => acc.flatMap((values) => (chosen[o] ?? []).map((v) => ({ ...values, [o]: v }))),
    [{}],
  );
}

/** Varyantlardaki degerler (secenek -> isaretli degerler). */
function chosenOf(own: ProductOptions): Record<string, string[]> {
  return Object.fromEntries(
    own.optionIds.map((o) => [o, [...new Set(own.variants.map((v) => v.values[o]).filter(Boolean))]]),
  );
}

/**
 * Isaretli degerlerden varyant listesini yeniden kurar. Var olan varyantin
 * bilgileri (kod, fiyat farki ...) ayni kombinasyona tasinir; secenek
 * eklendiyse ya da kaldirildiysa uyusan ilk varyantinki kullanilir (yeni
 * secenegin ilk degeri eski varyanti alir, digerleri bos gelir). Secenek
 * listesi degisen varyantin kimligi yeniden uretilir.
 */
function rebuild(
  optionIds: string[],
  chosen: Record<string, string[]>,
  excluded: Set<string>,
  previous: ProductVariant[],
): ProductVariant[] {
  const used = new Set<ProductVariant>();
  const sameKeys = (v: ProductVariant) =>
    Object.keys(v.values).length === optionIds.length && optionIds.every((o) => o in v.values);
  const agrees = (v: ProductVariant, values: Record<string, string>) =>
    optionIds.every((o) => v.values[o] === undefined || v.values[o] === values[o]);
  return combinations(optionIds, chosen)
    .filter((values) => !excluded.has(comboKey(optionIds, values)))
    .map((values) => {
      const exact = previous.find((v) => !used.has(v) && sameKeys(v) && agrees(v, values));
      const near = exact ?? previous.find((v) => !used.has(v) && agrees(v, values));
      if (!near) return { id: variantIdFor(optionIds, values), values, sku: "", priceDeltaExVat: 0 };
      used.add(near);
      return { ...near, id: exact ? near.id : variantIdFor(optionIds, values), values };
    });
}

export function OptionsTab({ draft, set }: ProductTabProps) {
  const db = useDatabase();
  const own = draft.options;
  // Isaretli degerler ve cikarilan kombinasyonlar ekranda tutulur: degeri
  // olmayan secenek ya da cikarilan kombinasyon urunun verisinde gorunmez.
  const [chosen, setChosen] = useState<Record<string, string[]>>(() => (own ? chosenOf(own) : {}));
  const [excluded, setExcluded] = useState<Set<string>>(() => {
    if (!own) return new Set();
    const have = new Set(own.variants.map((v) => comboKey(own.optionIds, v.values)));
    return new Set(
      combinations(own.optionIds, chosenOf(own))
        .map((values) => comboKey(own.optionIds, values))
        .filter((key) => !have.has(key)),
    );
  });

  if (!own) {
    return (
      <OptionChooser
        draft={draft}
        exclude={[]}
        onChoose={(optionId) => {
          setChosen({ [optionId]: [] });
          setExcluded(new Set());
          set("options", { optionIds: [optionId], variants: [] });
        }}
      />
    );
  }

  const definitions = own.optionIds.map((id) => db.optionDefinitions.find((d) => d.id === id));
  const missing = definitions.some((d) => !d);
  const removeAll = () => {
    if (own.variants.length && !window.confirm("Seçenekler ve tüm kombinasyonlar bu üründen kaldırılsın mı?")) return;
    setChosen({});
    setExcluded(new Set());
    set("options", undefined);
  };

  if (missing) {
    return (
      <Panel>
        <Alert tone="warning">Bu ürünün seçenek tanımlarından biri bulunamadı (silinmiş olabilir).</Alert>
        <div className="mt-4">
          <Button type="button" variant="outline" onClick={removeAll}>
            Seçenekleri Kaldır
          </Button>
        </div>
      </Panel>
    );
  }
  const defs = definitions as OptionDefinition[];

  /** Isaretli degerler degisince varyantlar yeniden kurulur (her secenekte en az bir deger varsa). */
  const apply = (optionIds: string[], nextChosen: Record<string, string[]>, nextExcluded: Set<string>) => {
    setChosen(nextChosen);
    setExcluded(nextExcluded);
    const ready = optionIds.every((o) => (nextChosen[o] ?? []).length > 0);
    set("options", {
      optionIds,
      variants: ready ? rebuild(optionIds, nextChosen, nextExcluded, own.variants) : own.variants,
    });
  };

  const hasCodes = (pick: (v: ProductVariant) => boolean) => own.variants.some((v) => pick(v) && v.sku.trim());

  const toggleValue = (optionId: string, valueId: string) => {
    const list = chosen[optionId] ?? [];
    if (list.includes(valueId)) {
      if (
        hasCodes((v) => v.values[optionId] === valueId) &&
        !window.confirm("Bu değeri içeren kombinasyonlar ve kodları kaldırılsın mı?")
      )
        return;
      apply(own.optionIds, { ...chosen, [optionId]: list.filter((x) => x !== valueId) }, excluded);
    } else {
      const order = defs.find((d) => d.id === optionId)!.values.map((v) => v.id);
      const next = [...list, valueId].sort((a, b) => order.indexOf(a) - order.indexOf(b));
      apply(own.optionIds, { ...chosen, [optionId]: next }, excluded);
    }
  };

  const addOption = (optionId: string) => apply([...own.optionIds, optionId], { ...chosen, [optionId]: [] }, new Set());

  const removeOption = (optionId: string) => {
    if (own.optionIds.length === 1) return removeAll();
    if (
      own.variants.length &&
      !window.confirm("Seçenek kaldırılsın mı? Kombinasyonlar birleşir; her birleşenden ilkinin bilgileri kalır.")
    )
      return;
    const rest = { ...chosen };
    delete rest[optionId];
    apply(own.optionIds.filter((o) => o !== optionId), rest, new Set());
  };

  const moveUp = (index: number) => {
    const ids = [...own.optionIds];
    [ids[index - 1], ids[index]] = [ids[index], ids[index - 1]];
    set("options", { ...own, optionIds: ids });
  };

  const labelOf = (values: Record<string, string>) =>
    combinationLabel(defs.map((d) => ({ group: d.name, value: d.values.find((x) => x.id === values[d.id])?.label ?? "?" })));
  const rank = (values: Record<string, string>) =>
    defs.map((d) => d.values.findIndex((x) => x.id === values[d.id]));
  const byRank = (a: Record<string, string>, b: Record<string, string>) => {
    const ra = rank(a);
    const rb = rank(b);
    const i = ra.findIndex((x, n) => x !== rb[n]);
    return i < 0 ? 0 : ra[i] - rb[i];
  };

  const pending = defs.filter((d) => (chosen[d.id] ?? []).length === 0);
  const variants = pending.length ? [] : [...own.variants].sort((a, b) => byRank(a.values, b.values));
  const notSold = pending.length
    ? []
    : combinations(own.optionIds, chosen)
        .filter((values) => excluded.has(comboKey(own.optionIds, values)))
        .sort(byRank);
  const setVariant = (id: string, next: ProductVariant) =>
    set("options", { ...own, variants: own.variants.map((v) => (v.id === id ? next : v)) });
  const dropVariant = (v: ProductVariant) => {
    if (v.sku.trim() && !window.confirm(`"${labelOf(v.values)}" kombinasyonu ve kodu kaldırılsın mı?`)) return;
    apply(own.optionIds, chosen, new Set([...excluded, comboKey(own.optionIds, v.values)]));
  };
  const restore = (values: Record<string, string>) => {
    const next = new Set(excluded);
    next.delete(comboKey(own.optionIds, values));
    apply(own.optionIds, chosen, next);
  };

  return (
    <div className="space-y-5">
      <Panel>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <p className="max-w-2xl text-sm text-zw-grey-600">
            Her seçenekte bu üründe satılan değerleri işaretleyin; kombinasyonlar kendiliğinden oluşur (ör. Soğutma
            × Torç Uzunluğu). Satılmayan kombinasyonu aşağıdaki listeden çıkarın. En fazla {MAX_PRODUCT_OPTIONS}{" "}
            seçenek.
          </p>
          <Button type="button" variant="outline" size="sm" leftIcon={<X size={14} />} onClick={removeAll}>
            Tüm Seçenekleri Kaldır
          </Button>
        </div>

        <div className="mt-5 space-y-3">
          {defs.map((d, index) => (
            <div key={d.id} className="rounded-[4px] border border-zw-grey-200 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-display text-lg font-bold">
                  {index + 1}. {d.name}
                </div>
                <div className="flex gap-1">
                  {index > 0 && (
                    <button
                      type="button"
                      aria-label={`${d.name} seçeneğini yukarı taşı`}
                      title="Sayfada üste taşı"
                      onClick={() => moveUp(index)}
                      className="rounded-[3px] p-1.5 text-zw-grey-400 hover:bg-zw-grey-100 hover:text-zw-ink"
                    >
                      <ArrowUp size={16} />
                    </button>
                  )}
                  <button
                    type="button"
                    aria-label={`${d.name} seçeneğini kaldır`}
                    onClick={() => removeOption(d.id)}
                    className="rounded-[3px] p-1.5 text-zw-grey-400 hover:bg-zw-grey-100 hover:text-zw-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {d.values.map((value) => {
                  const on = (chosen[d.id] ?? []).includes(value.id);
                  return (
                    <button
                      key={value.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggleValue(d.id, value.id)}
                      className={`rounded-[4px] border-2 px-3 py-1.5 text-sm font-semibold ${
                        on
                          ? "border-zw-red-600 bg-zw-red-50 text-zw-ink"
                          : "border-zw-grey-200 text-zw-grey-600 hover:border-zw-grey-500"
                      }`}
                    >
                      {value.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {own.optionIds.length < MAX_PRODUCT_OPTIONS && (
          <div className="mt-4">
            <OptionChooser draft={draft} exclude={own.optionIds} onChoose={addOption} compact />
          </div>
        )}
        <p className="mt-3 text-xs text-zw-grey-500">
          Listede olmayan bir değer gerekiyorsa{" "}
          <Link href="/yonetim/secenekler" className="font-semibold text-zw-red-600 hover:underline">
            Seçenek Tanımları
          </Link>{" "}
          ekranında ilgili tanıma ekleyin.
        </p>
      </Panel>

      {pending.length > 0 ? (
        <Alert tone="warning">
          {pending.map((d) => `"${d.name}"`).join(", ")} için en az bir değer işaretleyin; kombinasyonlar ondan sonra
          oluşur.
        </Alert>
      ) : (
        <Panel>
          <div className="text-xs font-semibold uppercase tracking-wide text-zw-grey-600">
            Kombinasyonlar ({variants.length})
          </div>
          <div className="mt-3 space-y-4">
            {variants.map((v) => (
              <VariantCard
                key={v.id}
                label={labelOf(v.values)}
                lines={defs.map((d) => `${d.name}: ${d.values.find((x) => x.id === v.values[d.id])?.label ?? ""}`)}
                variant={v}
                draft={draft}
                onChange={(next) => setVariant(v.id, next)}
                onRemove={() => dropVariant(v)}
              />
            ))}
            {variants.length === 0 && (
              <p className="rounded-[4px] border border-dashed border-zw-grey-300 px-4 py-6 text-center text-sm text-zw-grey-500">
                Satılan kombinasyon yok. Aşağıdan geri ekleyin ya da değer işaretleyin.
              </p>
            )}
          </div>
          {notSold.length > 0 && (
            <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-zw-grey-100 pt-4">
              <span className="text-sm font-semibold text-zw-grey-600">Satılmayan kombinasyonlar:</span>
              {notSold.map((values) => (
                <Button
                  key={comboKey(own.optionIds, values)}
                  type="button"
                  size="sm"
                  variant="outline"
                  leftIcon={<Plus size={14} />}
                  onClick={() => restore(values)}
                >
                  {labelOf(values)}
                </Button>
              ))}
            </div>
          )}
        </Panel>
      )}
    </div>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return <div className="rounded-[4px] border border-zw-grey-200 bg-white p-5">{children}</div>;
}

/** Kategoride isaretli tanimlardan urunun kullanmadigi biri secilir. */
function OptionChooser({
  draft,
  exclude,
  onChoose,
  compact = false,
}: {
  draft: Product;
  /** Urunde zaten kullanilan tanimlar */
  exclude: string[];
  onChoose: (optionId: string) => void;
  /** Urunde secenek varken: yalnizca secim ve dugme */
  compact?: boolean;
}) {
  const db = useDatabase();
  const category = db.categories.find((c) => c.slug === draft.categorySlug);
  const pool = (category?.optionIds ?? [])
    .filter((id) => !exclude.includes(id))
    .flatMap((id) => db.optionDefinitions.filter((d) => d.id === id));
  const [choice, setChoice] = useState("");
  const selected = pool.some((d) => d.id === choice) ? choice : pool[0]?.id ?? "";

  const chooser = (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
      <div className="sm:w-80">
        <FormRow label={compact ? "Seçenek ekle" : "Seçenek"}>
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
  );

  if (compact) {
    return pool.length ? (
      chooser
    ) : (
      <p className="text-xs text-zw-grey-500">Kategoride işaretli başka seçenek yok.</p>
    );
  }

  return (
    <Panel>
      <p className="text-sm text-zw-grey-600">
        Ürün tek sayfada seçenekleriyle satılır (ör. Soğutma: Hava / Su, Torç Uzunluğu: 4 m / 8 m); satılan her
        kombinasyonun kendi ürün kodu ve fiyatı olur.
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
        <div className="mt-4">{chooser}</div>
      )}
    </Panel>
  );
}

/** Bir kombinasyonun satiri: kod, fiyat farki ve istege bagli farklar. */
function VariantCard({
  label,
  lines,
  variant,
  draft,
  onChange,
  onRemove,
}: {
  label: string;
  /** Teknik ozelliklere kendiliginden eklenen satirlar: "Torç Uzunluğu: 8 m" */
  lines: string[];
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
          aria-label={`${label} kombinasyonunu kaldır`}
          title="Bu kombinasyon satılmıyor"
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
            Eski ürün linki <span className="font-mono">/urun/{slug}</span> bu kombinasyonla açılır.
          </p>
        ))}

        <details open={extras} className="rounded-[4px] border border-zw-grey-100">
          <summary className="cursor-pointer px-3 py-2 text-sm font-semibold text-zw-grey-700">
            Bu kombinasyonda farklı olanlar (isteğe bağlı)
          </summary>
          <div className="space-y-5 border-t border-zw-grey-100 p-3">
            <VariantImage draft={draft} value={variant.image} onChange={(image) => patch({ image })} />

            <div>
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-zw-grey-600">
                Teknik özellik farkları
              </div>
              <p className="mb-2 text-xs text-zw-grey-500">
                Yalnızca bu kombinasyonda farklı olan satırlar (ör. Ağırlık); aynı adlı satırın yerine geçer.
                {lines.map((l) => `"${l}"`).join(", ")} satırı kendiliğinden eklenir.
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

/** Kutu icerigi: bossa urunun listesi; istenirse bu kombinasyon icin ayri liste. */
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
            Bu kombinasyon için ayrı liste
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
 * Baska urunlerin kodlari (urun ve varyant kodlari) -> nerede kullanildigi.
 * Kodlar tek havuzda benzersizdir; bayi ve satici stok dosyalari bu kodla
 * eslesir (buildCodeIndex).
 */
function codesInUse(products: Product[], selfId: string): Map<string, string> {
  const taken = new Map<string, string>();
  products
    .filter((p) => p.id !== selfId)
    .forEach((p) => {
      taken.set(normalizeCode(p.sku), `"${p.name}" ürününde kullanılıyor`);
      p.options?.variants.forEach((v) => taken.set(normalizeCode(v.sku), `"${p.name}" ürününün bir kombinasyonunda kullanılıyor`));
    });
  return taken;
}

/** Urunun kendi kodu baska bir urunun ya da varyantinin koduyla ayni olamaz. */
export function productCodeError(draft: Product, products: Product[]): string | null {
  const code = normalizeCode(draft.sku);
  const clash = code ? codesInUse(products, draft.id).get(code) : undefined;
  return clash ? `Ürün kodu (${draft.sku.trim()}) ${clash}.` : null;
}

/**
 * Secenekler: en fazla 3; her secenekte en az bir deger; ayni kombinasyon
 * iki kez olamaz. Kombinasyon kodlari zorunludur; urunun kendi koduyla,
 * ayni urunun baska kombinasyonuyla ya da baska bir urunun (veya
 * varyantinin) koduyla ayni olamaz. Fiyat eksiye dusemez.
 */
export function optionsError(draft: Product, definitions: OptionDefinition[], products: Product[]): string | null {
  const own = draft.options;
  if (!own) return null;
  if (own.optionIds.length > MAX_PRODUCT_OPTIONS) return `Bir üründe en fazla ${MAX_PRODUCT_OPTIONS} seçenek olur.`;
  const defs = own.optionIds.map((id) => definitions.find((d) => d.id === id));
  if (defs.some((d) => !d)) return "Ürünün seçenek tanımlarından biri bulunamadı.";
  const used = defs as OptionDefinition[];
  const empty = used.find((d) => !own.variants.some((v) => d.values.some((x) => x.id === v.values[d.id])));
  if (empty && own.variants.length) return `"${empty.name}" seçeneği için en az bir değer işaretleyin.`;
  const label = (v: ProductVariant) =>
    used.map((d) => d.values.find((x) => x.id === v.values[d.id])?.label ?? "?").join(" · ");

  const taken = codesInUse(products, draft.id);
  if (draft.sku.trim()) taken.set(normalizeCode(draft.sku), "ürünün kendi koduyla aynı olamaz");
  const combos = new Set<string>();

  for (const v of own.variants) {
    const name = label(v);
    if (used.some((d) => !d.values.some((x) => x.id === v.values[d.id])))
      return `"${name}" kombinasyonunda her seçenekten bir değer olmalı.`;
    const combo = own.optionIds.map((o) => v.values[o]).join("|");
    if (combos.has(combo)) return `"${name}" kombinasyonu iki kez girilmiş.`;
    combos.add(combo);
    const code = normalizeCode(v.sku);
    if (!code) return `"${name}" kombinasyonunun ürün kodu zorunludur.`;
    const clash = taken.get(code);
    if (clash) return `"${name}" kombinasyonunun kodu (${v.sku.trim()}) ${clash}.`;
    taken.set(code, `"${name}" kombinasyonunda da var`);
    if (draft.priceExVat + v.priceDeltaExVat < 0) return `"${name}" kombinasyonunun fiyatı eksiye düşüyor.`;
  }
  return null;
}

/**
 * Kayit icin toparlar: kombinasyonu olmayan secenekler kaldirilir, bos
 * satir ve maddeler atilir, urunden silinmis fotograf secimi temizlenir.
 * Eski ayri urunun linki (previousSlugs) korunur.
 */
export function tidyOptions(draft: Product): ProductOptions | undefined {
  const own = draft.options;
  if (!own?.variants.length) return undefined;
  const images = new Set(draft.images.map((i) => i.url));
  return {
    optionIds: own.optionIds,
    variants: own.variants.map(({ id, values, sku, priceDeltaExVat, specOverrides, inTheBox, image, previousSlugs }) => {
      const specs = (specOverrides ?? [])
        .map((r) => ({ label: r.label.trim(), value: r.value.trim() }))
        .filter((r) => r.label && r.value);
      const box = (inTheBox ?? []).map((x) => x.trim()).filter(Boolean);
      return {
        id,
        values: Object.fromEntries(own.optionIds.map((o) => [o, values[o]])),
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
