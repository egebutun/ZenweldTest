"use client";

import { createSeedDatabase, DB_VERSION, type ZenweldDatabase } from "@zenweld/data";

/**
 * Backend yerine gecen veri katmani.
 *
 * Tum veri tarayicinin localStorage'inda tutulur. Sunucu tarafinda (SSR)
 * her zaman seed veritabani dondurulur, boylece hydration tutarli kalir.
 *
 * ILERIDE: adapter'i Supabase/Firebase ile degistirmek icin yalnizca
 * read()/write() fonksiyonlarini degistirmek yeterlidir.
 *
 * !! ONEMLI !! Tohum verisi veya sema her degistiginde DB_VERSION
 * artirilmalidir; kayitli surum tuttugu surece tohum hic kurulmaz.
 */

const STORAGE_KEY = "zenweld.db.v1";

let memoryDb: ZenweldDatabase | null = null;
let serverSnapshot: ZenweldDatabase | null = null;

const listeners = new Set<() => void>();

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function loadFromStorage(): ZenweldDatabase {
  if (!isBrowser()) return createSeedDatabase();

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ZenweldDatabase;
      if (parsed && parsed.version === DB_VERSION) {
        // Surum tuttuguna gore kayit bu derlemenin tohumundan yazilmis
        // demektir; 500 KB'lik tohumu bastan kurmaya gerek yok.
        return parsed;
      }
    }
  } catch {
    /* bozuk kayit — tohumla bastan kur */
  }

  const seed = createSeedDatabase();
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
  } catch {
    /* kota dolu olabilir; bellekte calismaya devam */
  }
  return seed;
}

/** Istemci anlik goruntusu (useSyncExternalStore icin sabit referans). */
export function getSnapshot(): ZenweldDatabase {
  if (!memoryDb) memoryDb = loadFromStorage();
  return memoryDb;
}

/** Sunucu anlik goruntusu — her zaman seed. */
export function getServerSnapshot(): ZenweldDatabase {
  if (!serverSnapshot) serverSnapshot = createSeedDatabase();
  return serverSnapshot;
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emit(): void {
  listeners.forEach((l) => l());
}

/** Veritabanini degistirir, kaydeder ve abonelere haber verir. */
export function mutate(updater: (db: ZenweldDatabase) => ZenweldDatabase | void): void {
  const current = getSnapshot();
  const draft: ZenweldDatabase = JSON.parse(JSON.stringify(current));
  const result = updater(draft) ?? draft;
  memoryDb = result;
  if (isBrowser()) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
    } catch (err) {
      console.warn("[zenweld] localStorage yazilamadi (kota dolmus olabilir)", err);
    }
  }
  emit();
}

/** Tum veriyi seed haline dondurur. */
export function resetDatabase(): void {
  memoryDb = createSeedDatabase();
  if (isBrowser()) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryDb));
  }
  emit();
}

/** Disaridan gelen tam veritabanini yukler (JSON ice aktarma). */
export function replaceDatabase(db: ZenweldDatabase): void {
  memoryDb = db;
  if (isBrowser()) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  }
  emit();
}

export { STORAGE_KEY };
