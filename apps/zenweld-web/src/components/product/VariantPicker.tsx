"use client";

import type { ProductOptionsView, VariantView } from "@zenweld/data";
import { pickValue, valueAvailable } from "@/lib/variants";

/**
 * URUN SECENEKLERI
 *
 * Her secenek (Soğutma, Torç Uzunluğu ...) ayri satirdir. Secim degisince
 * fiyat, urun kodu, teknik ozellikler ve bayi bulunurlugu ust bilesende
 * yeniden hesaplanir. Diger seceneklerdeki secimle satilmayan deger soluk
 * gorunur; secilirse diger secenekler satilan ilk kombinasyona gecer.
 */
export function VariantPicker({
  view,
  active,
  onChange,
}: {
  view: ProductOptionsView | undefined;
  active: VariantView | undefined;
  onChange: (variantId: string) => void;
}) {
  if (!view) return null;

  return (
    <div className="mt-6 space-y-4">
      {view.groups.map((group) => (
        <div key={group.id}>
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-zw-grey-600">{group.label}</div>
          <div className="flex flex-wrap gap-2">
            {group.values.map((value) => {
              const selected = active?.values[group.id] === value.id;
              const available = selected || valueAvailable(view, active, group.id, value.id);
              return (
                <button
                  key={value.id}
                  type="button"
                  aria-pressed={selected}
                  title={available ? undefined : "Bu seçimle birlikte satılmıyor; seçilirse diğer seçenekler değişir"}
                  onClick={() => {
                    const next = pickValue(view, active, group.id, value.id);
                    if (next) onChange(next.id);
                  }}
                  className={`rounded-[4px] border-2 px-4 py-2 text-sm font-semibold transition-colors ${
                    selected
                      ? "border-zw-red-600 bg-zw-red-50 text-zw-ink"
                      : available
                        ? "border-zw-grey-200 text-zw-grey-700 hover:border-zw-grey-500"
                        : "border-dashed border-zw-grey-200 text-zw-grey-400 hover:border-zw-grey-400"
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
  );
}
