import { describe, expect, it } from "vitest";
import { cardInstallments, cartTotals, installmentQuote, posCommission, posForCard } from "@zenweld/data";
import { cardBrand, isValidCardNumber, isValidExpiry } from "@/lib/payment";
import { pos, shop, withLuhn } from "./ornek";

/* docs/IS-KURALLARI.md › 4. Sepet ve kargo */
describe("Sepet ve kargo", () => {
  const settings = shop({ freeShippingThreshold: 5000, shippingFee: 250 });

  it("örnek: ara toplam 4.800 ₺ → kargo 250 ₺, toplam 5.050 ₺, ücretsiz kargoya 200 ₺ kaldı", () => {
    expect(cartTotals({ lines: [{ totalIncVat: 4800, totalExVat: 4000 }] }, settings)).toEqual({
      subtotal: 4800,
      vat: 800,
      shipping: 250,
      remainingForFreeShipping: 200,
      total: 5050,
    });
  });

  it("ara toplam sınıra eşitse kargo ücretsiz", () => {
    const totals = cartTotals({ lines: [{ totalIncVat: 5000, totalExVat: 4167 }] }, settings);
    expect(totals.shipping).toBe(0);
    expect(totals.remainingForFreeShipping).toBe(0);
    expect(totals.total).toBe(5000);
  });

  it("ara toplam ve KDV satırların toplamıdır", () => {
    const totals = cartTotals(
      {
        lines: [
          { totalIncVat: 1200, totalExVat: 1000 },
          { totalIncVat: 2400, totalExVat: 2000 },
        ],
      },
      settings,
    );
    expect(totals.subtotal).toBe(3600);
    expect(totals.vat).toBe(600);
  });

  it("sepet boşsa kargo 0", () => {
    const totals = cartTotals({ lines: [] }, settings);
    expect(totals.shipping).toBe(0);
    expect(totals.total).toBe(0);
  });
});

/* docs/IS-KURALLARI.md › 5. Kartla ödeme, taksit ve banka komisyonu */
describe("Kart kontrolleri", () => {
  const visa = withLuhn("400000000000123");

  it("kart numarası 15–19 hane ve Luhn kontrolünden geçmeli", () => {
    expect(isValidCardNumber(visa)).toBe(true);
    expect(isValidCardNumber(visa.replace(/(\d{4})/g, "$1 "))).toBe(true);
    expect(isValidCardNumber(visa.slice(0, -1) + ((Number(visa.at(-1)) + 1) % 10))).toBe(false);
    expect(isValidCardNumber(withLuhn("4000000000123"))).toBe(false); // 14 hane
    expect(isValidCardNumber(withLuhn("4000000000000000123"))).toBe(false); // 20 hane
  });

  it("kart markası numaranın başından anlaşılır", () => {
    expect(cardBrand("4000")).toBe("Visa");
    expect(cardBrand("5100")).toBe("Mastercard");
    expect(cardBrand("5500")).toBe("Mastercard");
    expect(cardBrand("2200")).toBe("Mastercard");
    expect(cardBrand("2700")).toBe("Mastercard");
    expect(cardBrand("9792")).toBe("Troy");
    expect(cardBrand("3400")).toBe("American Express");
    expect(cardBrand("3700")).toBe("American Express");
    expect(cardBrand("6000")).toBeUndefined();
  });

  it("kart son kullanma ayının sonuna kadar geçerlidir", () => {
    expect(isValidExpiry("10/26", new Date(2026, 9, 1))).toBe(true);
    expect(isValidExpiry("10/26", new Date(2026, 9, 31, 23, 59))).toBe(true);
    expect(isValidExpiry("10/26", new Date(2026, 10, 1))).toBe(false);
    expect(isValidExpiry("13/26", new Date(2026, 0, 1))).toBe(false);
    expect(isValidExpiry("1026", new Date(2026, 0, 1))).toBe(false);
  });
});

describe("Kartın çekileceği POS", () => {
  const bonus1 = pos({ id: "bonus1", program: "Bonus" });
  const bonus2 = pos({ id: "bonus2", program: "Bonus" });
  const world = pos({ id: "world", program: "World", active: false });
  const fallback = pos({ id: "varsayilan", isDefault: true });
  const settings = shop({ pos: [bonus1, bonus2, world, fallback] });

  it("programı eşleşen ilk aktif POS; listedeki sıra önceliktir", () => {
    expect(posForCard("Bonus", settings)).toEqual({ pos: bonus1, matched: true });
  });

  it("eşleşen aktif POS yoksa ya da program bilinmiyorsa varsayılan POS", () => {
    expect(posForCard("World", settings)).toEqual({ pos: fallback, matched: false });
    expect(posForCard(undefined, settings)).toEqual({ pos: fallback, matched: false });
  });

  it("varsayılan aktif POS da yoksa kartla ödeme alınamaz", () => {
    const noDefault = shop({ pos: [bonus1, pos({ id: "kapali", isDefault: true, active: false })] });
    expect(posForCard("World", noDefault).pos).toBeUndefined();
    expect(cardInstallments(10000, "World", noDefault).options).toEqual([]);
  });
});

describe("Sunulan taksitler ve vade farkı", () => {
  const bonus = pos({
    id: "bonus",
    program: "Bonus",
    installments: [
      { count: 6, ratePercent: 4.5, enabled: true },
      { count: 2, ratePercent: 0, enabled: true },
      { count: 3, ratePercent: 1.5, enabled: false },
    ],
    commissions: [
      { count: 1, ratePercent: 1.8 },
      { count: 6, ratePercent: 5.2 },
    ],
  });
  const fallback = pos({ id: "varsayilan", isDefault: true });
  const settings = shop({ pos: [bonus, fallback], minInstallmentAmount: 1000 });

  it("tek çekim ilk sırada; sunulan taksitler küçükten büyüğe", () => {
    expect(cardInstallments(10000, "Bonus", settings).options.map((o) => o.count)).toEqual([1, 2, 6]);
  });

  it("toplam taksit için en düşük tutarın altındaysa yalnızca tek çekim", () => {
    expect(cardInstallments(999, "Bonus", settings).options.map((o) => o.count)).toEqual([1]);
  });

  it("varsayılan POS'tan yalnızca tek çekim yapılır", () => {
    const result = cardInstallments(10000, "Axess", settings);
    expect(result.pos).toBe(fallback);
    expect(result.options.map((o) => o.count)).toEqual([1]);
  });

  it("örnek: 10.000 ₺, 6 taksit, %4,5 → vade farkı 450 ₺, ödenecek 10.450 ₺, ayda 1.741,67 ₺", () => {
    const quote = installmentQuote(10000, { count: 6, ratePercent: 4.5, enabled: true });
    expect(quote.fee).toBe(450);
    expect(quote.grandTotal).toBe(10450);
    expect(quote.monthly).toBeCloseTo(1741.67, 2);
  });

  it("vade farkı tam liraya yuvarlanır; oran %0 ise peşin fiyatına taksit", () => {
    expect(installmentQuote(9999, { count: 6, ratePercent: 4.5, enabled: true }).fee).toBe(450); // 449,955
    expect(installmentQuote(9999, { count: 2, ratePercent: 0, enabled: true }).grandTotal).toBe(9999);
  });

  it("banka komisyonu taksit sayısına göre okunur (tek çekim dahil)", () => {
    expect(posCommission(bonus, 1)).toBe(1.8);
    expect(posCommission(bonus, 6)).toBe(5.2);
    expect(posCommission(bonus, 9)).toBeUndefined();
  });
});
