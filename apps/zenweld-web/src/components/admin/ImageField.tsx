"use client";

import { ImagePlus, X } from "lucide-react";
import { ProductImage } from "@zenweld/ui";
import { readImageFiles } from "@zenweld/utils";

/**
 * Tek gorsel alani: adres yapistirma veya dosya yukleme (yuklenen dosya
 * kucultulup tarayici deposuna yazilir), onizleme ve kaldirma.
 */
export function ImageField({
  value,
  onChange,
  onError,
  rounded = false,
}: {
  value?: string;
  onChange: (url: string | undefined) => void;
  onError: (message: string) => void;
  /** Yuvarlak onizleme (vesikalik fotograf icin) */
  rounded?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <div
        className={`flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden border border-zw-grey-200 bg-zw-grey-50 ${
          rounded ? "rounded-full" : "rounded-[4px]"
        }`}
      >
        {value ? (
          <ProductImage src={value} alt="" label="" className="h-full w-full object-cover" />
        ) : (
          <ImagePlus size={22} className="text-zw-grey-400" />
        )}
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        <input
          type="text"
          value={value?.startsWith("data:") ? "(yüklenen dosya)" : (value ?? "")}
          onChange={(e) => onChange(e.target.value.trim() || undefined)}
          placeholder="Görsel adresi (https://…) veya dosya yükleyin"
          className="w-full rounded-[4px] border border-zw-grey-300 px-3 py-2 text-sm"
        />
        <div className="flex gap-2">
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-[4px] border border-zw-grey-300 px-3 py-1.5 text-xs font-semibold hover:border-zw-ink">
            <ImagePlus size={14} />
            Dosya yükle
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                readImageFiles(e.target.files, (url) => onChange(url), onError);
                e.target.value = "";
              }}
            />
          </label>
          {value && (
            <button
              type="button"
              onClick={() => onChange(undefined)}
              className="inline-flex items-center gap-1 rounded-[4px] px-2 py-1.5 text-xs font-semibold text-zw-grey-600 hover:text-zw-red-600"
            >
              <X size={14} /> Kaldır
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
