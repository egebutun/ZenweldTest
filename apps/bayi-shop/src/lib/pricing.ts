import { applyDiscount, discountPercentOf, type Product, type RetailerStock } from "@zenweld/data";
import { priceWithVat } from "./format";

export interface ShopPrice {
  /** Magazanin normal satis fiyati (KDV dahil) */
  normal: number;
  /** Musterinin odeyecegi fiyat (KDV dahil) */
  sale: number;
  /** Gecerli kampanya orani; yoksa 0 */
  percent: number;
  /** Gecerli kampanyanin bitisi (ISO); kampanya yoksa ya da suresizse bos */
  endsAt?: string;
}

/**
 * MAGAZA FIYATI
 *
 * Fiyati ve kampanyayi BAYI belirler; Zenweld ana sitesinin fiyat ve
 * kampanyalari bu magazayi etkilemez. Bayi ikisini de Zenweld ana
 * sitesinde Hesabim > Stok Bildirimi sayfasindan yonetir:
 *
 * - Normal fiyat: stock.price (KDV dahil). Girilmemisse Zenweld'in
 *   liste fiyati (KDV dahil) yedek olarak kullanilir.
 * - Kampanya: stock.discount. Tarihleri gelince kendiliginden baslar/biter.
 *
 * Sepete eklenen fiyat, siralama ve yapisal veri hep buradan gecer.
 */
export function shopPrice(product: Product, stock: RetailerStock | undefined, at?: Date): ShopPrice {
  const normal = stock?.price ?? priceWithVat(product.priceExVat, product.vatRate);
  const percent = discountPercentOf(stock?.discount, at);
  return {
    normal,
    sale: applyDiscount(normal, percent),
    percent,
    endsAt: percent > 0 ? stock?.discount?.endsAt : undefined,
  };
}
