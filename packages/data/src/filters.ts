import type { CategoryFilter, Product, ProductFilterValues } from "./types";

/**
 * KATEGORI FILTRELERI (alt kategori sayfasi)
 *
 * Kategori kendi filtrelerini tanimlar (Category.filters); urun kendi
 * degerlerini tasir (Product.filterValues).
 *
 * - Ayni filtrede birden cok deger "ya o ya bu"dur; farkli filtreler
 *   birlikte uygulanir.
 * - Kategoride hicbir urune eslenmemis filtre (henuz hicbir urunde degeri
 *   isaretli degil) secilebilir ama sonucu daraltmaz; degerlerinin yaninda
 *   sayi yazmaz. Bir urune deger isaretlenince normal calisir.
 * - Degeri olmayan filtre sitede gosterilmez.
 */

/** Ziyaretcinin secimi: filtre kimligi -> secili deger kimlikleri. */
export type FilterSelection = Record<string, string[]>;

export interface FilterFacetValue {
  id: string;
  label: string;
  /** Secilirse kac urun kalir (diger filtrelerdeki secimle); eslenmemis filtrede null */
  count: number | null;
  selected: boolean;
}

export interface FilterFacet {
  id: string;
  name: string;
  /** Kategoride en az bir urune eslenmis mi; eslenmemis filtre sonucu daraltmaz */
  mapped: boolean;
  values: FilterFacetValue[];
}

const own = (product: Product, filterId: string) => product.filterValues?.[filterId] ?? [];

/** Listedeki en az bir urunde degeri isaretli filtreler. */
export function mappedFilterIds(filters: CategoryFilter[], products: Product[]): Set<string> {
  return new Set(filters.filter((f) => products.some((p) => own(p, f.id).length > 0)).map((f) => f.id));
}

/** Urun secime uyuyor mu; `except` filtresi atlanir (o filtrenin sayilari icin). */
function matches(product: Product, selection: FilterSelection, mapped: Set<string>, except?: string): boolean {
  return Object.entries(selection).every(
    ([filterId, valueIds]) =>
      filterId === except || !mapped.has(filterId) || !valueIds.length || valueIds.some((v) => own(product, filterId).includes(v)),
  );
}

/** Secime uyan urunler (sira korunur). */
export function applyFilterSelection(products: Product[], filters: CategoryFilter[], selection: FilterSelection): Product[] {
  const mapped = mappedFilterIds(filters, products);
  return products.filter((p) => matches(p, selection, mapped));
}

/** Sitede gosterilecek filtreler: degeri olanlar, tanimdaki sirayla, sayilariyla. */
export function filterFacets(filters: CategoryFilter[], products: Product[], selection: FilterSelection): FilterFacet[] {
  const mapped = mappedFilterIds(filters, products);
  return filters
    .filter((f) => f.values.length > 0)
    .map((f) => {
      const isMapped = mapped.has(f.id);
      const pool = isMapped ? products.filter((p) => matches(p, selection, mapped, f.id)) : [];
      return {
        id: f.id,
        name: f.name,
        mapped: isMapped,
        values: f.values.map((v) => ({
          id: v.id,
          label: v.label,
          count: isMapped ? pool.filter((p) => own(p, f.id).includes(v.id)).length : null,
          selected: selection[f.id]?.includes(v.id) ?? false,
        })),
      };
    });
}

/** Gecerli filtre ve degerlere indirger: bilinmeyen atilir, bos secim silinir, sira tanimdaki gibi. */
export function cleanSelection(selection: FilterSelection, filters: CategoryFilter[]): FilterSelection {
  const out: FilterSelection = {};
  for (const f of filters) {
    const picked = f.values.filter((v) => selection[f.id]?.includes(v.id)).map((v) => v.id);
    if (picked.length) out[f.id] = picked;
  }
  return out;
}

/** Adresten secim: ?model-serisi=ultimate,force&fiziki-yapi=kompakt */
export function selectionFromQuery(params: URLSearchParams, filters: CategoryFilter[]): FilterSelection {
  const raw: FilterSelection = {};
  for (const f of filters) {
    const value = params.get(f.id);
    if (value) raw[f.id] = value.split(",");
  }
  return cleanSelection(raw, filters);
}

/** Secimi adres parametrelerine yazar; filtreye ait olmayan parametreler korunur. */
export function writeSelectionToQuery(params: URLSearchParams, selection: FilterSelection, filters: CategoryFilter[]): URLSearchParams {
  const next = new URLSearchParams(params);
  const clean = cleanSelection(selection, filters);
  for (const f of filters) {
    if (clean[f.id]) next.set(f.id, clean[f.id].join(","));
    else next.delete(f.id);
  }
  return next;
}

/**
 * Kayit icin toparlar: kategoride olmayan filtre ve deger atilir, tekrar ve
 * bos liste silinir; hic deger kalmazsa undefined.
 */
export function tidyFilterValues(
  values: ProductFilterValues | undefined,
  filters: CategoryFilter[] | undefined,
): ProductFilterValues | undefined {
  const clean = cleanSelection(values ?? {}, filters ?? []);
  return Object.keys(clean).length ? clean : undefined;
}
