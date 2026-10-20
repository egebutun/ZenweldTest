import type { InstallmentOption, PaymentPos, ShopSettings } from "./types";

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

/** Turkiye'deki taksitli kart programlari (kartin BIN'inden bulunur). */
export const CARD_PROGRAMS = [
  "Bonus",
  "World",
  "Maximum",
  "Axess",
  "CardFinans",
  "Paraf",
  "Advantage",
  "BankkartCombo",
] as const;
export type CardProgram = (typeof CARD_PROGRAMS)[number];

/** Panelde sunulabilecek taksit sayilari */
export const INSTALLMENT_COUNTS = [2, 3, 6, 9, 12];

/**
 * Kartin cekilecegi POS: kart programi eslesen ilk aktif banka POS'u
 * (listedeki sira onceliktir); eslesen yoksa ya da program bilinmiyorsa
 * varsayilan POS. matched false ise yalnizca tek cekim yapilir.
 */
export function posForCard(program: string | undefined, shop: ShopSettings): { pos?: PaymentPos; matched: boolean } {
  const matched = program ? shop.pos.find((p) => p.active && p.program === program) : undefined;
  if (matched) return { pos: matched, matched: true };
  return { pos: shop.pos.find((p) => p.active && p.isDefault), matched: false };
}

/**
 * Musteriye sunulan taksit secenekleri (tek cekim her zaman ilk sirada):
 * kartin bankasinin (POS) taksitleri. Odeme alinabilecek POS yoksa bos.
 */
export function cardInstallments(
  total: number,
  program: string | undefined,
  shop: ShopSettings,
): { pos?: PaymentPos; options: InstallmentOption[] } {
  const { pos, matched } = posForCard(program, shop);
  if (!pos) return { options: [] };
  const single: InstallmentOption = { count: 1, ratePercent: 0, enabled: true };
  if (!matched || total < shop.minInstallmentAmount) return { pos, options: [single] };
  return {
    pos,
    options: [single, ...pos.installments.filter((o) => o.enabled && o.count > 1).sort((a, b) => a.count - b.count)],
  };
}

/** Bankanin bu taksit sayisinda Zenweld'den kestigi komisyon (%); girilmemisse undefined. */
export const posCommission = (pos: PaymentPos, count: number) =>
  pos.commissions.find((c) => c.count === count)?.ratePercent;

/** Vade farki dahil toplam ve aylik taksit tutari. */
export function installmentQuote(total: number, option: InstallmentOption) {
  const fee = Math.round((total * option.ratePercent) / 100);
  const grandTotal = total + fee;
  return { fee, grandTotal, monthly: grandTotal / option.count };
}
