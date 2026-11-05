"use client";

import { ImagePlus, X } from "lucide-react";
import { ProductImage } from "@zenweld/ui";
import { useUploads } from "@/lib/admin-files";

/**
 * Tek gorsel alani: adres yapistirma veya dosya yukleme (yuklenen dosya
 * kucultulur; demo modunda tarayici deposuna, veritabani modunda sunucunun
 * dosya deposuna yazilir; lib/admin-files.ts), onizleme ve kaldirma.
 * uploadNote verilirse dosya yukleme kapalidir ve not gosterilir
 * (veritabani modu, dosya deposu ayarli degil; KARARLAR K-101, K-108).
 */
export function ImageField({
  value,
  onChange,
  onError,
  rounded = false,
  uploadNote,
}: {
  value?: string;
  onChange: (url: string | undefined) => void;
  onError: (message: string) => void;
  /** Yuvarlak onizleme (vesikalik fotograf icin) */
  rounded?: boolean;
  uploadNote?: string;
}) {
  const uploads = useUploads();
  const uploaded = value?.startsWith("data:");
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
        {/* Yuklenen dosyanin adresi yazilarak degistirilemez: Kaldir ya da yeni dosya. */}
        <input
          type="text"
          readOnly={uploaded}
          value={uploaded ? "(yüklenen dosya)" : (value ?? "")}
          onChange={(e) => onChange(e.target.value.trim() || undefined)}
          placeholder={uploadNote ? "Görsel adresi (https://…)" : "Görsel adresi (https://…) veya dosya yükleyin"}
          className={`w-full rounded-[4px] border border-zw-grey-300 px-3 py-2 text-sm ${uploaded ? "bg-zw-grey-50 text-zw-grey-500" : ""}`}
        />
        {uploadNote && <p className="text-xs text-zw-grey-500">{uploadNote}</p>}
        <div className="flex gap-2">
          {!uploadNote && (
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-[4px] border border-zw-grey-300 px-3 py-1.5 text-xs font-semibold hover:border-zw-ink">
              <ImagePlus size={14} />
              Dosya yükle
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  uploads.readImages(e.target.files, (url) => onChange(url), onError);
                  e.target.value = "";
                }}
              />
            </label>
          )}
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
