import { describe, expect, it } from "vitest";
import {
  canRequestReturn,
  returnDeadline,
  returnableQuantities,
  type Order,
  type ReturnRequest,
  type User,
} from "@zenweld/data";
import { createReturnRequest, mutate, saveReturnRequest } from "@zenweld/store";

/* docs/IS-KURALLARI.md › İade (cayma) talebi, KARARLAR K-65 */

const delivered = new Date(2026, 2, 10, 15, 0); // 10.03.2026 15:00

function order(overrides: Partial<Order> = {}): Order {
  return {
    id: "o-iade",
    code: "SIP-2026-99999",
    userId: "u-iade",
    status: "delivered",
    customerName: "Deneme Kişi",
    email: "iade@ornek.com",
    phone: "05551112233",
    items: [
      { productId: "p1", productName: "Torç", sku: "ZW-TORC", quantity: 2, unitPrice: 1200, unitPriceExVat: 1000, vatRate: 20 },
      { productId: "p2", productName: "Maske", sku: "ZW-MASK", quantity: 1, unitPrice: 600, unitPriceExVat: 500, vatRate: 20 },
    ],
    shipment: { carrier: "Kargo", trackingNumber: "1", shippedAt: delivered.toISOString(), deliveredAt: delivered.toISOString() },
    history: [{ status: "delivered", at: delivered.toISOString() }],
    ...overrides,
  } as Order;
}

const request = (overrides: Partial<ReturnRequest> = {}): ReturnRequest =>
  ({
    id: "r1",
    orderId: "o-iade",
    status: "new",
    items: [{ line: 0, productId: "p1", productName: "Torç", sku: "ZW-TORC", quantity: 1 }],
    ...overrides,
  }) as ReturnRequest;

describe("İade süresi", () => {
  it("son gün: teslim günü + 14 gün, o günün sonu", () => {
    expect(returnDeadline(order())).toEqual(new Date(2026, 2, 24, 23, 59, 59, 999));
  });

  it("14. günün sonuna kadar talep açılır, ertesi gün açılmaz", () => {
    expect(canRequestReturn(order(), "individual", [], new Date(2026, 2, 24, 23, 59))).toBe(true);
    expect(canRequestReturn(order(), "individual", [], new Date(2026, 2, 25, 0, 0, 1))).toBe(false);
  });

  it("teslim tarihi kargo kaydında yoksa durum geçmişinden okunur", () => {
    const noShipment = order({ shipment: undefined });
    expect(returnDeadline(noShipment)).toEqual(new Date(2026, 2, 24, 23, 59, 59, 999));
  });
});

describe("Kim, hangi siparişte talep açabilir", () => {
  const during = new Date(2026, 2, 12);

  it("yalnızca bireysel üye; kurumsal üyede yok", () => {
    expect(canRequestReturn(order(), "individual", [], during)).toBe(true);
    expect(canRequestReturn(order(), "business", [], during)).toBe(false);
  });

  it("yalnızca teslim edilmiş siparişte", () => {
    expect(canRequestReturn(order({ status: "shipped" }), "individual", [], during)).toBe(false);
  });

  it("açık talep (Yeni, İnceleniyor) varken yeni talep açılmaz", () => {
    expect(canRequestReturn(order(), "individual", [request({ status: "new" })], during)).toBe(false);
    expect(canRequestReturn(order(), "individual", [request({ status: "reviewing" })], during)).toBe(false);
  });

  it("reddedilen talepten sonra yeniden açılır; reddedilen adetler iade edilebilir kalır", () => {
    const rejected = request({ status: "rejected", items: [{ line: 0, quantity: 2 } as ReturnRequest["items"][0]] });
    expect(canRequestReturn(order(), "individual", [rejected], during)).toBe(true);
    expect(returnableQuantities(order(), [rejected])).toEqual([2, 1]);
  });

  it("onaylanan adetler düşer; bütün ürünler iade edildiyse talep açılmaz", () => {
    const partly = request({ status: "approved" });
    expect(returnableQuantities(order(), [partly])).toEqual([1, 1]);
    expect(canRequestReturn(order(), "individual", [partly], during)).toBe(true);
    const all = request({
      status: "approved",
      items: [
        { line: 0, quantity: 2 } as ReturnRequest["items"][0],
        { line: 1, quantity: 1 } as ReturnRequest["items"][0],
      ],
    });
    expect(canRequestReturn(order(), "individual", [all], during)).toBe(false);
  });
});

describe("İade talebi kaydı", () => {
  // Tarayicisiz veritabanina, simdi teslim edilmis bir siparis ve uye eklenir.
  const now = new Date().toISOString();
  const member = { id: "u-iade", role: "individual", email: "iade@ornek.com" } as User;
  mutate((db) => {
    db.users.push(member, { ...member, id: "u-firma", role: "business", email: "firma@ornek.com" });
    db.orders.push(
      order({ shipment: undefined, history: [{ status: "delivered", at: now }] }),
      order({ id: "o-firma", userId: "u-firma", shipment: undefined, history: [{ status: "delivered", at: now }] }),
    );
  });
  const input = {
    orderId: "o-iade",
    orderCode: "SIP-2026-99999",
    userId: "u-iade",
    customerName: "Deneme Kişi",
    email: "iade@ornek.com",
    phone: "05551112233",
    items: [{ line: 0, productId: "p1", productName: "Torç", sku: "ZW-TORC", quantity: 1 }],
    reason: "defective" as const,
  };

  it("numara IAD-<yıl>-<4 hane>, durum Yeni", () => {
    const created = createReturnRequest(input);
    expect(created).not.toBe(false);
    if (!created) return;
    expect(created.code).toMatch(new RegExp(`^IAD-${new Date().getFullYear()}-\\d{4}$`));
    expect(created.status).toBe("new");

    // Acik talep varken ikincisi acilmaz; reddedilince acilir.
    expect(createReturnRequest(input)).toBe(false);
    saveReturnRequest({ ...created, status: "rejected" });
    expect(createReturnRequest(input)).not.toBe(false);
  });

  it("siparişteki adetten fazlası, başkasının siparişi ve kurumsal üye reddedilir", () => {
    mutate((db) => {
      db.returnRequests = db.returnRequests.filter((r) => r.orderId !== "o-iade");
    });
    expect(createReturnRequest({ ...input, items: [{ ...input.items[0], quantity: 3 }] })).toBe(false);
    expect(createReturnRequest({ ...input, items: [] })).toBe(false);
    expect(createReturnRequest({ ...input, userId: "u-firma" })).toBe(false);
    expect(createReturnRequest({ ...input, orderId: "o-firma", userId: "u-firma" })).toBe(false);
  });
});
