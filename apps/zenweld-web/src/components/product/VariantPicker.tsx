"use client";

import type { VariantGroupView } from "@zenweld/data";
import { activeOption, type VariantSelection } from "@/lib/variants";

/**
 * URUN SECENEKLERI
 *
 * Orn. torcun 3 / 4 / 5 metre secenekleri. Secim degisince fiyat, urun
 * kodu, teknik ozellikler ve bayi bulunurlugu ust bilesende yeniden
 * hesaplanir.
 */
export function VariantPicker({
  group,
  selection,
  onChange,
}: {
  group: VariantGroupView | undefined;
  selection: VariantSelection;
  onChange: (groupId: string, optionId: string) => void;
}) {
  if (!group) return null;
  const active = activeOption(group, selection)?.id;

  return (
    <div className="mt-6">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-zw-grey-600">{group.label}</div>
      <div className="flex flex-wrap gap-2">
        {group.options.map((option) => {
          const selected = option.id === active;
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(group.id, option.id)}
              className={`rounded-[4px] border-2 px-4 py-2 text-sm font-semibold transition-colors ${
                selected
                  ? "border-zw-red-600 bg-zw-red-50 text-zw-ink"
                  : "border-zw-grey-200 text-zw-grey-700 hover:border-zw-grey-500"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
