"use client";

import { createEmptyDatabase, createSeedDatabase, DB_VERSION, type ZenweldDatabase } from "@zenweld/data";

/**
 * TARAYICIDAKI VERI KOPYASI
 *
 * Demo modunda backend yerine gecer: tum veri tarayicinin localStorage'inda
 * tutulur. Sunucu tarafinda (SSR) her zaman seed veritabani dondurulur,
 * boylece hydration tutarli kalir.
 *
 * Veri kaynagi veritabaniysa (DATA_SOURCE=database) butun kayitlar
 * sunucudan gelir (ServerDataProvider, uyelik ve form uclari). Kopya bos
 * baslar, tarayici deposuna yazilmaz ve ornek veri tarayici paketine girmez
 * (Asama 5.6): ayar derlemede next.config'te NEXT_PUBLIC_DATA_SOURCE olarak
 * pakete yazilir; derleyici ornek veriyi kullanan dali paketten atar.
 *
 * !! ONEMLI !! Tohum verisi veya sema her degistiginde DB_VERSION
 * artirilmalidir; kayitli surum tuttugu surece tohum hic kurulmaz.
 */

const STORAGE_KEY = "zenweld.db.v1";

/** Veri kaynagi veritabani mi (derlemede belirlenir). */
const SERVER_DATA = process.env.NEXT_PUBLIC_DATA_SOURCE === "database";

/** Baslangic verisi: demo modunda ornek veri, veritabani modunda bos. */
const initialDatabase = (now?: number): ZenweldDatabase => (SERVER_DATA ? createEmptyDatabase() : createSeedDatabase(now));

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

/**
 * Tarayicida miyiz ve tarayicinin deposu (localStorage) kullanilabilir mi?
 * Ziyaretci cerezleri/site verisini engellediyse (ornegin iPhone'da "Tum
 * Cerezleri Engelle") depoya erismek bile hata firlatir; o zaman site
 * cokmez, veri yalnizca bellekte tutulur (sayfa yenilenince ornek veriye
 * doner).
 */
function hasStorage(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return typeof window.localStorage !== "undefined";
  } catch {
    return false;
  }
}

function loadFromStorage(): ZenweldDatabase {
  if (!hasStorage()) return initialDatabase(BUILD_TIME.getTime());
  if (SERVER_DATA) {
    // Ayni adreste daha once calismis demo sitesinden kalan veri silinir.
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* depo kapali olabilir */
    }
    return initialDatabase();
  }

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

  const seed = initialDatabase();
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

/** Sunucu anlik goruntusu — demo modunda her zaman seed, veritabani modunda bos. */
export function getServerSnapshot(): ZenweldDatabase {
  // Sunucuda ve tarayicinin ilk ciziminde ayni tohum: tarihler derleme anina gore.
  if (!serverSnapshot) serverSnapshot = initialDatabase(BUILD_TIME.getTime());
  return serverSnapshot;
}

/**
 * Baska sekmede yapilan degisiklik (ornegin panelde "Odeme Alindi") bu
 * sekmenin bellekteki kopyasina alinir; yoksa bu sekmenin bir sonraki kaydi
 * butun veritabanini kendi eski kopyasiyla yazip o degisikligi silerdi.
 */
if (hasStorage() && !SERVER_DATA) {
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

/*
 * Son kayit yazilamadi mi (tarayici deposu dolu)? Yonetim paneli bunu tek
 * yerden kirmizi uyariyla gosterir ve "kaydedildi" mesajini gizler. Sonraki
 * basarili kayitta kendiliginden kalkar.
 */
let writeFailed = false;
const writeListeners = new Set<() => void>();

function setWriteFailed(value: boolean): void {
  if (writeFailed === value) return;
  writeFailed = value;
  writeListeners.forEach((l) => l());
}

export const getWriteFailed = () => writeFailed;

export function subscribeWriteFailed(listener: () => void): () => void {
  writeListeners.add(listener);
  return () => writeListeners.delete(listener);
}

/** Uyari kapatilinca (yeni bir deneme oncesi). */
export const dismissWriteFailed = () => setWriteFailed(false);

/**
 * Veritabanini degistirir, kaydeder ve abonelere haber verir. Tarayici
 * deposuna yazilamazsa (kota dolu) degisiklik uygulanmaz ve false doner;
 * boylece sayfa yenilenince kaybolacak bir kayit ekranda gorunmez.
 */
export function mutate(updater: (db: ZenweldDatabase) => ZenweldDatabase | void): boolean {
  const current = getSnapshot();
  const draft = structuredClone(current);
  const result = updater(draft) ?? draft;
  // Veritabani modunda kayitlar sunucuya yazilir; bu kopya depoya yazilmaz.
  if (hasStorage() && !SERVER_DATA) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
    } catch (err) {
      console.warn("[zenweld] localStorage yazilamadi (kota dolmus olabilir)", err);
      setWriteFailed(true);
      return false;
    }
  }
  memoryDb = result;
  setWriteFailed(false);
  emit();
  return true;
}

export { STORAGE_KEY };
