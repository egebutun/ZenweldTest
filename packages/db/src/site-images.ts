import { createHash } from "node:crypto";
import type { ZenweldDatabase } from "@zenweld/data";
// Dogrudan kendi dosyasindan (file-storage.ts'teki nota bakin).
import { detectFileType, UPLOAD_RULES, uploadAddress, uploadKey } from "@zenweld/data/src/file-rules";
import type { FileStorage } from "./file-storage";

/**
 * ICERIK GORSELLERI DOSYA DEPOSUNA (npm run db:yukle; KARARLAR K-91, K-108)
 *
 * Ornek verideki urun, haber, etkinlik ve anasayfa tanitim gorselleri
 * sitenin kendi dosyalarindadir (apps/zenweld-web/public/images/…). Canlida
 * bunlar da panelden yuklenenler gibi dosya deposunda durmali: yukleme
 * komutu once bu dosyalari depoya kopyalar, kayitlara depo adresini
 * (/dosya/gorsel/…) yazar, sonra veriyi yukler.
 *
 * Sitenin parcasi olarak kalanlar (tasarim): logo ve marka gorselleri
 * (/images/brand), kategori ve grup cizimleri (/images/categories; gercek
 * fotografi olmayan urunlerin yer tutucusu da bunlar) ve Force sayfasi
 * gorselleri (/images/force).
 *
 * Tekrar calistirilabilir: anahtar dosyanin icerigindendir (SHA-256'nin ilk
 * 16 hanesi; klasor her zaman ayni ay), depoda olan dosya yeniden yazilmaz
 * ve ayni gorsel her yuklemede ayni adresi alir.
 */

/** Depoya tasinan icerik gorsellerinin sitedeki klasorleri. */
export const CONTENT_IMAGE_FOLDERS = ["/images/products/", "/images/news/", "/images/events/", "/images/hero/", "/images/home/"] as const;

export const isContentImage = (url: string) => CONTENT_IMAGE_FOLDERS.some((folder) => url.startsWith(folder));

/** Sitenin dosyalarindan gelen gorsellerin depodaki klasoru (anahtar her yuklemede ayni kalsin). */
const SITE_IMAGES_MONTH = new Date("2026-11-01T00:00:00Z");

export interface StoredImages {
  data: ZenweldDatabase;
  /** Depoya yeni yazilan dosya */
  copied: number;
  /** Depoda zaten olan dosya */
  existing: number;
}

/**
 * Verideki icerik gorsellerini depoya kopyalar ve adreslerini degistirir.
 * Veriyi degistirmez; adresleri degismis kopyasini dondurur.
 * readSiteFile: sitenin dosyasini (/images/…) okur; dosya yoksa hata atar.
 */
export async function storeSiteImages(
  data: ZenweldDatabase,
  storage: FileStorage,
  readSiteFile: (path: string) => Promise<Uint8Array>,
): Promise<StoredImages> {
  const addresses = new Map<string, string>();
  let copied = 0;
  let existing = 0;

  // Once butun adresler toplanir; her dosya bir kez kopyalanir.
  const urls = new Set<string>();
  const collect = (value: unknown): void => {
    if (typeof value === "string") {
      if (isContentImage(value)) urls.add(value);
    } else if (Array.isArray(value)) value.forEach(collect);
    else if (value && typeof value === "object") Object.values(value).forEach(collect);
  };
  collect(data);

  for (const url of [...urls].sort()) {
    const path = url.split(/[?#]/)[0];
    if (path.includes("..")) throw new Error(`Görsel depoya kopyalanamaz (yol uygun değil): ${url}`);
    const bytes = await readSiteFile(path);
    // Tur dosyanin icerigine gore (panelden yuklemedeki gibi).
    const ext = detectFileType(bytes, path);
    if (!ext || !UPLOAD_RULES.gorsel.extensions.includes(ext)) {
      throw new Error(`Görsel depoya kopyalanamaz (görsel türü değil: ${UPLOAD_RULES.gorsel.label}): ${url}`);
    }
    const hash = createHash("sha256").update(bytes).digest("hex").slice(0, 16);
    const key = uploadKey("gorsel", SITE_IMAGES_MONTH, hash, path, ext);
    if ((await storage.size(key)) === null) {
      await storage.put(key, bytes);
      copied++;
    } else existing++;
    addresses.set(url, uploadAddress(key));
  }

  const replace = (value: unknown): unknown => {
    if (typeof value === "string") return addresses.get(value) ?? value;
    if (Array.isArray(value)) return value.map(replace);
    if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, replace(v)]));
    return value;
  };
  return { data: replace(data) as ZenweldDatabase, copied, existing };
}
