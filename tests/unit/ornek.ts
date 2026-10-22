import type { OptionDefinition, PaymentPos, Product, ShopSettings } from "@zenweld/data";

/**
 * TESTLERDE KULLANILAN ORNEK KAYITLAR
 *
 * Ornek veriden (seed) bagimsizdir: ornek veri degisse de testler ayni
 * kalir. Her test yalnizca kendisi icin onemli alanlari degistirir.
 */

export function product(overrides: Partial<Product> = {}): Product {
  return {
    id: "p1",
    slug: "ornek-urun",
    sku: "ZW-URUN",
    name: "Örnek Ürün",
    section: "ekipmanlar",
    categorySlug: "ornek-kategori",
    processes: [],
    shortDescription: "",
    description: "",
    priceExVat: 1000,
    vatRate: 20,
    currency: "TRY",
    images: [],
    specs: [],
    inTheBox: [],
    highlights: [],
    quotable: true,
    isNew: false,
    warrantyMonths: 24,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    active: true,
    ...overrides,
  };
}

/** "Hortum Uzunluğu" tanimi: degerler tanimdaki sirayla 3 m, 4 m, 5 m. */
export const hoseLength: OptionDefinition = {
  id: "opt-hortum",
  name: "Hortum Uzunluğu",
  values: [
    { id: "v3", label: "3 m" },
    { id: "v4", label: "4 m" },
    { id: "v5", label: "5 m" },
  ],
} as OptionDefinition;

export function pos(overrides: Partial<PaymentPos> = {}): PaymentPos {
  return {
    id: "pos",
    bankShortName: "Banka",
    name: "Banka POS",
    merchantNo: "",
    posName: "",
    active: true,
    isDefault: false,
    installments: [],
    commissions: [],
    ...overrides,
  };
}

export function shop(overrides: Partial<ShopSettings> = {}): ShopSettings {
  return {
    freeShippingThreshold: 5000,
    shippingFee: 250,
    pos: [],
    minInstallmentAmount: 1000,
    bankAccounts: [],
    transferDueDays: 3,
    carriers: [],
    ...overrides,
  };
}

/** Verilen hanelerin sonuna Luhn kontrol hanesini ekler (gecerli kart numarasi uretir). */
export function withLuhn(body: string): string {
  let sum = 0;
  for (let i = 0; i < body.length; i++) {
    let d = Number(body[body.length - 1 - i]);
    if (i % 2 === 0) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return body + String((10 - (sum % 10)) % 10);
}
