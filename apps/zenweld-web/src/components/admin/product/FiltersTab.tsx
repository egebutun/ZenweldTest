"use client";

import Link from "next/link";
import { useDatabase } from "@zenweld/store";
import type { ProductTabProps } from "./types";

/**
 * Filtreler sekmesi: urunun kategorisindeki filtrelerde degerleri. Bir
 * filtrede birden cok deger isaretlenebilir. Filtreler ve degerler
 * kategorinin Filtreler sekmesinde tanimlanir; kategori degisirse eski
 * kategorinin degerleri kayitta silinir.
 */
export function FiltersTab({ draft, set }: ProductTabProps) {
  const db = useDatabase();
  const category = db.categories.find((c) => c.slug === draft.categorySlug);
  const filters = category?.filters ?? [];
  const values = draft.filterValues ?? {};

  const toggle = (filterId: string, valueId: string) => {
    const own = values[filterId] ?? [];
    set("filterValues", {
      ...values,
      [filterId]: own.includes(valueId) ? own.filter((v) => v !== valueId) : [...own, valueId],
    });
  };

  const categoryLink = category && (
    <Link href={`/yonetim/kategoriler/${category.id}`} className="font-semibold text-zw-red-600 hover:underline">
      {category.name}
    </Link>
  );

  if (filters.length === 0) {
    return (
      <div className="rounded-[4px] border border-zw-grey-200 bg-white p-5 text-sm text-zw-grey-600">
        Bu ürünün kategorisinde filtre yok. Filtreler kategorinin Filtreler sekmesinde tanımlanır
        {categoryLink && <> ({categoryLink})</>}.
      </div>
    );
  }

  return (
    <div className="rounded-[4px] border border-zw-grey-200 bg-white p-5">
      <p className="text-sm text-zw-grey-600">
        Kategori sayfasındaki filtrelerde bu ürünün değerleri; bir filtrede birden çok değer işaretlenebilir. Seçenekli
        üründe değerler ürünün tamamı içindir. Filtreler ve değerleri {categoryLink} kategorisinin Filtreler sekmesinde
        düzenlenir.
      </p>
      <div className="mt-5 space-y-4">
        {filters.map((f) => (
          <div key={f.id}>
            <div className="text-xs font-semibold uppercase tracking-wide text-zw-grey-600">{f.name}</div>
            {f.values.length === 0 ? (
              <p className="mt-1 text-sm text-zw-grey-500">Değer yok; kategorinin Filtreler sekmesinden eklenir.</p>
            ) : (
              <div className="mt-2 flex flex-wrap gap-2">
                {f.values.map((v) => {
                  const on = (values[f.id] ?? []).includes(v.id);
                  return (
                    <button
                      key={v.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggle(f.id, v.id)}
                      className={`rounded-[4px] border-2 px-3 py-1.5 text-sm font-semibold ${
                        on
                          ? "border-zw-red-600 bg-zw-red-50 text-zw-ink"
                          : "border-zw-grey-200 text-zw-grey-600 hover:border-zw-grey-500"
                      }`}
                    >
                      {v.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
