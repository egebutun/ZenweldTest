import { describe, expect, it } from "vitest";
import {
  cartTotals,
  couponStatus,
  couponUsageCount,
  couponView,
  evaluateCoupon,
  installmentQuote,
  normalizeCouponCode,
  validateCoupon,
  type Coupon,
  type CouponRedemption,
} from "@zenweld/data";
import { shop } from "./ornek";

/* docs/IS-KURALLARI.md › 21. Kuponlar (KARARLAR K-85) */

const NOW = new Date("2026-11-02T12:00:00Z");

function coupon(overrides: Partial<Coupon> = {}): Coupon {
  return {
    id: "k1",
    code: "INDIRIM10",
    discountType: "percent",
    discountValue: 10,
    scope: "all",
    productIds: [],
    categoryIds: [],
    audience: "all",
    customerEmails: [],
    active: true,
    createdAt: "2026-10-01T00:00:00Z",
    updatedAt: "2026-10-01T00:00:00Z",
    ...overrides,
  };
}

function used(couponId: string, userId: string, releasedAt?: string): CouponRedemption {
  return {
    id: `r-${Math.random()}`,
    couponId,
    couponCode: "X",
    userId,
    orderId: `o-${Math.random()}`,
    discountAmount: 100,
    createdAt: "2026-10-10T00:00:00Z",
    releasedAt,
  };
}

const line = (productId: string, totalIncVat: number, categoryId = "kat-a") => ({ productId, categoryId, totalIncVat });
const at = { redemptions: [] as CouponRedemption[], at: NOW };

describe("Kupon kodu", () => {
  it("boşluk atılır, büyük harfe çevrilir; Türkçe klavyedeki İ ve ı da I olur", () => {
    expect(normalizeCouponCode(" hosgeldin 5 ")).toBe("HOSGELDIN5");
    expect(normalizeCouponCode("HOSGELDİN5")).toBe("HOSGELDIN5");
    expect(normalizeCouponCode("hosgeldın5")).toBe("HOSGELDIN5");
  });

  it("panelde 3–30 karakter; harf (Türkçe karakter olmadan), rakam ve tire", () => {
    expect(validateCoupon(coupon({ code: "YAZ-2026" }))).toBeNull();
    expect(validateCoupon(coupon({ code: "AB" }))).toMatch(/3–30/);
    expect(validateCoupon(coupon({ code: "İNDİRİM" }))).toBeNull();
    expect(validateCoupon(coupon({ code: "ŞUBAT" }))).toMatch(/Türkçe karakter/);
  });
});

describe("Kuponun panelde girilmesi", () => {
  it("yüzde 1–100, TL en az 1; ikisi de tam sayı", () => {
    expect(validateCoupon(coupon({ discountValue: 100 }))).toBeNull();
    expect(validateCoupon(coupon({ discountValue: 101 }))).toMatch(/%1 ile %100/);
    expect(validateCoupon(coupon({ discountValue: 2.5 }))).toMatch(/tam sayı/);
    expect(validateCoupon(coupon({ discountType: "amount", discountValue: 25000 }))).toBeNull();
    expect(validateCoupon(coupon({ discountType: "amount", discountValue: 0 }))).toMatch(/en az 1 ₺/);
  });

  it("bitiş başlangıçtan sonra; sınırlar en az 1", () => {
    expect(
      validateCoupon(coupon({ startsAt: "2026-11-10T00:00:00Z", endsAt: "2026-11-01T00:00:00Z" })),
    ).toMatch(/Bitiş/);
    expect(validateCoupon(coupon({ totalUsageLimit: 0 }))).toMatch(/Kullanım sınırları/);
    expect(validateCoupon(coupon({ perUserLimit: 1 }))).toBeNull();
  });

  it("kişiye özel kuponda en az bir geçerli e-posta adresi olur", () => {
    expect(validateCoupon(coupon({ audience: "customers" }))).toMatch(/en az bir e-posta/);
    expect(validateCoupon(coupon({ audience: "customers", customerEmails: ["ali@firma"] }))).toMatch(/Geçersiz e-posta/);
    expect(validateCoupon(coupon({ audience: "customers", customerEmails: ["ali@firma.com"] }))).toBeNull();
  });

  it("belirli ürünler için olan kuponda en az bir ürün ya da kategori seçilir", () => {
    expect(validateCoupon(coupon({ scope: "targets" }))).toMatch(/en az bir ürün/);
    expect(validateCoupon(coupon({ scope: "targets", categoryIds: ["kat-a"] }))).toBeNull();
  });
});

