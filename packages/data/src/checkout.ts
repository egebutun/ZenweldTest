import type { InstallmentOption, ShopSettings } from "./types";

/**
 * SEPET VE ODEME HESAPLARI
 *
 * Tutarlarin hepsi KDV dahil TL'dir. Ayni kurallar sepet sayfasi, odeme
 * sayfasi ve siparis kaydinda kullanilir; boylece musterinin gordugu
 * tutar ile kaydedilen tutar hep aynidir.
 */

export interface CartTotalsInput {
  /** Satir bazinda KDV dahil ve KDV haric tutarlar */
  lines: { totalIncVat: number; totalExVat: number }[];
}

export interface CartTotals {
  subtotal: number;
  vat: number;
  shipping: number;
  /** Kargo bedava olana kadar kalan tutar (0 = bedava) */
  remainingForFreeShipping: number;
  total: number;
}

export function cartTotals({ lines }: CartTotalsInput, shop: ShopSettings): CartTotals {
  const subtotal = lines.reduce((sum, l) => sum + l.totalIncVat, 0);
  const vat = lines.reduce((sum, l) => sum + (l.totalIncVat - l.totalExVat), 0);
  const free = subtotal >= shop.freeShippingThreshold;
  const shipping = subtotal === 0 || free ? 0 : shop.shippingFee;
  return {
    subtotal,
    vat,
    shipping,
    remainingForFreeShipping: free ? 0 : shop.freeShippingThreshold - subtotal,
    total: subtotal + shipping,
  };
}

/** Musteriye sunulan taksit secenekleri (tek cekim her zaman ilk sirada). */
export function availableInstallments(total: number, shop: ShopSettings): InstallmentOption[] {
  const single: InstallmentOption = { count: 1, ratePercent: 0, enabled: true };
  if (total < shop.minInstallmentAmount) return [single];
  return [
    single,
    ...shop.installments
      .filter((o) => o.enabled && o.count > 1)
      .sort((a, b) => a.count - b.count),
  ];
}

/** Vade farki dahil toplam ve aylik taksit tutari. */
export function installmentQuote(total: number, option: InstallmentOption) {
  const fee = Math.round((total * option.ratePercent) / 100);
  const grandTotal = total + fee;
  return { fee, grandTotal, monthly: grandTotal / option.count };
}
