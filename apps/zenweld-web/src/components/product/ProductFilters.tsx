"use client";

import type { WeldingProcess } from "@zenweld/data";
import { useT } from "@/lib/i18n-client";
import { Checkbox, Select } from "@zenweld/ui";

export type SortKey = "featured" | "priceAsc" | "priceDesc" | "nameAsc" | "newest";

export interface FilterState {
  processes: WeldingProcess[];
  inStockOnly: boolean;
  sort: SortKey;
  maxPrice: number | null;
}

export const DEFAULT_FILTERS: FilterState = {
  processes: [],
  inStockOnly: false,
  sort: "featured",
  maxPrice: null,
};

const ALL_PROCESSES: WeldingProcess[] = [
  "MULTI",
  "MIG",
  "MAG",
  "PULSE",
  "TIG",
  "MMA",
  "PLAZMA",
];

export function ProductFilters({
  value,
  onChange,
  availableProcesses,
  resultCount,
}: {
  value: FilterState;
  onChange: (next: FilterState) => void;
  availableProcesses: WeldingProcess[];
  resultCount: number;
}) {
  const t = useT();
  const processes = ALL_PROCESSES.filter((p) => availableProcesses.includes(p));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold uppercase">{t.filters.title}</h3>
        <button
          onClick={() => onChange(DEFAULT_FILTERS)}
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

      {processes.length > 0 && (
        <div>
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-zw-grey-600">
            {t.filters.process}
          </div>
          <div className="space-y-2">
            {processes.map((p) => (
              <Checkbox
                key={p}
                label={p}
                checked={value.processes.includes(p)}
                onChange={(e) =>
                  onChange({
                    ...value,
                    processes: e.target.checked
                      ? [...value.processes, p]
                      : value.processes.filter((x) => x !== p),
                  })
                }
              />
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-zw-grey-600">
          {t.filters.availability}
        </div>
        <Checkbox
          label={t.filters.inStockOnly}
          checked={value.inStockOnly}
          onChange={(e) => onChange({ ...value, inStockOnly: e.target.checked })}
        />
      </div>

      <div className="rounded-[4px] bg-zw-grey-50 px-3 py-2 text-sm text-zw-grey-600">
        {t.filters.productCount.replace("{count}", String(resultCount))}
      </div>
    </div>
  );
}

export function applyFilters<
  T extends {
    processes: WeldingProcess[];
    inStock: boolean;
    priceExVat: number;
    name: string;
    featured: boolean;
    createdAt: string;
  },
>(items: T[], filters: FilterState): T[] {
  let out = items;

  if (filters.processes.length > 0) {
    out = out.filter((p) => p.processes.some((proc) => filters.processes.includes(proc)));
  }
  if (filters.inStockOnly) out = out.filter((p) => p.inStock);
  if (filters.maxPrice != null) out = out.filter((p) => p.priceExVat <= filters.maxPrice!);

  const sorted = [...out];
  switch (filters.sort) {
    case "priceAsc":
      sorted.sort((a, b) => a.priceExVat - b.priceExVat);
      break;
    case "priceDesc":
      sorted.sort((a, b) => b.priceExVat - a.priceExVat);
      break;
    case "nameAsc":
      sorted.sort((a, b) => a.name.localeCompare(b.name, "tr"));
      break;
    case "newest":
      sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      break;
    default:
      sorted.sort((a, b) => Number(b.featured) - Number(a.featured));
  }
  return sorted;
}
