import { describe, expect, it } from "vitest";
import type { Order, ReturnRequest } from "@zenweld/data";
import { pageOf, pageWindow, searchFold, searchMatches } from "@zenweld/utils";
import { orderListFilter, orderListPage, returnListPage } from "@/lib/admin-lists";

/*
 * Panel listeleri (docs/ADMIN-KULLANIM.md › 2. Ortak davranışlar › Uzun
 * listeler). Demo modunda bu kurallar tarayıcıda, veritabanı modunda aynı
 * kurallar SQL'de çalışır (tests/db/panel-satis.test.ts aynı örneği dener).
 */

describe("Türkçe arama", () => {
  it("I / İ / ı / i aynı harf; diğer Türkçe harfler kendisi", () => {
    expect(searchFold("ISPARTA")).toBe("isparta");
    expect(searchFold("ısparta")).toBe("isparta");
    expect(searchFold("İstanbul")).toBe("istanbul");
    expect(searchFold("IŞIK")).toBe(searchFold("ışık"));
    expect(searchFold("ÇAĞRI ŞÖĞÜ")).toBe("çağri şöğü");
  });

  it("alanlardan biri içeriyorsa bulunur; boş arama her şeyi bulur", () => {
    expect(searchMatches("ışık", ["Deneme", "IŞIK Kaynak"])).toBe(true);
    expect(searchMatches("isik", ["IŞIK Kaynak"])).toBe(false);
    expect(searchMatches("  ", ["x"])).toBe(true);
    expect(searchMatches("a", [undefined, null])).toBe(false);
  });
});

describe("Sayfa hesabı", () => {
  it("50'şer; son sayfadan büyük sayfa son sayfadır; boş liste 1. sayfa", () => {
    expect(pageWindow(55, 1)).toEqual({ page: 1, pageCount: 2, offset: 0, limit: 50 });
    expect(pageWindow(55, 9)).toMatchObject({ page: 2, offset: 50 });
    expect(pageWindow(0, 3)).toMatchObject({ page: 1, pageCount: 1, offset: 0 });
    expect(pageWindow(10, -2)).toMatchObject({ page: 1 });
    expect(pageOf([1, 2, 3], 1, 2)).toEqual({ rows: [1, 2], total: 3, page: 1 });
  });
});

const T0 = "2026-03-10T09:00:00.000Z";
const order = (n: number, overrides: Partial<Order> = {}): Order =>
  ({
    id: `o${String(n).padStart(2, "0")}`,
    code: `SIP-o${String(n).padStart(2, "0")}`,
    status: n <= 52 ? "preparing" : "delivered",
    customerName: "Ad Soyad",
    email: "a@ornek.com",
    invoice: {},
    createdAt: T0,
    ...overrides,
  }) as Order;

describe("Siparişler listesi (demo modu)", () => {
  const orders = Array.from({ length: 55 }, (_, i) =>
    i + 1 === 7 ? order(7, { customerName: "IŞIK Kaynak", invoice: { companyName: "Isparta Ltd" } as Order["invoice"] }) : order(i + 1),
  );

  it("adresteki süzgeçler okunur; bilinmeyen durum yok sayılır", () => {
    const params = new URLSearchParams("durum=delivered&ara=ışık&sayfa=2");
    expect(orderListFilter((n) => params.get(n) ?? undefined)).toEqual({ status: "delivered", q: "ışık", page: 2 });
    expect(orderListFilter((n) => ({ durum: "yok" })[n])).toEqual({ status: undefined, q: undefined, page: 1 });
  });

  it("veritabanı moduyla aynı: sıra, sayfa, durum sayıları, arama", () => {
    const first = orderListPage(orders, { page: 1 });
    expect(first).toMatchObject({ total: 55, page: 1, all: 55 });
    expect(first.counts).toEqual({ awaiting_payment: 0, preparing: 52, shipped: 0, delivered: 3, cancelled: 0 });
    expect(first.rows).toHaveLength(50);
    expect(first.rows[0].id).toBe("o55");

    const last = orderListPage(orders, { page: 9 });
    expect(last.page).toBe(2);
    expect(last.rows.map((o) => o.id)).toEqual(["o05", "o04", "o03", "o02", "o01"]);

    expect(orderListPage(orders, { page: 1, status: "delivered" }).total).toBe(3);
    for (const q of ["ışık", "IŞIK", "işık", "ısparta", "ISPARTA", "isparta"]) {
      const found = orderListPage(orders, { page: 1, q });
      expect(found.rows.map((o) => o.id), q).toEqual(["o07"]);
      expect(found.counts.preparing, q).toBe(52);
    }
    expect(orderListPage(orders, { page: 1, q: "%" }).total).toBe(0);
  });
});

describe("İade talepleri listesi (demo modu)", () => {
  it("yeniden eskiye; yeni talep sayısı", () => {
    const requests = [
      { id: "r1", code: "IAD-r1", status: "new", createdAt: "2026-03-11T09:00:00Z" },
      { id: "r2", code: "IAD-r2", status: "approved", createdAt: "2026-03-12T09:00:00Z" },
    ] as ReturnRequest[];
    const page = returnListPage(requests, 1);
    expect(page).toMatchObject({ total: 2, page: 1, newCount: 1 });
    expect(page.rows.map((r) => r.id)).toEqual(["r2", "r1"]);
  });
});
