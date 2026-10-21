"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2, X } from "lucide-react";
import type { OptionDefinition, OptionValue } from "@zenweld/data";
import { uid } from "@zenweld/store";
import { Button, FormRow, Input } from "@zenweld/ui";
import { slugify } from "@zenweld/utils";
import { FormPanel } from "./content-form";

/**
 * KATEGORININ SECENEK HAVUZU (Kategoriler › kategori › Seçenekler)
 *
 * Secenek adi (orn. "Hortum Uzunluğu") ve sirali degerleri (3 m, 4 m ...).
 * Bu kategorideki urunlere secenek eklenirken degerler buradan secilir.
 * Her kategori kendi havuzunu tutar; hangi kategoride secenek olacagi
 * panelden belirlenir.
 */
export function CategoryOptionsPanel({
  value,
  onChange,
}: {
  value: OptionDefinition[];
  onChange: (options: OptionDefinition[]) => void;
}) {
  const update = (id: string, patch: Partial<OptionDefinition>) =>
    onChange(value.map((o) => (o.id === id ? { ...o, ...patch } : o)));

  return (
    <div className="space-y-5">
      <p className="text-sm text-zw-grey-600">
        Bu kategorideki ürünlere seçenek eklenirken (ör. 3 m / 5 m) değerler buradan seçilir; böylece
        aynı değer her üründe aynı yazılır. Bir ürün bir seçenek adı kullanır.
      </p>

      {value.map((option) => (
        <FormPanel key={option.id}>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <FormRow label="Seçenek Adı" required>
                <Input
                  value={option.name}
                  placeholder="ör. Hortum Uzunluğu, Paket"
                  onChange={(e) => update(option.id, { name: e.target.value })}
                />
              </FormRow>
            </div>
            <Button
              type="button"
              variant="outline"
              leftIcon={<Trash2 size={15} />}
              onClick={() => {
                if (window.confirm(`"${option.name || "Seçenek"}" ve değerleri silinsin mi?`)) {
                  onChange(value.filter((o) => o.id !== option.id));
                }
              }}
            >
              Sil
            </Button>
          </div>
          <OptionValues values={option.values} onChange={(values) => update(option.id, { values })} />
        </FormPanel>
      ))}

      {value.length === 0 && (
        <p className="rounded-[4px] border border-dashed border-zw-grey-300 bg-white px-4 py-6 text-center text-sm text-zw-grey-500">
          Bu kategoride henüz seçenek yok.
        </p>
      )}

      <Button
        type="button"
        variant="outline"
        leftIcon={<Plus size={16} />}
        onClick={() => onChange([...value, { id: uid("opt"), name: "", values: [] }])}
      >
        Seçenek Adı Ekle
      </Button>
    </div>
  );
}

/** Degerler: sirayla; yenisi kutuya yazilip Ekle (veya Enter) ile eklenir. */
function OptionValues({ values, onChange }: { values: OptionValue[]; onChange: (values: OptionValue[]) => void }) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const add = () => {
    const label = text.trim();
    if (!label) return;
    if (values.some((v) => v.label.toLocaleLowerCase("tr") === label.toLocaleLowerCase("tr"))) {
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
                onClick={() => onChange(values.filter((x) => x.id !== v.id))}
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

/** Kayit oncesi kontrol: bos ad, degersiz secenek, tekrar eden ad/deger. Hata yoksa null. */
export function optionsError(options: OptionDefinition[]): string | null {
  const names = new Set<string>();
  for (const o of options) {
    const name = o.name.trim();
    if (!name) return "Her seçeneğin bir adı olmalı.";
    const key = name.toLocaleLowerCase("tr");
    if (names.has(key)) return `"${name}" seçenek adı iki kez yazılmış.`;
    names.add(key);
    if (o.values.length === 0) return `"${name}" seçeneğine en az bir değer ekleyin.`;
    const labels = new Set<string>();
    for (const v of o.values) {
      const label = v.label.trim();
      if (!label) return `"${name}" seçeneğinde boş değer var.`;
      if (labels.has(label.toLocaleLowerCase("tr"))) return `"${name}" seçeneğinde "${label}" iki kez yazılmış.`;
      labels.add(label.toLocaleLowerCase("tr"));
    }
  }
  return null;
}

/** Kayitta ad ve degerlerin bas/son bosluklari temizlenir. */
export const cleanOptions = (options: OptionDefinition[]) =>
  options.map((o) => ({ ...o, name: o.name.trim(), values: o.values.map((v) => ({ ...v, label: v.label.trim() })) }));
