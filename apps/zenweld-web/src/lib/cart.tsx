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
  cartLineKey as lineKey,
  cartTotals,
  clampQuantity,
  couponCartLines,
  couponView,
  MAX_LINE_QUANTITY,
  normalizeCouponCode,
  priceCartLines,
  productOptionsView,
  type CartStoredLine,
  type CartTotals,
  type CouponView,
  type PricedCartLine,
} from "@zenweld/data";
import { checkCoupon, getShopSettings, isProductInStock, useDatabase, useNow } from "@zenweld/store";
import { activeVariant } from "./variants";

export { MAX_LINE_QUANTITY };

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
 * isaretlenir ve kaldirilana kadar odemeye gecilemez. Veritabani modunda
 * kupon sunucuda degerlendirilir (/api/siparis/kupon; Asama 5.2): kuponlar
 * ve kullanimlari tarayiciya gelmez.
 *
 * Fiyat hesabi: packages/data/src/cart.ts (siparisi kaydeden sunucu da ayni
 * fonksiyonu kullanir).
 */

type StoredLine = CartStoredLine;
export type CartLine = PricedCartLine;

/** Sepete yazilmis kupon ve guncel sepete gore sonucu. */
export interface CartCoupon {
  code: string;
  result: CouponView;
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
  /** Veritabani modunda kupon sunucuda yeniden degerlendiriliyor (sonuc henuz guncel degil) */
  couponPending: boolean;
  /** Kodu dener; uygulanabiliyorsa sepete yazar. Sonucu dondurur. */
  applyCoupon: (code: string) => Promise<CouponView>;
  removeCoupon: () => void;
  /** Secenekli urunde varyant verilmezse ilk varyant eklenir. Stokta olmayan eklenmez. */
  add: (productId: string, variantId?: string, quantity?: number) => void;
  setQuantity: (key: string, quantity: number) => void;
  remove: (key: string) => void;
  clear: () => void;
}

const STORAGE_KEY = "zenweld.cart.v1";
const COUPON_KEY = "zenweld.cart.coupon.v1";

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
  const { user, api } = useAuth();
  // Veritabani modu: kupon sunucuda degerlendirilir.
  const server = api !== null;
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

  const lines = useMemo<CartLine[]>(() => priceCartLines(stored, db, now), [stored, db, now]);

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
      couponView(checkCoupon(code, couponCartLines(lines), { userId: user?.id, userEmail: user?.email, at: now }, db)),
    [lines, user, now, db],
  );

  // Veritabani modu: sonucun hangi sepet, kod ve uye icin oldugu (key) da saklanir.
  const requestKey = useCallback(
    (code: string) => JSON.stringify([code, user?.id ?? null, lines.map((l) => [l.key, l.quantity])]),
    [lines, user],
  );
  const [remote, setRemote] = useState<{ key: string; code: string; result: CouponView } | null>(null);
  const askServer = useCallback(
    async (code: string): Promise<CouponView> => {
      try {
        const response = await fetch("/api/siparis/kupon", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code,
            lines: lines.map((l) => ({ productId: l.product.id, variantId: l.variantId, quantity: l.quantity })),
          }),
        });
        const answer = (await response.json()) as { ok?: boolean; result?: CouponView };
        if (answer.ok && answer.result) return answer.result;
      } catch {
        /* asagida */
      }
      return { ok: false, problem: "invalid" };
    },
    [lines],
  );

  useEffect(() => {
    if (!server || !couponCode) return;
    const key = requestKey(couponCode);
    if (remote?.key === key) return;
    let active = true;
    void askServer(couponCode).then((result) => {
      if (active) setRemote({ key, code: couponCode, result });
    });
    return () => {
      active = false;
    };
  }, [server, couponCode, requestKey, remote?.key, askServer]);

  const couponPending = server && couponCode !== null && remote?.key !== requestKey(couponCode);
  const coupon = useMemo<CartCoupon | null>(() => {
    if (!couponCode) return null;
    if (!server) return { code: couponCode, result: evaluate(couponCode) };
    // Sunucunun yaniti gelene kadar ayni kodun son sonucu gosterilir.
    return remote?.code === couponCode ? { code: couponCode, result: remote.result } : null;
  }, [couponCode, server, evaluate, remote]);

  const applyCoupon = useCallback<CartValue["applyCoupon"]>(
    async (code) => {
      const normalized = normalizeCouponCode(code);
      const result = server ? await askServer(normalized) : evaluate(normalized);
      if (result.ok) {
        if (server) setRemote({ key: requestKey(normalized), code: normalized, result });
        storeCoupon(normalized);
      }
      return result;
    },
    [server, askServer, evaluate, requestKey, storeCoupon],
  );

  const removeCoupon = useCallback(() => storeCoupon(null), [storeCoupon]);

  const value = useMemo<CartValue>(
    () => ({
      // Veritabani modunda sepete yazili kuponun ilk sonucu gelene kadar hazir degil.
      ready: ready && (!server || !couponCode || remote?.code === couponCode),
      lines,
      count: lines.reduce((sum, l) => sum + l.quantity, 0),
      totals: cartTotals(
        { lines, lineDiscounts: coupon?.result.ok ? coupon.result.lineDiscounts : undefined },
        getShopSettings(db),
      ),
      hasOutOfStock: lines.some((l) => !l.inStock),
      coupon,
      couponPending,
      applyCoupon,
      removeCoupon,
      add,
      setQuantity,
      remove,
      clear,
    }),
    [ready, server, couponCode, remote, lines, db, coupon, couponPending, applyCoupon, removeCoupon, add, setQuantity, remove, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart, CartProvider içinde kullanılmalıdır.");
  return ctx;
}
