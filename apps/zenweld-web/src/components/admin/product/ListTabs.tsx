"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button, Input } from "@zenweld/ui";
import type { ProductTabProps } from "./types";

/** Teknik Ozellikler sekmesi: TR/EN ozellik–deger satirlari. */
export function SpecsTab({ draft, set }: ProductTabProps) {
  return (
    <div className="rounded-[4px] border border-zw-grey-200 bg-white p-5">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-semibold text-zw-grey-600">
          Teknik özellik satırları
        </span>
        <Button
          type="button"
          size="sm"
          variant="outline"
          leftIcon={<Plus size={14} />}
          onClick={() =>
            set("specs", [
              ...draft.specs,
              { label: { tr: "", en: "" }, value: { tr: "", en: "" } },
            ])
          }
        >
          Satır Ekle
        </Button>
      </div>

      <div className="space-y-2">
        {draft.specs.map((row, i) => (
          <div key={i} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
            <div className="grid gap-1">
              <Input
                placeholder="Özellik (TR)"
                value={row.label.tr}
                onChange={(e) => {
                  const next = [...draft.specs];
                  next[i] = { ...next[i], label: { ...next[i].label, tr: e.target.value } };
                  set("specs", next);
                }}
              />
              <Input
                placeholder="Özellik (EN)"
                value={row.label.en}
                onChange={(e) => {
                  const next = [...draft.specs];
                  next[i] = { ...next[i], label: { ...next[i].label, en: e.target.value } };
                  set("specs", next);
                }}
              />
            </div>
            <div className="grid gap-1">
              <Input
                placeholder="Değer (TR)"
                value={row.value.tr}
                onChange={(e) => {
                  const next = [...draft.specs];
                  next[i] = { ...next[i], value: { ...next[i].value, tr: e.target.value } };
                  set("specs", next);
                }}
              />
              <Input
                placeholder="Değer (EN)"
                value={row.value.en}
                onChange={(e) => {
                  const next = [...draft.specs];
                  next[i] = { ...next[i], value: { ...next[i].value, en: e.target.value } };
                  set("specs", next);
                }}
              />
            </div>
            <button
              type="button"
              onClick={() => set("specs", draft.specs.filter((_, x) => x !== i))}
              className="self-start px-2 py-2 text-zw-grey-400 hover:text-zw-red-600"
            >
              <Trash2 size={17} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Kutu Icerigi sekmesi: TR/EN madde listesi. */
export function InTheBoxTab({ draft, set }: ProductTabProps) {
  return (
    <div className="rounded-[4px] border border-zw-grey-200 bg-white p-5">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-semibold text-zw-grey-600">Kutu içeriği maddeleri</span>
        <Button
          type="button"
          size="sm"
          variant="outline"
          leftIcon={<Plus size={14} />}
          onClick={() => set("inTheBox", [...draft.inTheBox, { tr: "", en: "" }])}
        >
          Madde Ekle
        </Button>
      </div>
      <div className="space-y-2">
        {draft.inTheBox.map((item, i) => (
          <div key={i} className="flex gap-2">
            <Input
              placeholder="TR"
              value={item.tr}
              onChange={(e) => {
                const next = [...draft.inTheBox];
                next[i] = { ...next[i], tr: e.target.value };
                set("inTheBox", next);
              }}
            />
            <Input
              placeholder="EN"
              value={item.en}
              onChange={(e) => {
                const next = [...draft.inTheBox];
                next[i] = { ...next[i], en: e.target.value };
                set("inTheBox", next);
              }}
            />
            <button
              type="button"
              onClick={() => set("inTheBox", draft.inTheBox.filter((_, x) => x !== i))}
              className="shrink-0 px-2 text-zw-grey-400 hover:text-zw-red-600"
            >
              <Trash2 size={17} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
