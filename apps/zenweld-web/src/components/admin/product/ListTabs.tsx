"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button, Input } from "@zenweld/ui";
import type { ProductTabProps } from "./types";

/** Teknik Ozellikler sekmesi: ozellik–deger satirlari. */
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
              { label: "", value: "" },
            ])
          }
        >
          Satır Ekle
        </Button>
      </div>

      <div className="space-y-2">
        {draft.specs.map((row, i) => (
          <div key={i} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
            <Input
              placeholder="Özellik"
              value={row.label}
              onChange={(e) => {
                const next = [...draft.specs];
                next[i] = { ...next[i], label: e.target.value };
                set("specs", next);
              }}
            />
            <Input
              placeholder="Değer"
              value={row.value}
              onChange={(e) => {
                const next = [...draft.specs];
                next[i] = { ...next[i], value: e.target.value };
                set("specs", next);
              }}
            />
            <button
              type="button"
              onClick={() => set("specs", draft.specs.filter((_, x) => x !== i))}
              className="self-center px-2 text-zw-grey-400 hover:text-zw-red-600"
            >
              <Trash2 size={17} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Kutu Icerigi sekmesi: madde listesi. */
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
          onClick={() => set("inTheBox", [...draft.inTheBox, ""])}
        >
          Madde Ekle
        </Button>
      </div>
      <div className="space-y-2">
        {draft.inTheBox.map((item, i) => (
          <div key={i} className="flex gap-2">
            <Input
              value={item}
              onChange={(e) => {
                const next = [...draft.inTheBox];
                next[i] = e.target.value;
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
