"use client";

import { useState } from "react";
import { GripVertical, ImagePlus, Trash2, Upload } from "lucide-react";
import { Alert, Badge, Button, Input, ProductImage } from "@zenweld/ui";
import { readImageFiles } from "@zenweld/utils";
import type { ProductTabProps } from "./types";

/** Gorseller sekmesi: URL veya dosya ile ekleme, siralama, silme. Ilk gorsel kapaktir. */
export function ImagesTab({ draft, set, setDraft, onError }: ProductTabProps & { onError: (message: string) => void }) {
  const [imageUrlInput, setImageUrlInput] = useState("");

  // readImageFiles gorseli tarayicida otomatik kucultup WebP'ye cevirir.
  const onFileUpload = (files: FileList | null) => {
    readImageFiles(
      files,
      (url) =>
        setDraft((d) => ({
          ...d,
          images: [...d.images, { url, alt: { tr: d.name, en: d.name } }],
        })),
      onError,
    );
  };

  return (
    <div className="space-y-5 rounded-[4px] border border-zw-grey-200 bg-white p-5">
      <Alert tone="info">
        Görsel URL&apos;si girebilir veya dosya yükleyebilirsiniz. Yüklenen dosyalar
        otomatik olarak küçültülüp WebP'ye çevrilir; boyutla uğraşmanıza gerek yok. İlk görsel kapak görselidir.
      </Alert>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          placeholder="https://images.unsplash.com/…"
          value={imageUrlInput}
          onChange={(e) => setImageUrlInput(e.target.value)}
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          leftIcon={<ImagePlus size={16} />}
          onClick={() => {
            if (!imageUrlInput.trim()) return;
            set("images", [
              ...draft.images,
              { url: imageUrlInput.trim(), alt: { tr: draft.name, en: draft.name } },
            ]);
            setImageUrlInput("");
          }}
        >
          URL Ekle
        </Button>
        <label className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-[4px] border border-zw-grey-300 px-4 text-sm font-semibold hover:border-zw-ink">
          <Upload size={16} />
          Dosya Yükle
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              onFileUpload(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {draft.images.map((img, i) => (
          <div key={i} className="rounded-[4px] border border-zw-grey-200 p-2">
            <div className="relative aspect-square overflow-hidden rounded-[3px] bg-zw-grey-50">
              <ProductImage
                src={img.url}
                alt={img.alt.tr}
                label={draft.name}
                className="h-full w-full object-contain p-1"
              />
              {i === 0 && (
                <Badge tone="red" className="absolute left-1.5 top-1.5">
                  Kapak
                </Badge>
              )}
            </div>
            <div className="mt-2 flex gap-1">
              <button
                type="button"
                disabled={i === 0}
                onClick={() => {
                  const next = [...draft.images];
                  [next[i - 1], next[i]] = [next[i], next[i - 1]];
                  set("images", next);
                }}
                className="flex-1 rounded-[3px] border border-zw-grey-300 py-1 text-xs disabled:opacity-40"
              >
                <GripVertical size={13} className="mx-auto" />
              </button>
              <button
                type="button"
                onClick={() => set("images", draft.images.filter((_, x) => x !== i))}
                className="flex-1 rounded-[3px] border border-zw-grey-300 py-1 text-xs text-zw-red-600 hover:border-zw-red-600"
              >
                <Trash2 size={13} className="mx-auto" />
              </button>
            </div>
          </div>
        ))}
        {draft.images.length === 0 && (
          <p className="col-span-full py-6 text-center text-sm text-zw-grey-500">
            Henüz görsel eklenmedi. Görsel yoksa markalı Zenweld placeholder gösterilir.
          </p>
        )}
      </div>
    </div>
  );
}
