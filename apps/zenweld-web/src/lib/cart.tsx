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
import { cartTotals, findVariant, productOptionsView, salePriceExVat, type CartTotals, type Product } from "@zenweld/data";
import { getShopSettings, useDatabase, useNow } from "@zenweld/store";
import { priceWithVat } from "@zenweld/utils";
import { activeVariant, resolveVariant } from "./variants";

/**
 * ALISVERIS SEPETI
 *
 * Sepette yalnizca urun, varyant ve adet saklanir; fiyat her zaman o anki
 * urun kaydindan (kampanya dahil) hesaplanir. Boylece yonetim panelinde
 * fiyat degisirse sepet de guncel fiyati gosterir. Yayindan kaldirilan
 * urun ve secilen varyanti artik bulunmayan satir sepette gorunmez.
 *
 * Sepet tarayicida saklanir; uye girisi yalnizca odeme adiminda istenir.
 */

interface StoredLine {
  productId: string;
  /** Secenekli urunde varyantin kimligi */
  variantId?: string;
  quantity: number;
}

export interface CartLine {
  /** urun + varyant; ayni urunun farkli varyantlari ayri satirdir */
  key: string;
  product: Product;
  variantId?: string;
  /** "Soğutma: Su Soğutmalı · Torç Uzunluğu: 8 m" */
  variantLabel?: string;
  sku: string;
  /** Varyantin fotografi, yoksa urunun ilk fotografi */
  image?: string;
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
  /** Secenekli urunde varyant verilmezse ilk varyant eklenir. */
  add: (productId: string, variantId?: string, quantity?: number) => void;
  setQuantity: (key: string, quantity: number) => void;
  remove: (key: string) => void;
  clear: () => void;
}

const STORAGE_KEY = "zenweld.cart.v1";
export const MAX_LINE_QUANTITY = 99;

const lineKey = (productId: string, variantId?: string) => `${productId}|${variantId ?? ""}`;

/**
 * Varyant kimligi. Eski sepet satiri secimi "secenek -> deger" olarak
 * saklardi; tek secenekli urunde varyantin kimligi degerin kimligidir.
 */
function storedVariantId(line: { variantId?: unknown; selection?: unknown }): string | undefined {
  if (typeof line.variantId === "string") return line.variantId;
  if (line.selection && typeof line.selection === "object") {
    const values = Object.values(line.selection as Record<string, unknown>);
    if (values.length === 1 && typeof values[0] === "string") return values[0];
  }
  return undefined;
}

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
            variantId: storedVariantId(l),
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
        const view = productOptionsView(product, db.optionDefinitions);
        // Secilen varyant artik yoksa (urunden kaldirildi) satir gosterilmez;
        // yoksa sessizce baska bir varyant satilirdi.
        if (view && !findVariant(view, s.variantId)) return [];
        const variant = resolveVariant(product, view, s.variantId);
        const unitExVat = salePriceExVat({ ...product, priceExVat: variant.priceExVat }, now);
        const unitIncVat = priceWithVat(unitExVat, product.vatRate);
        return [
          {
            key: lineKey(s.productId, s.variantId),
            product,
            variantId: s.variantId,
            variantLabel: variant.variant?.fullLabel,
            sku: variant.sku,
            image: variant.image ?? product.images[0]?.url,
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
    (productId, variantId, quantity = 1) => {
      const product = db.products.find((p) => p.id === productId);
      if (!product) return;
      const chosen = activeVariant(productOptionsView(product, db.optionDefinitions), variantId)?.id;
      const key = lineKey(productId, chosen);
      update((prev) =>
        prev.some((l) => lineKey(l.productId, l.variantId) === key)
          ? prev.map((l) =>
              lineKey(l.productId, l.variantId) === key
                ? { ...l, quantity: clampQuantity(l.quantity + quantity) }
                : l,
            )
          : [...prev, { productId, variantId: chosen, quantity: clampQuantity(quantity) }],
      );
    },
    [db, update],
  );

  const setQuantity = useCallback<CartValue["setQuantity"]>(
    (key, quantity) =>
      update((prev) =>
        prev.map((l) =>
          lineKey(l.productId, l.variantId) === key
            ? { ...l, quantity: clampQuantity(quantity) }
            : l,
        ),
      ),
    [update],
  );

  const remove = useCallback<CartValue["remove"]>(
    (key) => update((prev) => prev.filter((l) => lineKey(l.productId, l.variantId) !== key)),
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
