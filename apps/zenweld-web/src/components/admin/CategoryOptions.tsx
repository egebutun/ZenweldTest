"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import type { OptionDefinition } from "@zenweld/data";
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
 *
 * Isaret kaldirmak urunleri etkilemez (urun tanima baglidir); yalnizca yeni
 * eklemede listelenmez. Bu kategoride kullanilan tanimin yaninda urun sayisi
 * yazar, isareti kaldirilirken bu soylenip onay istenir.
 */
export function CategoryOptionsPanel({
  selected,
  onChange,
  categorySlug,
}: {
  selected: string[];
  onChange: (optionIds: string[]) => void;
  /** Kayitli kategorinin linki; yeni kategoride bos */
  categorySlug?: string;
}) {
  const db = useDatabase();
  const [creating, setCreating] = useState(false);
  const definitions = listOptionDefinitions(db);

  const usedBy = (id: string) =>
    categorySlug ? db.products.filter((p) => p.categorySlug === categorySlug && p.options?.optionIds.includes(id)).length : 0;

  const toggle = (o: OptionDefinition) => {
    if (!selected.includes(o.id)) return onChange([...selected, o.id]);
    const count = usedBy(o.id);
    if (
      count &&
      !window.confirm(
        `"${o.name}" bu kategoride ${count} üründe kullanılıyor. Bu ürünlerin seçenekleri değişmez; yalnızca bu kategoride yeni bir ürüne seçenek eklerken listelenmez. İşaret kaldırılsın mı?`,
      )
    ) {
      return;
    }
    onChange(selected.filter((x) => x !== o.id));
  };

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
        {definitions.map((o) => {
          const count = usedBy(o.id);
          return (
            <li key={o.id}>
              <label className="flex cursor-pointer items-start gap-3 px-4 py-3 hover:bg-zw-grey-50">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 accent-zw-red-600"
                  checked={selected.includes(o.id)}
                  onChange={() => toggle(o)}
                />
                <span className="min-w-0">
                  <span className="block font-semibold text-zw-ink">{o.name}</span>
                  <span className="block text-xs text-zw-grey-500">{o.values.map((v) => v.label).join(" · ")}</span>
                  {count > 0 && (
                    <span className="mt-0.5 block text-xs font-semibold text-zw-grey-700">
                      Bu kategoride {count} üründe kullanılıyor
                    </span>
                  )}
                </span>
              </label>
            </li>
          );
        })}
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
