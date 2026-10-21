"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Plus, X } from "lucide-react";
import type { OptionDefinition, OptionValue } from "@zenweld/data";
import { listOptionDefinitions, productsUsingOption, saveOptionDefinition, useDatabase } from "@zenweld/store";
import { Button, FormRow, Input, Modal } from "@zenweld/ui";
import { slugify } from "@zenweld/utils";

/**
 * SECENEK TANIMI PENCERESI (yeni / duzenle)
 *
 * Ad (orn. "Hortum Uzunluğu") ve sirali degerler (3 m, 4 m ...). Seçenek
 * Tanımları ekraninda ve kategorinin Seçenekler sekmesinde (yeni tanim)
 * kullanilir. Kaydedince tanim hemen yazilir; onSaved kaydi alir. Urunde
 * kullanilan deger silinemez.
 */
export function OptionDefinitionModal({
  initial,
  onClose,
  onSaved,
}: {
  /** Duzenlenen tanim; yeni tanimda bos */
  initial?: OptionDefinition;
  onClose: () => void;
  onSaved?: (definition: OptionDefinition) => void;
}) {
  const db = useDatabase();
  const [draft, setDraft] = useState<OptionDefinition>(initial ?? { id: "", name: "", values: [] });
  const [error, setError] = useState<string | null>(null);

  const save = () => {
    const problem = definitionError(draft, listOptionDefinitions(db));
    if (problem) return setError(problem);
    const saved = saveOptionDefinition({
      ...draft,
      name: draft.name.trim(),
      values: draft.values.map((v) => ({ ...v, label: v.label.trim() })),
    });
    if (!saved) return setError("Kaydedilemedi: tarayıcı deposu dolu.");
    onSaved?.(saved);
    onClose();
  };

  return (
    <Modal open onClose={onClose} title={initial ? "Seçeneği Düzenle" : "Yeni Seçenek"}>
      <div className="space-y-4">
        <FormRow label="Seçenek Adı" required>
          <Input
            value={draft.name}
            placeholder="ör. Hortum Uzunluğu, Paket"
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          />
        </FormRow>
        <OptionValues
          values={draft.values}
          onChange={(values) => setDraft({ ...draft, values })}
          usedBy={(valueId) => (draft.id ? productsUsingOption(draft.id, valueId, db).length : 0)}
        />
        {error && <p className="text-sm font-semibold text-zw-red-600">{error}</p>}
        <div className="flex gap-3 pt-2">
          <Button onClick={save}>Kaydet</Button>
          <Button variant="outline" onClick={onClose}>
            Vazgeç
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/** Degerler: sirayla; yenisi kutuya yazilip Ekle (veya Enter) ile eklenir. */
function OptionValues({
  values,
  onChange,
  usedBy,
}: {
  values: OptionValue[];
  onChange: (values: OptionValue[]) => void;
  /** Degeri kullanan urun sayisi */
  usedBy: (valueId: string) => number;
}) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const add = () => {
    const label = text.trim();
    if (!label) return;
    if (values.some((v) => v.label.trim().toLocaleLowerCase("tr") === label.toLocaleLowerCase("tr"))) {
      return setError(`"${label}" zaten var.`);
    }
    // Kimlik ilk addan uretilir ve sonra degismez; ayni kimlik varsa sonuna numara eklenir.
    const base = slugify(label) || "deger";
    let id = base;
    for (let n = 2; values.some((v) => v.id === id); n++) id = `${base}-${n}`;
    onChange([...values, { id, label }]);
    setText("");
    setError(null);
  };

  const move = (index: number, dir: -1 | 1) => {
    const next = [...values];
    [next[index], next[index + dir]] = [next[index + dir], next[index]];
    onChange(next);
  };

  return (
    <div>
      <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-zw-grey-600">Değerler</div>
      {values.length > 0 && (
        <ul className="mb-3 divide-y divide-zw-grey-100 rounded-[4px] border border-zw-grey-200">
          {values.map((v, i) => (
            <li key={v.id} className="flex items-center gap-2 px-2 py-1.5">
              <button
                type="button"
                aria-label="Yukarı taşı"
                disabled={i === 0}
                onClick={() => move(i, -1)}
                className="rounded-[3px] p-1 text-zw-grey-500 hover:bg-zw-grey-100 disabled:opacity-30"
              >
                <ArrowUp size={14} />
              </button>
              <button
                type="button"
                aria-label="Aşağı taşı"
                disabled={i === values.length - 1}
                onClick={() => move(i, 1)}
                className="rounded-[3px] p-1 text-zw-grey-500 hover:bg-zw-grey-100 disabled:opacity-30"
              >
                <ArrowDown size={14} />
              </button>
              <Input
                className="py-1.5"
                aria-label="Değer"
                value={v.label}
                onChange={(e) => onChange(values.map((x) => (x.id === v.id ? { ...x, label: e.target.value } : x)))}
              />
              <button
                type="button"
                aria-label={`${v.label} değerini sil`}
                onClick={() => {
                  const count = usedBy(v.id);
                  if (count) return setError(`"${v.label}" ${count} üründe kullanılıyor; önce ürünün Seçenekler sekmesinden kaldırın.`);
                  onChange(values.filter((x) => x.id !== v.id));
                }}
                className="rounded-[3px] p-1.5 text-zw-grey-400 hover:bg-zw-grey-100 hover:text-zw-red-600"
              >
                <X size={15} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <Input
          value={text}
          placeholder="Yeni değer, ör. 10 m"
          onChange={(e) => {
            setText(e.target.value);
            setError(null);
          }}
          onKeyDown={(e) => {
            if (e.key !== "Enter") return;
            e.preventDefault();
            add();
          }}
        />
        <Button type="button" variant="outline" leftIcon={<Plus size={15} />} onClick={add}>
          Ekle
        </Button>
      </div>
      {error && <p className="mt-1 text-xs font-semibold text-zw-red-600">{error}</p>}
    </div>
  );
}

/** Kayit oncesi kontrol: bos ad, baska tanimda ayni ad, degersiz tanim, tekrar eden deger. */
function definitionError(draft: OptionDefinition, all: OptionDefinition[]): string | null {
  const name = draft.name.trim();
  if (!name) return "Seçenek adı zorunludur.";
  const key = name.toLocaleLowerCase("tr");
  if (all.some((o) => o.id !== draft.id && o.name.trim().toLocaleLowerCase("tr") === key)) {
    return `"${name}" adında bir seçenek zaten var.`;
  }
  if (draft.values.length === 0) return "En az bir değer ekleyin.";
  const labels = new Set<string>();
  for (const v of draft.values) {
    const label = v.label.trim();
    if (!label) return "Boş değer var.";
    if (labels.has(label.toLocaleLowerCase("tr"))) return `"${label}" iki kez yazılmış.`;
    labels.add(label.toLocaleLowerCase("tr"));
  }
  return null;
}
