import { priceWithVat } from "@zenweld/utils";
import type { CouponCartLine } from "./coupon";
import { salePriceExVat } from "./discount";
import type { OrderItem, Product, ZenweldDatabase } from "./types";
import { findVariant, productOptionsView, type VariantView } from "./variants";
import { isInWarehouse, warehouseStockMap } from "./warehouse";

/**
 * SEPET SATIRLARININ FIYATI (sepet, odeme sayfasi ve sunucu)
 *
 * Sepette yalnizca urun, secenek (varyant) ve adet tutulur; fiyat her zaman
 * o anki urun kaydindan (kampanya dahil) hesaplanir. Tarayicidaki sepet ve
 * veritabani modunda siparisi kaydeden sunucu ayni fonksiyonu kullanir;
 * boylece musterinin gordugu tutar ile sunucunun hesapladigi tutar ayni
 * kurallardan cikar (Asama 5.2).
 *
 * - Yayinda olmayan urun ve secilen secenegi artik bulunmayan satir
 *   dusulur; yoksa sessizce baska bir secenek satilirdi.
 * - Stok: Zenweld deposu (KARARLAR K-82); stokta olmayan satir isaretlenir.
 */

export interface CartStoredLine {
  productId: string;
  /** Secenekli urunde varyantin kimligi */
  variantId?: string;
  quantity: number;
}

export interface PricedCartLine {
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

/** Fiyat hesabina giren katalog parcasi. */
export type CartCatalog = Pick<ZenweldDatabase, "products" | "optionDefinitions" | "categories" | "warehouseStock">;

export const MAX_LINE_QUANTITY = 99;

/** Adet her zaman 1-99 arasinda tam sayi; 0, eksi veya kesirli adet sepete girmez. */
export const clampQuantity = (quantity: number) =>
  Math.max(1, Math.min(MAX_LINE_QUANTITY, Math.floor(Number(quantity)) || 1));

export const cartLineKey = (productId: string, variantId?: string) => `${productId}|${variantId ?? ""}`;

/**
 * Varyantin NORMAL fiyati (KDV haric). Kampanya varsa ayni indirim ORANI bu
 * fiyata uygulanir (salePriceExVat); boylece 3 m ve 5 m torcta indirim
 * yuzdesi ayni kalir.
 */
export const variantPriceExVat = (product: Product, variant?: Pick<VariantView, "priceDeltaExVat">) =>
  product.priceExVat + (variant?.priceDeltaExVat ?? 0);

export function priceCartLines(stored: CartStoredLine[], catalog: CartCatalog, at: Date): PricedCartLine[] {
  const stock = warehouseStockMap(catalog.warehouseStock ?? []);
  return stored.flatMap((s) => {
    const product = catalog.products.find((p) => p.id === s.productId && p.active);
    if (!product) return [];
    const view = productOptionsView(product, catalog.optionDefinitions);
    const variant = view ? findVariant(view, s.variantId) : undefined;
    if (view && !variant) return [];
    const unitExVat = salePriceExVat({ ...product, priceExVat: variantPriceExVat(product, variant) }, at);
    const unitIncVat = priceWithVat(unitExVat, product.vatRate);
    const quantity = clampQuantity(s.quantity);
    return [
      {
        key: cartLineKey(s.productId, s.variantId),
        product,
        variantId: s.variantId,
        variantLabel: variant?.fullLabel,
        sku: variant?.sku || product.sku,
        image: variant?.image ?? product.images[0]?.url,
        quantity,
        unitExVat,
        unitIncVat,
        totalExVat: unitExVat * quantity,
        totalIncVat: unitIncVat * quantity,
        inStock: isInWarehouse(product, stock, s.variantId),
        categoryId: catalog.categories.find((c) => c.slug === product.categorySlug)?.id,
      },
    ];
  });
}

/** Kupon hesabina giren satirlar. */
export const couponCartLines = (lines: PricedCartLine[]): CouponCartLine[] =>
  lines.map((l) => ({ productId: l.product.id, categoryId: l.categoryId, totalIncVat: l.totalIncVat }));

/** Siparis satirlari: siparis anindaki ad, kod, fiyat ve kupon payi kopyalanir. */
export function orderItemsFromLines(lines: PricedCartLine[], lineDiscounts: number[] = []): OrderItem[] {
  return lines.map((l, i) => ({
    productId: l.product.id,
    productName: l.product.name,
    sku: l.sku,
    variantLabel: l.variantLabel,
    quantity: l.quantity,
    unitPriceExVat: l.unitExVat,
    vatRate: l.product.vatRate,
    unitPrice: l.unitIncVat,
    ...(lineDiscounts[i] ? { couponDiscount: lineDiscounts[i] } : {}),
  }));
}
