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
import { cartTotals, salePriceExVat, type CartTotals, type Product } from "@zenweld/data";
import { getShopSettings, useDatabase, useNow } from "@zenweld/store";
import { priceWithVat } from "@zenweld/utils";
import { completeSelection, resolveVariant, variantLabel, type VariantSelection } from "./variants";

/**
 * ALISVERIS SEPETI
 *
 * Sepette yalnizca urun, secenek ve adet saklanir; fiyat her zaman o anki
 * urun kaydindan (kampanya dahil) hesaplanir. Boylece yonetim panelinde
 * fiyat degisirse sepet de guncel fiyati gosterir. Yayindan kaldirilan
 * urun sepette gorunmez.
 *
 * Sepet tarayicida saklanir; uye girisi yalnizca odeme adiminda istenir.
 */

interface StoredLine {
  productId: string;
  selection: VariantSelection;
  quantity: number;
}

export interface CartLine {
  /** urun + secenekler; ayni urunun farkli secenekleri ayri satirdir */
  key: string;
  product: Product;
  selection: VariantSelection;
  variantLabel?: string;
  sku: string;
  quantity: number;
  unitExVat: number;
  unitIncVat: number;
  totalExVat: number;
  totalIncVat: number;
}

interface CartValue {
  /** Sepet tarayicidan okundu mu (once bos gorunup sonra dolmasin diye) */
  ready: boolean;
  lines: CartLine[];
  /** Toplam urun adedi (baslikta gosterilir) */
  count: number;
  totals: CartTotals;
  add: (productId: string, selection: VariantSelection, quantity?: number) => void;
  setQuantity: (key: string, quantity: number) => void;
  remove: (key: string) => void;
  clear: () => void;
}

const STORAGE_KEY = "zenweld.cart.v1";
export const MAX_LINE_QUANTITY = 99;

const lineKey = (productId: string, selection: VariantSelection) =>
  [productId, ...Object.keys(selection).sort().map((g) => `${g}=${selection[g]}`)].join("|");

/** Adet her zaman 1-99 arasinda tam sayi; 0, eksi veya kesirli adet sepete girmez. */
const clampQuantity = (quantity: number) =>
  Math.max(1, Math.min(MAX_LINE_QUANTITY, Math.floor(Number(quantity)) || 1));

/** Depodaki sepet: bicimi bozuk satirlar atilir, adetler duzeltilir. */
function parseStored(raw: string | null): StoredLine[] {
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    return value.flatMap((l) =>
      l && typeof l.productId === "string"
        ? [{
            productId: l.productId,
            selection: l.selection && typeof l.selection === "object" ? l.selection : {},
            quantity: clampQuantity(l.quantity),
          }]
        : [],
    );
  } catch {
    return [];
  }
}

const CartContext = createContext<CartValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const db = useDatabase();
  const now = useNow();
  const [stored, setStored] = useState<StoredLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      setStored(parseStored(window.localStorage.getItem(STORAGE_KEY)));
    } catch {
      /* yok say */
    }
    setReady(true);
    // Baska sekmede degisen sepet buraya da alinir; yoksa bu sekmenin bir
    // sonraki degisikligi oradaki eklemeyi silerdi.
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY || event.key === null) setStored(parseStored(event.newValue));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const update = useCallback((next: (prev: StoredLine[]) => StoredLine[]) => {
    setStored((prev) => {
      const value = next(prev);
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
      } catch {
        /* yok say */
      }
      return value;
    });
  }, []);

  const lines = useMemo<CartLine[]>(
    () =>
      stored.flatMap((s) => {
        const product = db.products.find((p) => p.id === s.productId && p.active);
        if (!product) return [];
        const variant = resolveVariant(product, s.selection);
        const unitExVat = salePriceExVat({ ...product, priceExVat: variant.priceExVat }, now);
        const unitIncVat = priceWithVat(unitExVat, product.vatRate);
        return [
          {
            key: lineKey(s.productId, s.selection),
            product,
            selection: s.selection,
            variantLabel: variantLabel(product, s.selection),
            sku: variant.sku,
            quantity: s.quantity,
            unitExVat,
            unitIncVat,
            totalExVat: unitExVat * s.quantity,
            totalIncVat: unitIncVat * s.quantity,
          },
        ];
      }),
    [stored, db, now],
  );

  const add = useCallback<CartValue["add"]>(
    (productId, selection, quantity = 1) => {
      const product = db.products.find((p) => p.id === productId);
      if (!product) return;
      const full = completeSelection(product, selection);
      const key = lineKey(productId, full);
      update((prev) =>
        prev.some((l) => lineKey(l.productId, l.selection) === key)
          ? prev.map((l) =>
              lineKey(l.productId, l.selection) === key
                ? { ...l, quantity: clampQuantity(l.quantity + quantity) }
                : l,
            )
          : [...prev, { productId, selection: full, quantity: clampQuantity(quantity) }],
      );
    },
    [db, update],
  );

  const setQuantity = useCallback<CartValue["setQuantity"]>(
    (key, quantity) =>
      update((prev) =>
        prev.map((l) =>
          lineKey(l.productId, l.selection) === key
            ? { ...l, quantity: clampQuantity(quantity) }
            : l,
        ),
      ),
    [update],
  );

  const remove = useCallback<CartValue["remove"]>(
    (key) => update((prev) => prev.filter((l) => lineKey(l.productId, l.selection) !== key)),
    [update],
  );

  const clear = useCallback(() => update(() => []), [update]);

  const value = useMemo<CartValue>(
    () => ({
      ready,
      lines,
      count: lines.reduce((sum, l) => sum + l.quantity, 0),
      totals: cartTotals({ lines }, getShopSettings(db)),
      add,
      setQuantity,
      remove,
      clear,
    }),
    [ready, lines, db, add, setQuantity, remove, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart, CartProvider içinde kullanılmalıdır.");
  return ctx;
}
