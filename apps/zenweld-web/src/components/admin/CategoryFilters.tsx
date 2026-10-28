"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import type { CategoryFilter, Product, ProductFilterValues } from "@zenweld/data";
import { Button, Input } from "@zenweld/ui";
import { slugify } from "@zenweld/utils";
import { ValueListEditor } from "./OptionEditor";

/**
 * KATEGORININ FILTRELERI (Kategoriler › kategori › Filtreler)
 *
 * Ust kisim: kategori sayfasindaki filtreler ve degerleri (ad, sira).
 * Filtreler kategoriye ozeldir; ayni adli filtrenin degerleri kategoriye
 * gore degisebilir. Alt kisim: eslesme tablosu; kategorinin urunlerine
 * filtre degerleri isaretlenir. Hepsi formun Kaydet dugmesiyle yazilir.
 */

/** Urun kimligi -> formda degistirilen filtre degerleri */
export type FilterMapping = Record<string, ProductFilterValues | undefined>;

export function CategoryFiltersPanel({
  filters,
  onChange,
  products,
  mapping,
  onMappingChange,
}: {
  filters: CategoryFilter[];
  onChange: (filters: CategoryFilter[]) => void;
  /** Kategorinin kayitli urunleri (yeni kategoride bos) */
  products: Product[];
  mapping: FilterMapping;
  onMappingChange: (mapping: FilterMapping) => void;
}) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const valuesOf = (p: Product) => (p.id in mapping ? mapping[p.id] : p.filterValues) ?? {};
  const usedBy = (filterId: string, valueId?: string) =>
    products.filter((p) => {
      const own = valuesOf(p)[filterId] ?? [];
      return valueId ? own.includes(valueId) : own.length > 0;
    }).length;

  const update = (id: string, change: Partial<CategoryFilter>) =>
    onChange(filters.map((f) => (f.id === id ? { ...f, ...change } : f)));

  const add = () => {
    const label = name.trim();
    if (!label) return;
    if (filters.some((f) => f.name.trim().toLocaleLowerCase("tr") === label.toLocaleLowerCase("tr"))) {
      return setError(`"${label}" adında bir filtre zaten var.`);
    }
    // Kimlik ilk addan uretilir ve sonra degismez (sayfa adresinde kullanilir).
    const base = slugify(label) || "filtre";
    let id = base;
    for (let n = 2; filters.some((f) => f.id === id); n++) id = `${base}-${n}`;
    onChange([...filters, { id, name: label, values: [] }]);
    setName("");
    setError(null);
  };

  const move = (index: number, dir: -1 | 1) => {
    const next = [...filters];
    [next[index], next[index + dir]] = [next[index + dir], next[index]];
    onChange(next);
  };

  const remove = (f: CategoryFilter) => {
    const count = usedBy(f.id);
    const where = count ? ` ${count} üründe değeri işaretli; kaydedince bu ürünlerden de kalkar.` : "";
    if (window.confirm(`"${f.name}" filtresi silinsin mi?${where}`)) onChange(filters.filter((x) => x.id !== f.id));
  };

  const toggle = (p: Product, filterId: string, valueId: string) => {
    const current = valuesOf(p);
    const own = current[filterId] ?? [];
    const nextOwn = own.includes(valueId) ? own.filter((v) => v !== valueId) : [...own, valueId];
    onMappingChange({ ...mapping, [p.id]: { ...current, [filterId]: nextOwn } });
  };

  const columns = filters.filter((f) => f.values.length > 0);

  return (
    <div className="space-y-6">
      <div className="rounded-[4px] border border-zw-grey-200 bg-white p-5">
        <p className="text-sm text-zw-grey-600">
          Kategori sayfasında soldaki filtreler (telefonda Filtreler penceresi), bu sırayla. Değeri olmayan filtre
          sitede görünmez. Hiçbir ürüne eşlenmemiş filtre sitede seçilebilir ama sonucu daraltmaz.
        </p>

        <div className="mt-5 space-y-3">
          {filters.map((f, index) => {
            const count = usedBy(f.id);
            return (
              <div key={f.id} className="rounded-[4px] border border-zw-grey-200 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-display text-lg font-bold">{index + 1}.</span>
                  <Input
                    className="max-w-xs py-1.5 font-semibold"
                    aria-label="Filtre adı"
                    value={f.name}
                    onChange={(e) => update(f.id, { name: e.target.value })}
                  />
                  <span className="text-xs text-zw-grey-500">
                    {f.values.length === 0
                      ? "Değer yok; sitede görünmez"
                      : `${count}/${products.length} üründe işaretli`}
                  </span>
                  <div className="ml-auto flex gap-1">
                    <button
                      type="button"
                      aria-label={`${f.name} filtresini yukarı taşı`}
                      disabled={index === 0}
                      onClick={() => move(index, -1)}
                      className="rounded-[3px] p-1.5 text-zw-grey-400 hover:bg-zw-grey-100 hover:text-zw-ink disabled:opacity-30"
                    >
                      <ArrowUp size={16} />
                    </button>
                    <button
                      type="button"
                      aria-label={`${f.name} filtresini aşağı taşı`}
                      disabled={index === filters.length - 1}
                      onClick={() => move(index, 1)}
                      className="rounded-[3px] p-1.5 text-zw-grey-400 hover:bg-zw-grey-100 hover:text-zw-ink disabled:opacity-30"
                    >
                      <ArrowDown size={16} />
                    </button>
                    <button
                      type="button"
                      aria-label={`${f.name} filtresini sil`}
                      onClick={() => remove(f)}
                      className="rounded-[3px] p-1.5 text-zw-grey-400 hover:bg-zw-grey-100 hover:text-zw-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="mt-3">
                  <ValueListEditor
                    values={f.values}
                    onChange={(values) => update(f.id, { values })}
                    placeholder="Yeni değer, ör. 380 V"
                    canRemove={(value) => {
                      const used = usedBy(f.id, value.id);
                      return (
                        !used ||
                        window.confirm(
                          `"${value.label}" ${used} üründe işaretli; kaydedince bu ürünlerden de kalkar. Silinsin mi?`,
                        )
                      );
                    }}
                  />
                </div>
              </div>
            );
          })}
          {filters.length === 0 && (
            <p className="rounded-[4px] border border-dashed border-zw-grey-300 px-4 py-6 text-center text-sm text-zw-grey-500">
              Bu kategoride filtre yok; kategori sayfasında yalnızca sıralama görünür.
            </p>
          )}
        </div>

        <div className="mt-4 flex max-w-xl gap-2">
          <Input
            value={name}
            placeholder="Yeni filtre adı, ör. Amper"
            onChange={(e) => {
              setName(e.target.value);
              setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              e.preventDefault();
              add();
            }}
          />
          <Button type="button" variant="outline" className="shrink-0" leftIcon={<Plus size={15} />} onClick={add}>
            Filtre Ekle
          </Button>
        </div>
        {error && <p className="mt-1 text-xs font-semibold text-zw-red-600">{error}</p>}
      </div>

      <div className="rounded-[4px] border border-zw-grey-200 bg-white p-5">
        <div className="text-xs font-semibold uppercase tracking-wide text-zw-grey-600">
          Ürünlerin Değerleri ({products.length})
        </div>
        <p className="mt-1 text-sm text-zw-grey-600">
          Her ürüne filtre değerlerini işaretleyin; bir filtrede birden çok değer işaretlenebilir. Boş hücre: değer
          girilmemiş. Tek ürünün değerleri ürünün Filtreler sekmesinden de değiştirilebilir.
        </p>

        {products.length === 0 ? (
          <p className="mt-4 text-sm text-zw-grey-500">Bu kategoride henüz ürün yok.</p>
        ) : columns.length === 0 ? (
          <p className="mt-4 text-sm text-zw-grey-500">Değeri olan filtre yok.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-zw-grey-50 text-left text-xs uppercase tracking-wide text-zw-grey-600">
                <tr>
                  <th className="px-3 py-2">Ürün</th>
                  {columns.map((f) => (
                    <th key={f.id} className="px-3 py-2">
                      {f.name}
                      <span className="ml-1 font-normal normal-case text-zw-grey-500">
                        ({usedBy(f.id)}/{products.length})
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zw-grey-100">
                {products.map((p) => (
                  <tr key={p.id}>
                    <td className="px-3 py-2 align-top">
                      <Link
                        href={`/yonetim/urunler/${p.id}`}
                        className="font-semibold text-zw-ink hover:text-zw-red-600 hover:underline"
                      >
                        {p.name}
                      </Link>
                      <div className="text-xs text-zw-grey-500">{p.sku}</div>
                    </td>
                    {columns.map((f) => {
                      const own = valuesOf(p)[f.id] ?? [];
                      return (
                        <td key={f.id} className={`px-3 py-2 align-top ${own.length ? "" : "bg-amber-50"}`}>
                          <div className="flex flex-col gap-1">
                            {f.values.map((v) => (
                              <label key={v.id} className="flex cursor-pointer items-center gap-2 whitespace-nowrap">
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 accent-zw-red-600"
                                  aria-label={`${p.name}: ${f.name} ${v.label}`}
                                  checked={own.includes(v.id)}
                                  onChange={() => toggle(p, f.id, v.id)}
                                />
                                {v.label}
                              </label>
                            ))}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/** Kayit oncesi kontrol: bos ya da tekrar eden filtre adi, bos ya da tekrar eden deger. */
export function filtersError(filters: CategoryFilter[]): string | null {
  const names = new Set<string>();
  for (const f of filters) {
    const name = f.name.trim();
    if (!name) return "Adı boş bir filtre var.";
    const key = name.toLocaleLowerCase("tr");
    if (names.has(key)) return `"${name}" filtresi iki kez yazılmış.`;
    names.add(key);
    const labels = new Set<string>();
    for (const v of f.values) {
      const label = v.label.trim();
      if (!label) return `"${name}" filtresinde boş değer var.`;
      if (labels.has(label.toLocaleLowerCase("tr"))) return `"${name}" filtresinde "${label}" iki kez yazılmış.`;
      labels.add(label.toLocaleLowerCase("tr"));
    }
  }
  return null;
}
