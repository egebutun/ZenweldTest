import { fileStorageFromEnv, type FileStorage } from "@zenweld/db";
import { usesDatabase } from "./db";

/**
 * SUNUCUNUN DOSYA DEPOSU (yalnizca sunucu; KARARLAR K-108)
 *
 * Panelde yuklenen gorsel ve belgelerin yazildigi depo. Yalnizca
 * veritabani modunda ve depo ayarliysa (DOSYA_KLASORU) vardir; yoksa null:
 * panelde dosya yukleme kapali kalir, adres girilir (K-101, K-104).
 * Depo parcasi: packages/db/src/file-storage.ts.
 */
let storage: FileStorage | null | undefined;

export function fileStorage(): FileStorage | null {
  if (!usesDatabase()) return null;
  storage ??= fileStorageFromEnv();
  return storage;
}
