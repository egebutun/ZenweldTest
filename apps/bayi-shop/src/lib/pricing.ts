import { applyDiscount, discountPercent, type Product, type RetailerStock } from "@zenweld/data";
import { priceWithVat } from "./format";

export interface ShopPrice {
  /** Magazanin normal satis fiyati (KDV dahil) */
  normal: number;
  /** Musterinin odeyecegi fiyat (KDV dahil) */
  sale: number;
  /** Gecerli kampanya orani; yoksa 0 */
  percent: number;
}

/**
 * MAGAZA FIYATI
 *
 * Magaza kendi normal fiyatini belirler (stock.price, KDV dahil); yoksa
 * Zenweld'in normal fiyati kullanilir. Zenweld'in yonetim panelinde
 * tanimladigi kampanya gecerliyken AYNI indirim orani magaza fiyatina da
 * uygulanir ve tarihleri gelince kendiliginden baslar/biter.
 *
 * Sepete eklenen fiyat, siralama ve yapisal veri hep buradan gecer.
 */
export function shopPrice(product: Product, stock: RetailerStock | undefined, at?: Date): ShopPrice {
  const normal = stock?.price ?? priceWithVat(product.priceExVat, product.vatRate);
  const percent = discountPercent(product, at);
  return { normal, sale: applyDiscount(normal, percent), percent };
}