describe("Kuponun durumu ve kullanım sayısı", () => {
  it("pasif, planlandı, süresi doldu, sınır doldu, geçerli", () => {
    expect(couponStatus(coupon({ active: false }), 0, NOW)).toBe("inactive");
    expect(couponStatus(coupon({ startsAt: "2026-11-10T00:00:00Z" }), 0, NOW)).toBe("scheduled");
    expect(couponStatus(coupon({ endsAt: "2026-11-01T00:00:00Z" }), 0, NOW)).toBe("expired");
    expect(couponStatus(coupon({ totalUsageLimit: 3 }), 3, NOW)).toBe("exhausted");
    expect(couponStatus(coupon({ totalUsageLimit: 3 }), 2, NOW)).toBe("active");
  });

  it("iptal edilen siparişteki kullanım sayılmaz", () => {
    const list = [used("k1", "u1"), used("k1", "u2"), used("k1", "u1", "2026-10-11T00:00:00Z"), used("k2", "u1")];
    expect(couponUsageCount("k1", list)).toBe(2);
    expect(couponUsageCount("k1", list, "u1")).toBe(1);
  });
});

describe("Kuponun sepete uygulanması", () => {
  it("örnek: %10, bütün ürünler; 6.000 + 4.000 ₺ → 1.000 ₺ indirim, satırlara 600 ve 400", () => {
    const r = evaluateCoupon(coupon(), [line("a", 6000), line("b", 4000)], at);
    expect(r).toMatchObject({ ok: true, discount: 1000, lineDiscounts: [600, 400] });
  });

  it("indirim tam liraya yuvarlanır; satır payları kuruşa yuvarlanıp toplama eşit kalır", () => {
    const r = evaluateCoupon(coupon({ discountValue: 7 }), [line("a", 1001), line("b", 1001), line("c", 1001)], at);
    expect(r.ok && r.discount).toBe(210); // 3003 × %7 = 210,21
    if (!r.ok) throw new Error();
    expect(r.lineDiscounts).toEqual([70, 70, 70]);
    expect(r.lineDiscounts.reduce((s, d) => s + d, 0)).toBe(210);
  });

  it("örnek: 500 ₺ kupon yalnızca bir kategoride; o kategoriden 300 ₺'lik ürün var → indirim 300 ₺", () => {
    const r = evaluateCoupon(
      coupon({ discountType: "amount", discountValue: 500, scope: "targets", categoryIds: ["kat-b"] }),
      [line("a", 5000, "kat-a"), line("b", 300, "kat-b")],
      at,
    );
    expect(r).toMatchObject({ ok: true, discount: 300, lineDiscounts: [0, 300] });
  });

  it("seçilen ürüne uygulanır; yüzde yalnızca uyan satırların toplamından", () => {
    const r = evaluateCoupon(
      coupon({ scope: "targets", productIds: ["b"] }),
      [line("a", 6000), line("b", 4000)],
      at,
    );
    expect(r).toMatchObject({ ok: true, discount: 400, lineDiscounts: [0, 400] });
  });

  it("sepette uyan ürün yoksa kabul edilmez", () => {
    const r = evaluateCoupon(coupon({ scope: "targets", productIds: ["z"] }), [line("a", 6000)], at);
    expect(r).toMatchObject({ ok: false, problem: "noEligible" });
  });

  it("en az sepet tutarı bütün ürünlerin toplamına bakar (kupon ve kargo hariç)", () => {
    const c = coupon({ minCartTotal: 10000, scope: "targets", productIds: ["b"] });
    expect(evaluateCoupon(c, [line("a", 6000), line("b", 4000)], at).ok).toBe(true);
    expect(evaluateCoupon(c, [line("a", 5999), line("b", 4000)], at)).toMatchObject({ ok: false, problem: "minTotal" });
  });

  it("kod yok ya da pasifse geçersiz; süre ve sınır sorunları ayrı söylenir", () => {
    expect(evaluateCoupon(undefined, [line("a", 100)], at)).toMatchObject({ ok: false, problem: "invalid" });
    expect(evaluateCoupon(coupon({ active: false }), [line("a", 100)], at)).toMatchObject({ problem: "invalid" });
    expect(evaluateCoupon(coupon({ endsAt: "2026-11-01T00:00:00Z" }), [line("a", 100)], at)).toMatchObject({
      problem: "expired",
    });
    expect(
      evaluateCoupon(coupon({ totalUsageLimit: 1 }), [line("a", 100)], { ...at, redemptions: [used("k1", "u9")] }),
    ).toMatchObject({ problem: "exhausted" });
  });

  it("kişi başı sınır üye bilinince denetlenir; iptal edilen sipariş hakkı geri verir", () => {
    const c = coupon({ perUserLimit: 1 });
    const redemptions = [used("k1", "u1")];
    expect(evaluateCoupon(c, [line("a", 100)], { redemptions, userId: "u1", at: NOW })).toMatchObject({
      problem: "userLimit",
    });
    expect(evaluateCoupon(c, [line("a", 100)], { redemptions, userId: "u2", at: NOW }).ok).toBe(true);
    expect(evaluateCoupon(c, [line("a", 100)], { redemptions, at: NOW }).ok).toBe(true);
    const released = [used("k1", "u1", "2026-10-11T00:00:00Z")];
    expect(evaluateCoupon(c, [line("a", 100)], { redemptions: released, userId: "u1", at: NOW }).ok).toBe(true);
  });
});

