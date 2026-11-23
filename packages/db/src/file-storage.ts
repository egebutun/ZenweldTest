import { createReadStream, createWriteStream } from "node:fs";
import { copyFile, mkdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { randomBytes } from "node:crypto";
import { dirname, resolve, sep } from "node:path";
import { isUploadKey } from "@zenweld/data";

/**
 * DOSYA DEPOSU — DEGISTIRILEBILIR PARCA (KARARLAR K-108; docs/SUNUCU.md
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
  /**
   * Buyuk dosyayi (video) bellege almadan yazar; maxBytes asilirsa yazilan
   * kisim silinir ve FileTooLargeError atilir. Yazilan bayt sayisini dondurur.
   */
  write(key: string, source: ReadableStream<Uint8Array>, maxBytes: number): Promise<number>;
  /**
   * Dosyayi (ya da bir bolumunu: start ve end dahil) akis olarak okur;
   * size butun dosyanin boyutudur. Dosya yoksa null.
   */
  read(key: string, range?: { start: number; end: number }): Promise<{ stream: ReadableStream<Uint8Array>; size: number } | null>;
  /** Depodaki dosyayi sunucudaki gecici bir yola kopyalar (video hazirlama). */
  toLocal(key: string, path: string): Promise<void>;
  /** Sunucudaki gecici dosyayi depoya yazar. */
  fromLocal(key: string, path: string): Promise<void>;
  /** Siler; yoksa bir sey yapmaz. */
  remove(key: string): Promise<void>;
}

/** Yazilan dosya sinirdan buyuk. */
export class FileTooLargeError extends Error {
  constructor() {
    super("Dosya çok büyük.");
  }
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
    write: async (key, source, maxBytes) => {
      const full = path(key);
      await mkdir(dirname(full), { recursive: true });
      const temp = `${full}.${randomBytes(4).toString("hex")}.yukleniyor`;
      let total = 0;
      const limit = new Transform({
        transform(chunk: Buffer, _encoding, done) {
          total += chunk.length;
          done(total > maxBytes ? new FileTooLargeError() : null, chunk);
        },
      });
      try {
        await pipeline(Readable.fromWeb(source as import("node:stream/web").ReadableStream<Uint8Array>), limit, createWriteStream(temp, { flags: "wx" }));
      } catch (error) {
        await rm(temp, { force: true });
        throw error;
      }
      await rename(temp, full);
      return total;
    },
    read: async (key, range) => {
      let size: number;
      try {
        size = (await stat(path(key))).size;
      } catch (error) {
        if (missing(error)) return null;
        throw error;
      }
      const stream = createReadStream(path(key), range ? { start: range.start, end: range.end } : undefined);
      return { stream: Readable.toWeb(stream) as unknown as ReadableStream<Uint8Array>, size };
    },
    toLocal: async (key, target) => {
      await copyFile(path(key), target);
    },
    fromLocal: async (key, source) => {
      const full = path(key);
      await mkdir(dirname(full), { recursive: true });
      const temp = `${full}.${randomBytes(4).toString("hex")}.yukleniyor`;
      await copyFile(source, temp);
      await rename(temp, full);
    },
    remove: async (key) => {
      await rm(path(key), { force: true });
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
