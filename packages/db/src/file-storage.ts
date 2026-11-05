import { mkdir, readFile, rename, stat, writeFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { dirname, resolve, sep } from "node:path";
import { isUploadKey } from "@zenweld/data";

/**
 * DOSYA DEPOSU — DEGISTIRILEBILIR PARCA (KARARLAR K-108; docs/ENTEGRASYONLAR.md
 * › Dosya deposu)
 *
 * Panelde yuklenen gorsel ve belgeler buradaki "dosya deposu" parcasina
 * yazilir ve sitenin /dosya/<anahtar> adresinden sunulur. Hangi deponun
 * kullanilacagini sunucunun ayari secer (fileStorageFromEnv).
 *
 * Bugun tek depo vardir: sunucunun diski (DOSYA_KLASORU). BT baska bir depo
 * secerse (S3 uyumlu nesne deposu, ag diski) ayni arayuzle yeni bir parca
 * eklenir; panel, yukleme ve sunma degismez. Deponun anahtar ve sifreleri
 * yalnizca sunucuda ortam degiskenidir.
 *
 * Anahtarlar depoya yazilmadan once denetlenir (isUploadKey): baska bir
 * klasore cikan ya da bilinmeyen turde anahtar okunmaz ve yazilmaz.
 */
export interface FileStorage {
  /** Kayitlarda gorunen ad: "disk", "s3"... */
  id: string;
  put(key: string, bytes: Uint8Array): Promise<void>;
  /** Dosya yoksa null. */
  get(key: string): Promise<Uint8Array | null>;
  /** Boyut (bayt); dosya yoksa null. */
  size(key: string): Promise<number | null>;
}

const missing = (error: unknown) => (error as NodeJS.ErrnoException).code === "ENOENT";

/** Sunucunun diski: anahtar klasorun altindaki yoldur ("gorsel/2026/11/…webp"). */
export function diskStorage(root: string): FileStorage {
  const base = resolve(root);
  const path = (key: string) => {
    if (!isUploadKey(key)) throw new Error(`Geçersiz dosya anahtarı: ${key}`);
    const full = resolve(base, key);
    if (!full.startsWith(base + sep)) throw new Error(`Geçersiz dosya anahtarı: ${key}`);
    return full;
  };
  return {
    id: "disk",
    put: async (key, bytes) => {
      const full = path(key);
      await mkdir(dirname(full), { recursive: true });
      // Once gecici dosyaya yazilir, sonra yerine konur: yarim dosya sunulmaz.
      const temp = `${full}.${randomBytes(4).toString("hex")}.yukleniyor`;
      await writeFile(temp, bytes, { flag: "wx" });
      await rename(temp, full);
    },
    get: async (key) => {
      try {
        return new Uint8Array(await readFile(path(key)));
      } catch (error) {
        if (missing(error)) return null;
        throw error;
      }
    },
    size: async (key) => {
      try {
        return (await stat(path(key))).size;
      } catch (error) {
        if (missing(error)) return null;
        throw error;
      }
    },
  };
}

/**
 * Ortam degiskenlerinden dosya deposu; tanimli degilse null (panelde dosya
 * yukleme kapali kalir, adres girilir).
 * - DOSYA_KLASORU: sunucunun diskindeki klasor; goreli yol sitenin
 *   klasorune (apps/zenweld-web) gore.
 * BT baska bir depo secerse onun ayarlari burada once denenir.
 */
export function fileStorageFromEnv(env: Record<string, string | undefined> = process.env): FileStorage | null {
  if (env.DOSYA_KLASORU) return diskStorage(env.DOSYA_KLASORU);
  return null;
}
