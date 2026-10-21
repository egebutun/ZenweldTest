"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { listOptionDefinitions, useDatabase } from "@zenweld/store";
import { Button } from "@zenweld/ui";
import { OptionDefinitionModal } from "./OptionEditor";

/**
 * KATEGORININ SECENEKLERI (Kategoriler › kategori › Seçenekler)
 *
 * Bu kategorideki urune secenek eklenirken hangi tanimlarin listelenecegi
 * isaretlenir. Tanimlar ortaktir (Ürünler › Seçenek Tanımları); kategori
 * yalnizca kimliklerini tutar. Buradan yeni tanim da acilabilir; kaydedilince
 * isaretli gelir.
 */
export function CategoryOptionsPanel({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (optionIds: string[]) => void;
}) {
  const db = useDatabase();
  const [creating, setCreating] = useState(false);
  const definitions = listOptionDefinitions(db);

  const toggle = (id: string) =>
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-zw-grey-600">
        Bu kategorideki ürünlere seçenek eklenirken (ör. 3 m / 5 m) işaretli seçenekler listelenir. Seçeneklerin
        adı ve değerleri{" "}
        <Link href="/yonetim/secenekler" className="font-semibold text-zw-red-600 hover:underline">
          Seçenek Tanımları
        </Link>{" "}
        ekranında düzenlenir; aynı seçenek birden çok kategoride kullanılabilir.
      </p>

      <ul className="divide-y divide-zw-grey-100 rounded-[4px] border border-zw-grey-200 bg-white">
        {definitions.map((o) => (
          <li key={o.id}>
            <label className="flex cursor-pointer items-start gap-3 px-4 py-3 hover:bg-zw-grey-50">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 accent-zw-red-600"
                checked={selected.includes(o.id)}
                onChange={() => toggle(o.id)}
              />
              <span className="min-w-0">
                <span className="block font-semibold text-zw-ink">{o.name}</span>
                <span className="block text-xs text-zw-grey-500">{o.values.map((v) => v.label).join(" · ")}</span>
              </span>
            </label>
          </li>
        ))}
        {definitions.length === 0 && (
          <li className="px-4 py-6 text-center text-sm text-zw-grey-500">Henüz seçenek tanımı yok.</li>
        )}
      </ul>

      <Button type="button" variant="outline" leftIcon={<Plus size={16} />} onClick={() => setCreating(true)}>
        Yeni Seçenek Tanımı
      </Button>

      {creating && (
        <OptionDefinitionModal
          onClose={() => setCreating(false)}
          onSaved={(definition) => onChange([...selected, definition.id])}
        />
      )}
    </div>
  );
}
