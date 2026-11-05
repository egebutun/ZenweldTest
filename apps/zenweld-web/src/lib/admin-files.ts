"use client";

import { useAuth } from "@zenweld/auth";
import type { UploadKind } from "@zenweld/data";
import { tr } from "@zenweld/i18n";
import { readImageFiles } from "@zenweld/utils";
import { usePanelFeatures } from "@/components/admin/PanelFeatures";

/**
 * PANELDE DOSYA YUKLEME (KARARLAR K-101, K-104, K-108)
 *
 * Demo modunda gorsel tarayicida kucultulup tarayici deposuna yazilir
 * (data: adresi); belge tarayicida tutulur.
 *
 * Veritabani modunda:
 * - Dosya deposu ayarliysa gorsel yine tarayicida kucultulur, sonra
 *   sunucuya yuklenir (/api/yonetim/dosya) ve kayda sitedeki adresi
 *   (/dosya/…) yazilir. Belge de ayni yolla yuklenir.
 * - Depo ayarli degilse yukleme kapalidir; adres girilir (imageNote).
 */

export type UploadAnswer = { ok: true; address: string; fileName: string; size: number } | { ok: false; error: string };

/** Dosyayi sunucunun deposuna yukler. */
export async function uploadFile(kind: UploadKind, file: Blob, name: string): Promise<UploadAnswer> {
  const form = new FormData();
  form.append("dosya", file, name);
  try {
    const response = await fetch(`/api/yonetim/dosya?tur=${kind}`, { method: "POST", body: form });
    const answer = (await response.json().catch(() => null)) as UploadAnswer | null;
    return answer && typeof answer.ok === "boolean" ? answer : { ok: false, error: tr.panel.failed };
  } catch {
    return { ok: false, error: tr.panel.failed };
  }
}

/** data: adresindeki dosya (tarayicida kucultulmus gorsel). */
function dataUrlFile(dataUrl: string): { blob: Blob; name: string } {
  const [head, data = ""] = dataUrl.split(",", 2);
  const mime = /^data:([^;,]+)/.exec(head)?.[1] ?? "application/octet-stream";
  const text = head.endsWith(";base64") ? atob(data) : decodeURIComponent(data);
  const bytes = Uint8Array.from(text, (c) => c.charCodeAt(0));
  return { blob: new Blob([bytes], { type: mime }), name: `gorsel.${mime.split("/")[1]?.replace("jpeg", "jpg") ?? "bin"}` };
}

export function useUploads() {
  const { api } = useAuth();
  const { uploads } = usePanelFeatures();
  const server = api !== null;

  return {
    /** Veritabani modunda depo ayarli degilse gorsel alanlarinin notu (yukleme kapali). */
    imageNote: server && !uploads ? tr.panel.uploadDisabled : undefined,
    /** Belge dosyasi secilebilir mi (demo modu ya da depo ayarli). */
    documentFiles: !server || uploads,
    /** Belgeyi depoya yukler (yalnizca veritabani modunda). */
    uploadDocument: (file: File) => uploadFile("belge", file, file.name),

    /**
     * Secilen gorseller: tarayicida kucultulur; veritabani modunda sirayla
     * yuklenir ve onImage'e sitedeki adres gelir (secilme sirasi korunur).
     */
    readImages: (
      files: FileList | null,
      onImage: (url: string) => void,
      onError: (message: string) => void,
      options?: { trimEdges?: boolean },
    ) => {
      if (!server) return readImageFiles(files, onImage, onError, options);
      let queue = Promise.resolve();
      readImageFiles(
        files,
        (dataUrl) => {
          queue = queue.then(async () => {
            const { blob, name } = dataUrlFile(dataUrl);
            const answer = await uploadFile("gorsel", blob, name);
            if (answer.ok) onImage(answer.address);
            else onError(answer.error);
          });
        },
        onError,
        options,
      );
    },
  };
}
