"use client";

import { byProductOrder, salePriceExVat, type FilterFacet, type Product } from "@zenweld/data";
import { useT } from "@/lib/i18n-client";
import { Select } from "@zenweld/ui";

export type SortKey = "featured" | "priceAsc" | "priceDesc" | "nameAsc" | "newest";

export interface FilterState {
  sort: SortKey;
  maxPrice: number | null;
}

export const DEFAULT_FILTERS: FilterState = {
  sort: "featured",
  maxPrice: null,
};

/**
 * Kategori sayfasinin sol sutunu (telefonda Filtreler penceresi): siralama
 * ve kategorinin filtreleri. Filtrelerin kurallari: packages/data/src/filters.ts.
 */
export function ProductFilters({
  value,
  onChange,
  resultCount,
  facets,
  onToggleValue,
  onClear,
}: {
  value: FilterState;
  onChange: (next: FilterState) => void;
  resultCount: number;
  /** Kategorinin filtreleri (filterFacets); filtresiz kategoride bos */
  facets: FilterFacet[];
  onToggleValue: (filterId: string, valueId: string) => void;
  /** Siralamayi ve filtre secimini sifirlar */
  onClear: () => void;
}) {
  const t = useT();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold uppercase">{t.filters.title}</h3>
        <button
          onClick={onClear}
          className="text-xs font-semibold uppercase text-zw-red-600 hover:underline"
        >
          {t.filters.clear}
        </button>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zw-grey-600">
          {t.filters.sort}
        </label>
        <Select
          value={value.sort}
          onChange={(e) => onChange({ ...value, sort: e.target.value as SortKey })}
        >
          <option value="featured">{t.filters.sortFeatured}</option>
          <option value="priceAsc">{t.filters.sortPriceAsc}</option>
          <option value="priceDesc">{t.filters.sortPriceDesc}</option>
          <option value="nameAsc">{t.filters.sortNameAsc}</option>
          <option value="newest">{t.filters.sortNewest}</option>
        </Select>
      </div>

      {facets.map((f) => (
        <fieldset key={f.id}>
          <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-zw-grey-600">{f.name}</legend>
          <div className="space-y-1.5">
            {f.values.map((v) => {
              // Secilirse hic urun kalmayacak deger soluk; secili olan her zaman kaldirilabilir.
              const disabled = v.count === 0 && !v.selected;
              return (
                <label
                  key={v.id}
                  className={`flex items-center gap-2 text-sm ${
                    disabled ? "cursor-not-allowed text-zw-grey-400" : "cursor-pointer text-zw-ink"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-zw-red-600"
                    checked={v.selected}
                    disabled={disabled}
                    onChange={() => onToggleValue(f.id, v.id)}
                  />
                  <span>{v.label}</span>
                  {v.count !== null && <span className="text-xs text-zw-grey-500">({v.count})</span>}
                </label>
              );
            })}
          </div>
        </fieldset>
      ))}


      <div className="rounded-[4px] bg-zw-grey-50 px-3 py-2 text-sm text-zw-grey-600">
        {t.filters.productCount.replace("{count}", String(resultCount))}
      </div>
    </div>
  );
}

/**
 * Filtre ve siralama. Fiyat filtresi ve fiyata gore siralama, musterinin
 * GORDUGU fiyatla (kampanya uygulanmis) yapilir; aksi halde "fiyata gore
 * artan" listede indirimli urun yanlis sirada durur.
 */
export function applyFilters(items: Product[], filters: FilterState, now?: Date): Product[] {
  let out = items;
  const price = (p: Product) => salePriceExVat(p, now);

  if (filters.maxPrice != null) out = out.filter((p) => price(p) <= filters.maxPrice!);

  const sorted = [...out];
  switch (filters.sort) {
    case "priceAsc":
      sorted.sort((a, b) => price(a) - price(b));
      break;
    case "priceDesc":
      sorted.sort((a, b) => price(b) - price(a));
      break;
    case "nameAsc":
      sorted.sort((a, b) => a.name.localeCompare(b.name, "tr"));
      break;
    case "newest":
      sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      break;
    default:
      // "Önerilen": panelde verilen Sıra numarasi.
      sorted.sort(byProductOrder);
      break;
  }
  return sorted;
}
