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
import { productVariantGroup } from "@zenweld/data";
import { useDatabase } from "@zenweld/store";
import { resolveVariant, variantLabel } from "./variants";

/**
 * "Teklif Listesi" — alisveris sepetinden (lib/cart.tsx) ayridir.
 *
 * Vadeli odeme veya cekle almak isteyen kurumsal musteri urunleri Teklif Al
 * sayfasinda bu listeye ekler; satis ekibi teklifi ayrica hazirlar.
 *
 * Liste tarayicida saklanir. Icindeki bir urun sonradan yayindan
 * kaldirilirsa listede gorunmez ve teklife eklenmez. Secenekli urunde
 * secenek de saklanir; ayni urunun farkli secenekleri ayri satirdir.
 * Secenegi artik bulunmayan satir da (sepetteki gibi) gorunmez.
 */

export interface QuoteLineItem {
  productId: string;
  /** Secenekli urunde secilen secenek (deger kimligi) */
  variantId?: string;
  productName: string;
  quantity: number;
}

/** Listedeki satir: kayitli bilgiler ve urunden okunan kod ve secenek adi. */
export interface QuoteListLine extends QuoteLineItem {
  key: string;
  sku: string;
  /** "Hortum Uzunluğu: 5 m" */
  variantLabel?: string;
}

const lineKey = (i: { productId: string; variantId?: string }) => `${i.productId}|${i.variantId ?? ""}`;

interface QuoteListValue {
  items: QuoteListLine[];
  add: (item: Omit<QuoteLineItem, "quantity">, quantity?: number) => void;
  remove: (key: string) => void;
  setQuantity: (key: string, quantity: number) => void;
  clear: () => void;
  count: number;
  has: (productId: string) => boolean;
}

const STORAGE_KEY = "zenweld.quotelist.v1";
const QuoteListContext = createContext<QuoteListValue | null>(null);

export function QuoteListProvider({ children }: { children: ReactNode }) {
  const db = useDatabase();
  const [stored, setItems] = useState<QuoteLineItem[]>([]);
  const items = useMemo(
    () =>
      stored.flatMap((i): QuoteListLine[] => {
        const product = db.products.find((p) => p.id === i.productId && p.active);
        if (!product) return [];
        const group = productVariantGroup(product, db.optionDefinitions);
        if (group && !group.options.some((o) => o.id === i.variantId)) return [];
        const selection = group && i.variantId ? { [group.id]: i.variantId } : {};
        return [
          {
            ...i,
            key: lineKey(i),
            sku: resolveVariant(product, group, selection).sku,
            variantLabel: variantLabel(group, selection),
          },
        ];
      }),
    [stored, db],
  );

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
        const key = lineKey(item);
        const existing = prev.find((i) => lineKey(i) === key);
        const next = existing
          ? prev.map((i) =>
              lineKey(i) === key
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
    (key: string) => {
      persist(stored.filter((i) => lineKey(i) !== key));
    },
    [stored, persist],
  );

  const setQuantity = useCallback(
    (key: string, quantity: number) => {
      persist(
        stored.map((i) =>
          lineKey(i) === key ? { ...i, quantity: Math.max(1, quantity) } : i,
        ),
      );
    },
    [stored, persist],
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
