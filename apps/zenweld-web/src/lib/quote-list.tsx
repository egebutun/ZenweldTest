"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/**
 * "Teklif Listesi" — sepet DEGILDIR.
 *
 * Ana sitede dogrudan satis yapilmadigi icin kullanici urunleri sepete degil,
 * teklif listesine ekler; Teklif Al formu bu listeyle doldurulur.
 */

export interface QuoteLineItem {
  productId: string;
  productName: string;
  quantity: number;
}

interface QuoteListValue {
  items: QuoteLineItem[];
  add: (item: Omit<QuoteLineItem, "quantity">, quantity?: number) => void;
  remove: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
  count: number;
  has: (productId: string) => boolean;
}

const STORAGE_KEY = "zenweld.quotelist.v1";
const QuoteListContext = createContext<QuoteListValue | null>(null);

export function QuoteListProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<QuoteLineItem[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw) as QuoteLineItem[]);
    } catch {
      /* yok say */
    }
  }, []);

  const persist = useCallback((next: QuoteLineItem[]) => {
    setItems(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* yok say */
    }
  }, []);

  const add = useCallback<QuoteListValue["add"]>(
    (item, quantity = 1) => {
      setItems((prev) => {
        const existing = prev.find((i) => i.productId === item.productId);
        const next = existing
          ? prev.map((i) =>
              i.productId === item.productId
                ? { ...i, quantity: i.quantity + quantity }
                : i,
            )
          : [...prev, { ...item, quantity }];
        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          /* yok say */
        }
        return next;
      });
    },
    [],
  );

  const remove = useCallback(
    (productId: string) => {
      persist(items.filter((i) => i.productId !== productId));
    },
    [items, persist],
  );

  const setQuantity = useCallback(
    (productId: string, quantity: number) => {
      persist(
        items.map((i) =>
          i.productId === productId ? { ...i, quantity: Math.max(1, quantity) } : i,
        ),
      );
    },
    [items, persist],
  );

  const clear = useCallback(() => persist([]), [persist]);

  const value = useMemo<QuoteListValue>(
    () => ({
      items,
      add,
      remove,
      setQuantity,
      clear,
      count: items.reduce((sum, i) => sum + i.quantity, 0),
      has: (productId: string) => items.some((i) => i.productId === productId),
    }),
    [items, add, remove, setQuantity, clear],
  );

  return <QuoteListContext.Provider value={value}>{children}</QuoteListContext.Provider>;
}

export function useQuoteList(): QuoteListValue {
  const ctx = useContext(QuoteListContext);
  if (!ctx) throw new Error("useQuoteList, QuoteListProvider içinde kullanılmalıdır.");
  return ctx;
}
