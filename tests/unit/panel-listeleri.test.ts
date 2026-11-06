import { describe, expect, it } from "vitest";
import type { Order, ProductReview, Quote, ReturnRequest, ServiceRequest, User, WarrantyRecord } from "@zenweld/data";
import { pageOf, pageWindow, searchFold, searchMatches } from "@zenweld/utils";
import { quoteCsvRows } from "@/lib/admin-csv";
import {
  matchingQuotes,
  matchingWarranties,
  orderListFilter,
  orderListPage,
  quoteListPage,
  returnListPage,
  reviewListFilter,
  reviewListPage,
  serviceListPage,
  warrantyListFilter,
  warrantyListPage,
} from "@/lib/admin-lists";

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

/* Asagidaki ornekler tests/db/panel-talepler.test.ts › "sayfalı listeler" ile aynidir. */

describe("Teklifler listesi (demo modu)", () => {
  const quotes = Array.from(
    { length: 53 },
    (_, i) =>
      ({
        id: `q${i + 1}`,
        code: `TKL-${String(i + 1).padStart(2, "0")}`,
        status: i + 1 <= 51 ? "new" : "won",
        createdAt: T0,
        items: [],
      }) as unknown as Quote,
  );

  it("50'şer, durum süzgeci; CSV süzgece uyanların tamamı", () => {
    const first = quoteListPage(quotes, { page: 1 });
    expect(first).toMatchObject({ total: 53, page: 1 });
    expect(first.rows[0].code).toBe("TKL-53");
    expect(quoteListPage(quotes, { page: 2 }).rows.map((q) => q.code)).toEqual(["TKL-03", "TKL-02", "TKL-01"]);
    expect(quoteListPage(quotes, { page: 1, status: "won" }).total).toBe(2);
    expect(matchingQuotes(quotes, { status: "new" })).toHaveLength(51);
    expect(quoteCsvRows([{ ...quotes[52], paymentPreference: "havale", companyName: "" } as Quote])[0]).toMatchObject({
      kod: "TKL-53",
      durum: "Kazanıldı",
      odeme: "Havale/EFT",
    });
  });
});

describe("Servis talepleri listesi (demo modu)", () => {
  it("sayfa ve yeni talep sayısı", () => {
    const requests = ["s1:new", "s2:done", "s3:new"].map((x) => {
      const [id, status] = x.split(":");
      return { id, code: `SRV-${id}`, status, createdAt: T0 } as ServiceRequest;
    });
    const page = serviceListPage(requests, 1);
    expect(page).toMatchObject({ total: 3, newCount: 2, page: 1 });
    expect(page.rows.map((r) => r.code)).toEqual(["SRV-s3", "SRV-s2", "SRV-s1"]);
  });
});

describe("Garantiler listesi (demo modu)", () => {
  const warranties = (
    [
      ["w1", "IŞIK Kaynak", "a@ornek.com", "2026-03-10", false],
      ["w2", "Deneme", "yonetici@ornek.com", "2026-03-11", true],
      ["w3", "Başka", "b@ornek.com", "2028-01-01", false],
    ] as const
  ).map(
    ([id, ownerName, email, expiresAt, extended]) =>
      ({ id, serialNumber: `ZW-${id}`, ownerName, email, expiresAt, extended, registeredAt: T0 }) as WarrantyRecord,
  );
  const users = [
    { email: "A@ornek.com", role: "individual" },
    { email: "yonetici@ornek.com", role: "admin" },
  ] as User[];
  const today = "2026-03-11";

  it("adresteki süzgeç; bilinmeyen durum yok sayılır", () => {
    expect(warrantyListFilter((n) => ({ durum: "expired", ara: "x" })[n], today)).toEqual({ q: "x", state: "expired", today, page: 1 });
    expect(warrantyListFilter((n) => ({ durum: "yok" })[n], today).state).toBeUndefined();
  });

  it("geçerli / süresi dolan / uzatılmış, Türkçe arama, sayfadaki üyeler (yönetici sayılmaz)", () => {
    expect(warrantyListPage(warranties, users, { page: 1, today })).toMatchObject({ total: 3, all: 3, valid: 2, members: ["a@ornek.com"] });
    const ids = (filter: Parameters<typeof matchingWarranties>[1]) => matchingWarranties(warranties, filter).map((w) => w.id);
    expect(ids({ today, state: "expired" })).toEqual(["w1"]);
    expect(ids({ today, state: "valid" })).toEqual(["w3", "w2"]);
    expect(ids({ today, state: "extended" })).toEqual(["w2"]);
    for (const q of ["ışık", "IŞIK", "işık"]) expect(ids({ today, q }), q).toEqual(["w1"]);
    expect(ids({ today, q: "zw-w3" })).toEqual(["w3"]);
  });
});

describe("Yorumlar listesi (demo modu)", () => {
  const reviews = (
    [
      ["r1", "Çok IŞIKLI ekran", true],
      ["r2", "Güzel", true],
      ["r3", "Bekliyor", false],
    ] as const
  ).map(([id, body, approved]) => ({ id, body, approved, authorName: "Kişi", createdAt: T0 }) as ProductReview);

  it("onay bekleyenler adreste (?bekleyen=1); arama; sayılar", () => {
    expect(reviewListFilter((n) => ({ bekleyen: "1" })[n])).toEqual({ q: undefined, pending: true, page: 1 });
    const all = reviewListPage(reviews, 1, { page: 1 });
    expect(all).toMatchObject({ total: 3, pendingCount: 1, featuredCount: 1 });
    expect(all.rows.map((r) => r.id)).toEqual(["r3", "r2", "r1"]);
    expect(reviewListPage(reviews, 1, { page: 1, pending: true }).rows.map((r) => r.id)).toEqual(["r3"]);
    expect(reviewListPage(reviews, 1, { page: 1, q: "ışıklı" }).rows.map((r) => r.id)).toEqual(["r1"]);
  });
});
