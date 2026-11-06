import { describe, expect, it } from "vitest";
import { isValidDateKey, toggledWarrantyExpiry, type Order, type ZenweldDatabase } from "@zenweld/data";
import { isTransferExpired, registerWarranty, warrantiesForEmail, warrantyExpiry } from "@zenweld/store";

/* docs/IS-KURALLARI.md › 6. Havale / EFT */
describe("Havale / EFT ödeme süresi", () => {
  // Pazartesi 16.03.2026 15:00'te verilen siparis, sure 3 gun: son odeme Persembe
  // (saatler Turkiye saati).
  const order = (overrides: Partial<Order> = {}) =>
    ({
      status: "awaiting_payment",
      payment: { method: "transfer", dueAt: new Date("2026-03-19T15:00:00+03:00").toISOString() },
      ...overrides,
    }) as Order;

  it("süre son ödeme gününün sonunda dolar (Perşembe 23:59'a kadar onaylanabilir)", () => {
    expect(isTransferExpired(order(), new Date("2026-03-19T15:01:00+03:00"))).toBe(false);
    expect(isTransferExpired(order(), new Date("2026-03-19T23:59:59+03:00"))).toBe(false);
    expect(isTransferExpired(order(), new Date("2026-03-20T00:00:01+03:00"))).toBe(true);
  });

  it("gün sonu Türkiye saatine göredir (sunucu UTC'de çalışır)", () => {
    expect(isTransferExpired(order(), new Date("2026-03-19T20:59:59Z"))).toBe(false);
    expect(isTransferExpired(order(), new Date("2026-03-19T21:00:01Z"))).toBe(true);
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
  const registered = new Date("2026-03-15T10:00:00+03:00").toISOString();

  it("örnek: 15.03.2026'da kayıt, garanti 24 ay, uzatma istendi → 15.03.2029", () => {
    expect(warrantyExpiry(registered, "p24", true, db)).toBe("2029-03-15");
  });

  it("bitiş = kayıt tarihi + ürünün garanti süresi; ürün bulunamazsa 24 ay", () => {
    expect(warrantyExpiry(registered, "p24", false, db)).toBe("2028-03-15");
    expect(warrantyExpiry(registered, "p36", false, db)).toBe("2029-03-15");
    expect(warrantyExpiry(registered, "silinmis-urun", false, db)).toBe("2028-03-15");
  });

  it("bitiş Türkiye saatine göre hesaplanır (gece yarısından sonraki kayıtta gün kaymaz)", () => {
    // 15.03 00:30 Türkiye = 14.03 21:30 UTC (sunucu UTC'de çalışır).
    expect(warrantyExpiry(new Date("2026-03-15T00:30:00+03:00").toISOString(), "p24", false, db)).toBe("2028-03-15");
  });

  it("panelde +12 ay eklenir ve kaldırılınca 12 ay çıkarılır", () => {
    expect(toggledWarrantyExpiry("2029-03-15", true)).toBe("2030-03-15");
    expect(toggledWarrantyExpiry("2030-03-15", false)).toBe("2029-03-15");
  });

  it("29 Şubat + 12 ay → 1 Mart; geri alınca 1 Mart'tan çıkar (karar: bir gün kayar)", () => {
    expect(toggledWarrantyExpiry("2028-02-29", true)).toBe("2029-03-01");
    expect(toggledWarrantyExpiry("2029-03-01", false)).toBe("2028-03-01");
  });

  it("panelde elle girilen bitiş tarihi geçerli bir gün olmalı", () => {
    expect(isValidDateKey("2028-02-29")).toBe(true);
    expect(isValidDateKey("2027-02-29")).toBe(false);
    expect(isValidDateKey("2028-13-01")).toBe(false);
    expect(isValidDateKey("1.3.2028")).toBe(false);
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
    expect(saved).toBeTruthy();
    if (!saved) return;
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
