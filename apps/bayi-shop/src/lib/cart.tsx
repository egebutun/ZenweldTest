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

export interface CartItem {
  productId: string;
  name: string;
  slug: string;
  image?: string;
  /** KDV dahil birim fiyat */
  unitPrice: number;
  quantity: number;
}

interface CartValue {
  items: CartItem[];
  add: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  remove: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
  count: number;
  subtotal: number;
  shipping: number;
  total: number;
}

const STORAGE_KEY = "zenweld-bayi.cart.v1";
const CartContext = createContext<CartValue | null>(null);

export function CartProvider({
  children,
  freeShippingOver,
  shippingFee,
}: {
  children: ReactNode;
  freeShippingOver: number;
  shippingFee: number;
}) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw) as CartItem[]);
    } catch {
      /* yok say */
    }
  }, []);

  const persist = useCallback((next: CartItem[]) => {
    setItems(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* yok say */
    }
  }, []);

  const add = useCallback<CartValue["add"]>((item, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === item.productId);
      const next = existing
        ? prev.map((i) =>
            i.productId === item.productId ? { ...i, quantity: i.quantity + quantity } : i,
          )
        : [...prev, { ...item, quantity }];
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* yok say */
      }
      return next;
    });
  }, []);

  const value = useMemo<CartValue>(() => {
    const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
    const shipping = subtotal === 0 || subtotal >= freeShippingOver ? 0 : shippingFee;
    return {
      items,
      add,
      remove: (productId) => persist(items.filter((i) => i.productId !== productId)),
      setQuantity: (productId, quantity) =>
        persist(
          items.map((i) =>
            i.productId === productId ? { ...i, quantity: Math.max(1, quantity) } : i,
          ),
        ),
      clear: () => persist([]),
      count: items.reduce((sum, i) => sum + i.quantity, 0),
      subtotal,
      shipping,
      total: subtotal + shipping,
    };
  }, [items, add, persist, freeShippingOver, shippingFee]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart, CartProvider içinde kullanılmalıdır.");
  return ctx;
}