describe("Kişiye özel kupon (KARARLAR K-86)", () => {
  const personal = coupon({ audience: "customers", customerEmails: ["ali@firma.com"] });

  it("yalnızca tanımlı e-postayla giriş yapan üyeye uygulanır; büyük/küçük harf fark etmez", () => {
    const lines = [line("a", 1000)];
    expect(evaluateCoupon(personal, lines, { ...at, userId: "u1", userEmail: "Ali@Firma.com" }).ok).toBe(true);
    expect(evaluateCoupon(personal, lines, { ...at, userId: "u2", userEmail: "veli@firma.com" })).toMatchObject({
      ok: false,
      problem: "notForYou",
    });
  });

  it("sepette ziyaretçiye uygulanır; e-posta ödeme adımında denetlenir", () => {
    expect(evaluateCoupon(personal, [line("a", 1000)], at).ok).toBe(true);
  });

  it("süresi dolmuş kişiye özel kuponda önce süre söylenir", () => {
    const expired = { ...personal, endsAt: "2026-11-01T00:00:00Z" };
    expect(evaluateCoupon(expired, [line("a", 1000)], { ...at, userEmail: "veli@firma.com" })).toMatchObject({
      problem: "expired",
    });
  });
});

describe("Kuponlu sepet toplamları", () => {
  const settings = shop({ freeShippingThreshold: 5000, shippingFee: 250 });

  it("örnek: sınır 5.000 ₺, sepet 5.200 ₺, kupon 300 ₺ → 4.900 ₺, kargo 250 ₺, toplam 5.150 ₺", () => {
    const totals = cartTotals({ lines: [{ totalIncVat: 5200, totalExVat: 4333 }], lineDiscounts: [300] }, settings);
    expect(totals).toMatchObject({
      subtotal: 5200,
      couponDiscount: 300,
      shipping: 250,
      remainingForFreeShipping: 100,
      total: 5150,
    });
  });

  it("örnek: KDV dahil 6.000 ₺ (KDV 1.000 ₺), %10 kupon → indirim 600 ₺, KDV 900 ₺", () => {
    const totals = cartTotals({ lines: [{ totalIncVat: 6000, totalExVat: 5000 }], lineDiscounts: [600] }, settings);
    expect(totals).toMatchObject({ subtotal: 6000, couponDiscount: 600, vat: 900, shipping: 0, total: 5400 });
  });

  it("örnek: vade farkı kuponlu toplamdan; 5.150 ₺, 6 taksit %4,5 → 232 ₺, ödenecek 5.382 ₺", () => {
    const totals = cartTotals({ lines: [{ totalIncVat: 5200, totalExVat: 4333 }], lineDiscounts: [300] }, settings);
    expect(installmentQuote(totals.total, { count: 6, ratePercent: 4.5, enabled: true })).toMatchObject({
      fee: 232,
      grandTotal: 5382,
    });
  });
});

/* Veritabani modunda tarayiciya giden kupon sonucu (Asama 5.2) */
describe("Kupon sonucunun tarayıcıya giden hali", () => {
  it("kuponun kendisi (kişiye özel kuponun e-postaları) gitmez; yalnızca indirim ya da neden", () => {
    const personal = coupon({ audience: "customers", customerEmails: ["gizli@ornek.com"], discountType: "amount", discountValue: 100 });
    const ok = couponView(evaluateCoupon(personal, [{ productId: "a", totalIncVat: 1000 }], { redemptions: [], at: NOW }));
    expect(ok).toEqual({ ok: true, couponId: "k1", code: "INDIRIM10", discount: 100, lineDiscounts: [100], personal: true });
    expect(JSON.stringify(ok)).not.toContain("gizli@ornek.com");

    const low = couponView(
      evaluateCoupon(coupon({ minCartTotal: 5000 }), [{ productId: "a", totalIncVat: 1000 }], { redemptions: [], at: NOW }),
    );
    expect(low).toEqual({ ok: false, problem: "minTotal", minCartTotal: 5000 });
  });
});
