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
  /** Kupon indiriminin satirlara dusen payi (KDV dahil; lines ile ayni sirada) */
  lineDiscounts?: number[];
}

export interface CartTotals {
  /** Urunler toplami (kampanyali, kupon oncesi) */
  subtotal: number;
  /** Kupon indirimi (KDV dahil); kupon yoksa 0 */
  couponDiscount: number;
  /** Urunlere odenen tutar (subtotal - kupon) icindeki KDV; kurusa yuvarlanir */
  vat: number;
  shipping: number;
  /** Kargo bedava olana kadar kalan tutar (0 = bedava) */
  remainingForFreeShipping: number;
  total: number;
}

/**
 * Sepet toplamlari. Kupon kargoya uygulanmaz; ucretsiz kargo siniri kupon
 * dusulduktan sonraki urun tutarina bakar (KARARLAR K-85). Kupon KDV
 * matrahini dusurur: her satirin KDV'si indirimli tutara gore azalir.
 */
export function cartTotals({ lines, lineDiscounts = [] }: CartTotalsInput, shop: ShopSettings): CartTotals {
  const subtotal = lines.reduce((sum, l) => sum + l.totalIncVat, 0);
  const couponDiscount = Math.round(lineDiscounts.reduce((sum, d) => sum + d, 0) * 100) / 100;
  const vat = lines.reduce((sum, l, i) => {
    const lineVat = l.totalIncVat - l.totalExVat;
    const d = lineDiscounts[i] ?? 0;
    return sum + (d > 0 && l.totalIncVat > 0 ? (lineVat * (l.totalIncVat - d)) / l.totalIncVat : lineVat);
  }, 0);
  const goods = subtotal - couponDiscount;
  const free = goods >= shop.freeShippingThreshold;
  const shipping = subtotal === 0 || free ? 0 : shop.shippingFee;
  return {
    subtotal,
    couponDiscount,
    vat: Math.round(vat * 100) / 100,
    shipping,
    remainingForFreeShipping: free ? 0 : shop.freeShippingThreshold - goods,
    total: goods + shipping,
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
