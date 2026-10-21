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

/**
 * Derleme ani. next.config icinde NEXT_PUBLIC_BUILD_TIME olarak tanimlanir
 * ve sunucu ile tarayici paketine AYNI deger olarak gomulur.
 */
export const BUILD_TIME = (() => {
  const parsed = new Date(process.env.NEXT_PUBLIC_BUILD_TIME ?? "");
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
})();

let memoryDb: ZenweldDatabase | null = null;
let serverSnapshot: ZenweldDatabase | null = null;

const listeners = new Set<() => void>();

/** Yeni kayitlar icin benzersiz kimlik: "n-lx3k9a2b7f" gibi. */
export const uid = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function loadFromStorage(): ZenweldDatabase {
  if (!isBrowser()) return createSeedDatabase(BUILD_TIME.getTime());

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ZenweldDatabase;
      // Surum tuttuguna gore kayit bu derlemenin tohumundan yazilmis
      // demektir; tohumu bastan kurmaya gerek yok.
      if (parsed && parsed.version === DB_VERSION) return parsed;
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
  // Sunucuda ve tarayicinin ilk ciziminde ayni tohum: tarihler derleme anina gore.
  if (!serverSnapshot) serverSnapshot = createSeedDatabase(BUILD_TIME.getTime());
  return serverSnapshot;
}

/**
 * Baska sekmede yapilan degisiklik (ornegin panelde "Odeme Alindi") bu
 * sekmenin bellekteki kopyasina alinir; yoksa bu sekmenin bir sonraki kaydi
 * butun veritabanini kendi eski kopyasiyla yazip o degisikligi silerdi.
 */
if (isBrowser()) {
  window.addEventListener("storage", (event) => {
    if (event.key !== STORAGE_KEY && event.key !== null) return;
    memoryDb = null; // bir sonraki okuma depodan yapilir
    emit();
  });
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emit(): void {
  listeners.forEach((l) => l());
}

/**
 * Veritabanini degistirir, kaydeder ve abonelere haber verir. Tarayici
 * deposuna yazilamazsa (kota dolu) degisiklik uygulanmaz ve false doner;
 * boylece sayfa yenilenince kaybolacak bir kayit ekranda gorunmez.
 */
export function mutate(updater: (db: ZenweldDatabase) => ZenweldDatabase | void): boolean {
  const current = getSnapshot();
  const draft = structuredClone(current);
  const result = updater(draft) ?? draft;
  if (isBrowser()) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
    } catch (err) {
      console.warn("[zenweld] localStorage yazilamadi (kota dolmus olabilir)", err);
      return false;
    }
  }
  memoryDb = result;
  emit();
  return true;
}

export { STORAGE_KEY };
