import { describe, expect, it } from "vitest";
import type { Order, ZenweldDatabase } from "@zenweld/data";
import { isTransferExpired, registerWarranty, warrantiesForEmail, warrantyExpiry } from "@zenweld/store";
import { addMonthsToDate } from "@zenweld/utils";

/* docs/IS-KURALLARI.md › 6. Havale / EFT */
describe("Havale / EFT ödeme süresi", () => {
  // Pazartesi 16.03.2026 15:00'te verilen siparis, sure 3 gun: son odeme Persembe.
  const order = (overrides: Partial<Order> = {}) =>
    ({
      status: "awaiting_payment",
      payment: { method: "transfer", dueAt: new Date(2026, 2, 19, 15, 0).toISOString() },
      ...overrides,
    }) as Order;

  it("süre son ödeme gününün sonunda dolar (Perşembe 23:59'a kadar onaylanabilir)", () => {
    expect(isTransferExpired(order(), new Date(2026, 2, 19, 15, 1))).toBe(false);
    expect(isTransferExpired(order(), new Date(2026, 2, 19, 23, 59, 59))).toBe(false);
    expect(isTransferExpired(order(), new Date(2026, 2, 20, 0, 0, 1))).toBe(true);
  });

  it("yalnızca ödeme bekleyen sipariş için geçerlidir", () => {
    const late = new Date(2026, 3, 1);
    expect(isTransferExpired(order({ status: "preparing" }), late)).toBe(false);
    expect(isTransferExpired(order({ status: "cancelled" }), late)).toBe(false);
  });
});

/* docs/IS-KURALLARI.md › 10. Garanti */
describe("Garanti bitiş tarihi", () => {
  const db = { products: [{ id: "p24", warrantyMonths: 24 }, { id: "p36", warrantyMonths: 36 }] } as ZenweldDatabase;
  const registered = new Date(2026, 2, 15, 10, 0).toISOString();

  it("örnek: 15.03.2026'da kayıt, garanti 24 ay, uzatma istendi → 15.03.2029", () => {
    expect(warrantyExpiry(registered, "p24", true, db)).toBe("2029-03-15");
  });

  it("bitiş = kayıt tarihi + ürünün garanti süresi; ürün bulunamazsa 24 ay", () => {
    expect(warrantyExpiry(registered, "p24", false, db)).toBe("2028-03-15");
    expect(warrantyExpiry(registered, "p36", false, db)).toBe("2029-03-15");
    expect(warrantyExpiry(registered, "silinmis-urun", false, db)).toBe("2028-03-15");
  });

  it("bitiş yerel tarihe göre hesaplanır (gece yarısından sonraki kayıtta gün kaymaz)", () => {
    expect(warrantyExpiry(new Date(2026, 2, 15, 0, 30).toISOString(), "p24", false, db)).toBe("2028-03-15");
  });

  it("panelde +12 ay eklenir ve kaldırılınca 12 ay çıkarılır", () => {
    expect(addMonthsToDate("2029-03-15", 12)).toBe("2030-03-15");
    expect(addMonthsToDate("2030-03-15", -12)).toBe("2029-03-15");
  });

  it("29 Şubat + 12 ay → 1 Mart; geri alınca 1 Mart'tan çıkar (karar: bir gün kayar)", () => {
    expect(addMonthsToDate("2028-02-29", 12)).toBe("2029-03-01");
    expect(addMonthsToDate("2029-03-01", -12)).toBe("2028-03-01");
  });
});

describe("Garanti kaydı", () => {
  const form = {
    serialNumber: "  zw-test-0001 ",
    categorySlug: "ornek",
    productId: "p-yok",
    ownerName: "Test",
    email: "Ali.Veli@Ornek.COM ",
    phone: "",
    city: "",
    postalCode: "",
    address: "",
    sellerTaxNumber: "",
    extended: false,
  } as Parameters<typeof registerWarranty>[0];

  it("seri numarası büyük harfe çevrilir ve boşlukları silinir; e-posta küçük harfle saklanır", () => {
    const saved = registerWarranty(form);
    expect(saved).not.toBe(false);
    if (saved === false) return;
    expect(saved.serialNumber).toBe("ZW-TEST-0001");
    expect(saved.email).toBe("ali.veli@ornek.com");
  });

  it("aynı seri numarası ikinci kez kaydedilemez", () => {
    expect(registerWarranty({ ...form, serialNumber: "ZW-TEST-0001" })).toBe(false);
  });

  it("Garantilerim kayıtlara e-postayla eşleşir (büyük/küçük harf farkı gözetilmez)", () => {
    expect(warrantiesForEmail("ALI.VELI@ornek.com").map((w) => w.serialNumber)).toContain("ZW-TEST-0001");
  });
});
