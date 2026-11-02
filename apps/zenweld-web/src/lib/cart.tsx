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
import { useAuth } from "@zenweld/auth";
import {
  cartTotals,
  findVariant,
  normalizeCouponCode,
  productOptionsView,
  salePriceExVat,
  type CartTotals,
  type CouponResult,
  type Product,
} from "@zenweld/data";
import { checkCoupon, getShopSettings, isProductInStock, useDatabase, useNow } from "@zenweld/store";
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
 *
 * Zenweld deposunda (SAP) olmayan urun ya da secenek sepete eklenmez; sepete
 * eklendikten sonra stogu biten satir isaretlenir ve odemeye gecilemez
 * (KARARLAR K-82).
 *
 * Kupon: sepete bir kupon kodu yazilabilir (KARARLAR K-85). Kod tarayicida
 * saklanir; indirim her seferinde guncel sepete gore yeniden hesaplanir.
 * Sonradan uygulanamaz hale gelen kupon (sure doldu, sepet degisti)
 * isaretlenir ve kaldirilana kadar odemeye gecilemez.
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
  /** Zenweld deposunda var mi; yoksa odemeye gecilemez */
  inStock: boolean;
  /** Urunun kategorisinin kimligi (kuponun kapsami icin) */
  categoryId?: string;
}

/** Sepete yazilmis kupon ve guncel sepete gore sonucu. */
export interface CartCoupon {
  code: string;
  result: CouponResult;
}

interface CartValue {
  /** Sepet tarayicidan okundu mu (once bos gorunup sonra dolmasin diye) */
  ready: boolean;
  lines: CartLine[];
  /** Toplam urun adedi (baslikta gosterilir) */
  count: number;
  totals: CartTotals;
  /** Stokta olmayan satir var mi (varsa odemeye gecilemez) */
  hasOutOfStock: boolean;
  /** Sepete yazilmis kupon; uygulanamiyorsa result.ok false (odemeye gecilemez) */
  coupon: CartCoupon | null;
  /** Kodu dener; uygulanabiliyorsa sepete yazar. Sonucu dondurur. */
  applyCoupon: (code: string) => CouponResult;
  removeCoupon: () => void;
  /** Secenekli urunde varyant verilmezse ilk varyant eklenir. Stokta olmayan eklenmez. */
  add: (productId: string, variantId?: string, quantity?: number) => void;
  setQuantity: (key: string, quantity: number) => void;
  remove: (key: string) => void;
  clear: () => void;
}

const STORAGE_KEY = "zenweld.cart.v1";
const COUPON_KEY = "zenweld.cart.coupon.v1";
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
  const { user } = useAuth();
  const [stored, setStored] = useState<StoredLine[]>([]);
  const [couponCode, setCouponCode] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      setStored(parseStored(window.localStorage.getItem(STORAGE_KEY)));
      setCouponCode(window.localStorage.getItem(COUPON_KEY) || null);
    } catch {
      /* yok say */
    }
    setReady(true);
    // Baska sekmede degisen sepet buraya da alinir; yoksa bu sekmenin bir
    // sonraki degisikligi oradaki eklemeyi silerdi.
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY || event.key === null) setStored(parseStored(event.newValue));
      if (event.key === COUPON_KEY || event.key === null) setCouponCode(event.newValue || null);
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
            inStock: isProductInStock(product, s.variantId, db),
            categoryId: db.categories.find((c) => c.slug === product.categorySlug)?.id,
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
      if (!isProductInStock(product, chosen, db)) return;
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

  const storeCoupon = useCallback((code: string | null) => {
    setCouponCode(code);
    try {
      if (code) window.localStorage.setItem(COUPON_KEY, code);
      else window.localStorage.removeItem(COUPON_KEY);
    } catch {
      /* yok say */
    }
  }, []);

  const clear = useCallback(() => {
    update(() => []);
    storeCoupon(null);
  }, [update, storeCoupon]);

  // Kupon her seferinde guncel sepet, uye ve ana gore yeniden hesaplanir.
  const evaluate = useCallback(
    (code: string) =>
      checkCoupon(
        code,
        lines.map((l) => ({ productId: l.product.id, categoryId: l.categoryId, totalIncVat: l.totalIncVat })),
        { userId: user?.id, userEmail: user?.email, at: now },
        db,
      ),
    [lines, user, now, db],
  );

  const coupon = useMemo<CartCoupon | null>(
    () => (couponCode ? { code: couponCode, result: evaluate(couponCode) } : null),
    [couponCode, evaluate],
  );

  const applyCoupon = useCallback<CartValue["applyCoupon"]>(
    (code) => {
      const result = evaluate(code);
      if (result.ok) storeCoupon(normalizeCouponCode(code));
      return result;
    },
    [evaluate, storeCoupon],
  );

  const removeCoupon = useCallback(() => storeCoupon(null), [storeCoupon]);

  const value = useMemo<CartValue>(
    () => ({
      ready,
      lines,
      count: lines.reduce((sum, l) => sum + l.quantity, 0),
      totals: cartTotals(
        { lines, lineDiscounts: coupon?.result.ok ? coupon.result.lineDiscounts : undefined },
        getShopSettings(db),
      ),
      hasOutOfStock: lines.some((l) => !l.inStock),
      coupon,
      applyCoupon,
      removeCoupon,
      add,
      setQuantity,
      remove,
      clear,
    }),
    [ready, lines, db, coupon, applyCoupon, removeCoupon, add, setQuantity, remove, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart, CartProvider içinde kullanılmalıdır.");
  return ctx;
}
