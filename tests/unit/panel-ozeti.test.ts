import { describe, expect, it } from "vitest";
import { defaultSettings, type Order, type Quote, type User } from "@zenweld/data";
import { dashboardSummary, makeRange, parseRange, type DashboardData } from "@/lib/admin-stats";
import { product } from "./ornek";

/*
 * Panel ana sayfasi (docs/ADMIN-KULLANIM.md › 3). Hesap tek yerdedir: demo
 * modunda tarayicida, veritabani modunda sunucuda (UTC) calisir. Gunler
 * Turkiye saatiyle baslar; tarayiciya yalnizca ekranda gorunen gider.
 */

/** 07.11.2026 10:00 Turkiye saati */
const now = new Date("2026-11-07T10:00:00+03:00");

function order(id: string, createdAt: string, overrides: Partial<Order> = {}): Order {
  return {
    id,
    code: `SIP-2026-${id}`,
    userId: "u1",
    status: "preparing",
    customerName: "Deneme Kişi",
    email: "musteri@ornek.com",
    phone: "05551112233",
    shippingAddress: { city: "Konya" },
    items: [{ productId: "p1", productName: "Ürün", sku: "ZW", quantity: 1, unitPrice: 1200, unitPriceExVat: 1000, vatRate: 20 }],
    total: 1200,
    payment: { method: "card", installments: 1 },
    createdAt,
    ...overrides,
  } as Order;
}

const member = (id: string, createdAt: string): User =>
  ({ id, role: "individual", email: `${id}@ornek.com`, phone: "05559998877", firstName: "Ad", lastName: "Soyad", createdAt }) as User;

function data(overrides: Partial<DashboardData> = {}): DashboardData {
  return {
    products: [product()],
    categories: [],
    categoryGroups: [],
    retailers: [],
    dealers: [],
    retailerStock: [],
    dealerStock: [],
    settings: defaultSettings,
    orders: [],
    quotes: [],
    users: [],
    serviceRequests: [],
    warranties: [],
    events: [],
    news: [],
    ...overrides,
  };
}

describe("Dönem ve gün sınırları", () => {
  it("bilinmeyen seçim 30 gündür", () => {
    expect(parseRange(undefined)).toBe("30");
    expect(parseRange("yanlis")).toBe("30");
    expect(parseRange("7")).toBe("7");
  });

  it("gün Türkiye saatiyle 00:00'da başlar (sunucu UTC'de olsa da)", () => {
    // 06.11.2026 22:30 UTC = 07.11.2026 01:30 Türkiye saati: "Bugün" 7 Kasım'dır.
    const range = makeRange("today", new Date("2026-11-06T22:30:00Z"));
    expect(range.start).toBe(Date.parse("2026-11-07T00:00:00+03:00"));
    expect(range.end).toBe(Date.parse("2026-11-08T00:00:00+03:00"));
    expect(range.bins).toHaveLength(24);
    expect(range.bins[1].label).toBe("01:00");
  });

  it("7 gün: bugün dahil 7 günlük kırılım, etiketler Türkiye tarihidir", () => {
    const range = makeRange("7", now);
    expect(range.bins).toHaveLength(7);
    expect(range.start).toBe(Date.parse("2026-11-01T00:00:00+03:00"));
    expect(range.bins[0].label).toBe("1 Kas");
    expect(range.bins[6].longLabel).toBe("7 Kasım 2026");
  });

  it("Türkiye saatiyle gece 01:00'de verilen sipariş o günün sayılır", () => {
    const night = order("1", "2026-11-06T22:00:00Z"); // 07.11 01:00 Türkiye saati
    const yesterday = order("2", "2026-11-06T20:00:00Z"); // 06.11 23:00 Türkiye saati
    const s = dashboardSummary(data({ orders: [night, yesterday] }), "today", now);
    expect(s.charts.kpis.orders.value).toBe(1);
    expect(s.charts.revenueBins[1].orders).toBe(1);
  });
});

describe("Sonuç yalnızca ekranda görüneni taşır", () => {
  const quote = { id: "q1", code: "TKL-1", status: "new", companyName: "Firma", contactName: "Yetkili", email: "teklif@ornek.com", phone: "05550000000", createdAt: "2026-11-05T09:00:00Z" } as Quote;
  const s = dashboardSummary(
    data({ orders: [order("1", "2026-11-05T09:00:00Z")], users: [member("u1", "2026-11-05T09:00:00Z")], quotes: [quote] }),
    "30",
    now,
  );

  it("sayılar ve son kayıtlar hesaplanır", () => {
    expect(s.overview).toMatchObject({ orders: 1, openOrders: 1, users: 1, quotes: 1, newQuotes: 1, products: 1 });
    expect(s.recentOrders).toEqual([{ id: "1", code: "SIP-2026-1", customerName: "Deneme Kişi", total: 1200 }]);
    expect(s.recentQuotes).toEqual([{ id: "q1", code: "TKL-1", name: "Firma", createdAt: "2026-11-05T09:00:00Z" }]);
  });

  it("e-posta, telefon ve adres sonuca girmez", () => {
    const json = JSON.stringify(s);
    for (const secret of ["musteri@ornek.com", "u1@ornek.com", "teklif@ornek.com", "05551112233", "05559998877", "05550000000"]) {
      expect(json).not.toContain(secret);
    }
  });

  it("online satıcıda stoğu olmayan aktif ürünler sayılır, ilk 12'si listelenir", () => {
    const products = Array.from({ length: 14 }, (_, i) => product({ id: `p${i}`, name: `Ürün ${i}` }));
    const r = dashboardSummary(data({ products }), "30", now);
    expect(r.noOnlineStock.count).toBe(14);
    expect(r.noOnlineStock.first).toHaveLength(12);
    expect(r.noOnlineStock.first[0]).toEqual({ id: "p0", name: "Ürün 0" });
  });
});
