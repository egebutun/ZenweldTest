"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

const STORAGE_KEY = "zenweld.favourites.v1";

interface FavouritesValue {
  ids: string[];
  toggle: (id: string) => void;
  has: (id: string) => boolean;
}

const FavouritesContext = createContext<FavouritesValue | null>(null);

const parse = (raw: string | null): string[] => {
  try {
    const value: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(value) ? value.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
};

/**
 * Favori urunler — kullaniciya ozel degil, tarayiciya ozel (demo).
 *
 * Liste tek yerde tutulur: her kart kendi kopyasini tutsaydi, bir kartta
 * eklenen favori digerinin kaydiyla silinirdi. Baska sekmedeki degisiklik
 * de buraya alinir.
 */
export function FavouritesProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      setIds(parse(window.localStorage.getItem(STORAGE_KEY)));
    } catch {
      /* yok say */
    }
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY || event.key === null) setIds(parse(event.newValue));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const toggle = useCallback((id: string) => {
    setIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* yok say */
      }
      return next;
    });
  }, []);

  const value = useMemo<FavouritesValue>(() => ({ ids, toggle, has: (id) => ids.includes(id) }), [ids, toggle]);

  return <FavouritesContext.Provider value={value}>{children}</FavouritesContext.Provider>;
}

export function useFavourites(): FavouritesValue {
  const ctx = useContext(FavouritesContext);
  if (!ctx) throw new Error("useFavourites, FavouritesProvider içinde kullanılmalıdır.");
  return ctx;
}
