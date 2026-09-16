import type { DealerStock, RetailerStock } from "../types";
import { products } from "./products.seed";
import { retailers } from "./retailers.seed";
import { dealers } from "./dealers.seed";

/**
 * Urun x Satici stok matrisi.
 *
 * Her urunun online saticidaki stok durumu AYRIDIR: A urunu 3 sitede,
 * B urunu 2 sitede stokta olabilir. Urun sayfasi sadece inStock === true
 * olan saticilarin logosunu gosterir.
 *
 * Bu veriler admin panelden (/admin/stok) ve bayi hesaplarinin kendi
 * panelinden (/hesabim/stok-bildirimi) guncellenir.
 */

const STAMP = "2026-09-16T08:00:00+03:00";

/** Deterministik "rastgele": urun+satici kombinasyonundan sabit sonuc uretir. */
function hash(a: string, b: string): number {
  let h = 7;
  const s = a + "|" + b;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function slugForUrl(retailerUrl: string, productSlug: string): string {
  const base = retailerUrl.replace(/\/$/, "");
  return `${base}/urun/${productSlug}`;
}

export const retailerStock: RetailerStock[] = [];

products.forEach((product) => {
  retailers.forEach((retailer) => {
    const h = hash(product.id, retailer.id);
    // Kendi bayi magazamiz urunlerin cogunu tutar, digerleri degisken.
    const threshold = retailer.isOwnStore ? 88 : 55;
    const inStock = h % 100 < threshold;
    // Stok kaydi olmayan kombinasyonlari hic yazmiyoruz (matris seyrek kalsin).
    if (h % 100 >= 92 && !retailer.isOwnStore) return;

    retailerStock.push({
      productId: product.id,
      retailerId: retailer.id,
      inStock,
      quantity: inStock ? (h % 17) + 1 : 0,
      price: inStock
        ? Math.round(
            (product.priceExVat * (1 + product.vatRate / 100) * (0.96 + ((h % 9) / 100))) / 10,
          ) * 10
        : undefined,
      productUrl: retailer.isOwnStore
        ? `/urun/${product.slug}`
        : slugForUrl(retailer.websiteUrl, product.slug),
      updatedAt: STAMP,
    });
  });
});

/** Fiziksel bayi stogu — "sadece stokta olan bayiler" filtresi icin. */
export const dealerStock: DealerStock[] = [];

products.forEach((product) => {
  dealers.forEach((dealer) => {
    const h = hash(dealer.id, product.id);
    if (h % 100 >= 85) return; // bazi bayiler bu urunu hic tutmuyor
    const inStock = h % 100 < 62;
    dealerStock.push({
      productId: product.id,
      dealerId: dealer.id,
      inStock,
      quantity: inStock ? (h % 9) + 1 : 0,
      updatedAt: STAMP,
    });
  });
});
