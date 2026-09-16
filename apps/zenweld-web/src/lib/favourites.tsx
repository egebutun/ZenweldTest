"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "zenweld.favourites.v1";

/** Favori urunler — kullaniciya ozel degil, tarayiciya ozel (demo). */
export function useFavourites() {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setIds(JSON.parse(raw) as string[]);
    } catch {
      /* yok say */
    }
  }, []);

  const persist = useCallback((next: string[]) => {
    setIds(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* yok say */
    }
  }, []);

  const toggle = useCallback(
    (id: string) => {
      persist(ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]);
    },
    [ids, persist],
  );

  return { ids, toggle, has: (id: string) => ids.includes(id) };
}
