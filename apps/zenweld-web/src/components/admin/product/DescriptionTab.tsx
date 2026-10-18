"use client";

import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { Button, FormRow, Input, Textarea } from "@zenweld/ui";
import type { ProductTabProps } from "./types";

/** Aciklamalar sekmesi: kisa ve detayli aciklama, one cikan ozellikler. */
export function DescriptionTab({ draft, set }: ProductTabProps) {
  return (
    <div className="space-y-5 rounded-[4px] border border-zw-grey-200 bg-white p-5">
      <FormRow label="Kısa Açıklama">
        <Textarea
          className="min-h-20"
          value={draft.shortDescription}
          onChange={(e) => set("shortDescription", e.target.value)}
        />
      </FormRow>
      <FormRow label="Detaylı Açıklama">
        <Textarea
          className="min-h-40"
          value={draft.description}
          onChange={(e) => set("description", e.target.value)}
        />
      </FormRow>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wide text-zw-grey-600">
              Öne Çıkan Özellikler
            </span>
            <p className="mt-0.5 text-xs text-zw-grey-500">
              İlk 3 tanesi menüdeki ürün kartında madde madde görünür. Sırayı
              oklarla değiştirebilirsiniz.
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            leftIcon={<Plus size={14} />}
            onClick={() =>
              set("highlights", [...draft.highlights, ""])
            }
          >
            Ekle
          </Button>
        </div>
        <div className="space-y-2">
          {draft.highlights.map((h, i) => {
            const onMenu = i < 3;
            const move = (to: number) => {
              if (to < 0 || to >= draft.highlights.length) return;
              const next = [...draft.highlights];
              [next[i], next[to]] = [next[to], next[i]];
              set("highlights", next);
            };
            return (
              <div
                key={i}
                className={`flex items-center gap-2 rounded-[4px] p-2 ${
                  onMenu ? "bg-zw-red-50" : "bg-zw-grey-50"
                }`}
              >
                <span
                  title={onMenu ? "Menüde görünür" : "Yalnızca ürün sayfasında"}
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    onMenu ? "bg-zw-red-600 text-white" : "bg-zw-grey-300 text-zw-grey-700"
                  }`}
                >
                  {i + 1}
                </span>
                <Input
                  value={h}
                  onChange={(e) => {
                    const next = [...draft.highlights];
                    next[i] = e.target.value;
                    set("highlights", next);
                  }}
                />
                <div className="flex shrink-0 flex-col">
                  <button
                    type="button"
                    title="Yukarı taşı"
                    disabled={i === 0}
                    onClick={() => move(i - 1)}
                    className="px-1 text-zw-grey-400 hover:text-zw-ink disabled:opacity-30"
                  >
                    <ChevronUp size={15} />
                  </button>
                  <button
                    type="button"
                    title="Aşağı taşı"
                    disabled={i === draft.highlights.length - 1}
                    onClick={() => move(i + 1)}
                    className="px-1 text-zw-grey-400 hover:text-zw-ink disabled:opacity-30"
                  >
                    <ChevronDown size={15} />
                  </button>
                </div>
                <button
                  type="button"
                  title="Sil"
                  onClick={() => set("highlights", draft.highlights.filter((_, x) => x !== i))}
                  className="shrink-0 px-2 text-zw-grey-400 hover:text-zw-red-600"
                >
                  <Trash2 size={17} />
                </button>
              </div>
            );
          })}
          {draft.highlights.length === 0 && (
            <p className="py-3 text-sm text-zw-grey-500">
              Henüz özellik eklenmedi. Özellik yoksa menüdeki kartta kısa açıklama
              gösterilir.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
