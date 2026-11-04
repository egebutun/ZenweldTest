"use client";

import { useMemo, useSyncExternalStore } from "react";
import type { ZenweldDatabase } from "@zenweld/data";
import { useServerCatalog } from "./catalog";
import { BUILD_TIME, getServerSnapshot, getSnapshot, getWriteFailed, subscribe, subscribeWriteFailed } from "./database";

/**
 * Canli veritabani. Admin panelde yapilan degisiklikler aninda yansir.
 * Veri kaynagi veritabaniysa katalog (urunler, kategoriler, secenekler,
 * depo stogu, ayarlar) sunucudan gelir (CatalogProvider); gerisi
 * tarayicidaki kopyadan okunur.
 */
export function useDatabase(): ZenweldDatabase {
  const local = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const catalog = useServerCatalog();
  return useMemo(() => (catalog ? { ...local, ...catalog } : local), [local, catalog]);
}

/** Son kayit tarayici deposuna yazilamadiysa true (yonetim paneli uyarisi). */
export function useWriteFailed(): boolean {
  return useSyncExternalStore(subscribeWriteFailed, getWriteFailed, () => false);
}

/* ------------------------------------------------------------------ */
/* Saat — kampanya tarihleri icin                                      */
/* ------------------------------------------------------------------ */

/** Saat bir dakikada bir ilerler; kampanya acik sayfada da zamaninda biter. */
const TICK_MS = 60_000;

let clientNow: Date | null = null;
const clockListeners = new Set<() => void>();
let clockTimer: ReturnType<typeof setInterval> | null = null;

function subscribeClock(listener: () => void): () => void {
  clockListeners.add(listener);
  if (!clockTimer) {
    // Saat bir sure durmus olabilir (dinleyen kalmamisti); hemen guncellenir.
    clientNow = new Date();
    clockTimer = setInterval(() => {
      clientNow = new Date();
      clockListeners.forEach((l) => l());
    }, TICK_MS);
  }
  return () => {
    clockListeners.delete(listener);
    if (clockListeners.size === 0 && clockTimer) {
      clearInterval(clockTimer);
      clockTimer = null;
    }
  };
}

function getClientNow(): Date {
  if (!clientNow) clientNow = new Date();
  return clientNow;
}

/**
 * FIYAT HESABINDA KULLANILACAK "SIMDI"
 *
 * Sayfalar onceden (derleme aninda) HTML olarak uretilir. Kampanya
 * tarihleri fiyati zamana bagli yaptigi icin, sunucu ciktisi ile
 * tarayicinin ilk cizimi farkli ana gore hesaplanirsa React "hydration"
 * hatasi verir. Bu yuzden:
 *
 *   - sunucuda ve tarayicinin ILK ciziminde derleme ani kullanilir,
 *   - hemen ardindan tarayicinin gercek saatine gecilir.
 *
 * Sonuc: kampanya yeniden derleme gerektirmeden tam zamaninda baslar
 * ve biter, konsolda hata olusmaz.
 */
export function useNow(): Date {
  return useSyncExternalStore(subscribeClock, getClientNow, () => BUILD_TIME);
}
