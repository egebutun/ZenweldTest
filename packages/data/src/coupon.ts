import type { Coupon, CouponRedemption } from "./types";

/**
 * KUPON KURALLARI — TEK KAYNAK (KARARLAR K-85, IS-KURALLARI › 21)
 *
 * Sepet, odeme sayfasi ve siparis kaydi ayni fonksiyonlari kullanir; boylece
 * musterinin gordugu indirim ile kaydedilen indirim hep aynidir. Canlida
 * sunucu da siparis aninda ayni hesabi yeniden yapar; tarayicidan gelen
 * tutara guvenilmez (YAPILACAKLAR › Kuponlar).
 *
 * - Kupon kampanyali fiyatin ustune uygulanir; kargoya uygulanmaz.
 * - Sipariste tek kupon.
 * - Indirim tam liraya yuvarlanir.
 */

export const COUPON_CODE_PATTERN = /^[A-Z0-9-]{3,30}$/;

/**
 * Kodu karsilastirma bicimine cevirir: bosluksuz, buyuk harf. Turkce
 * klavyede buyuk "i" ile yazilan "İ" ve "ı" da "I" olur.
 */
export function normalizeCouponCode(code: string): string {
  return code.replace(/\s+/g, "").replace(/[İı]/g, "I").toUpperCase();
}

/** E-postanin karsilastirma bicimi: bosluksuz, kucuk harf. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Kisiye ozel kupon bu e-postaya tanimli mi (herkese aciksa her zaman evet).
 * Iki taraf da karsilastirma bicimine cevrilir; kayittaki adres buyuk harfle
 * girilmis olsa da eslesir.
 */
export function couponAllowsEmail(coupon: Pick<Coupon, "audience" | "customerEmails">, email: string): boolean {
  const key = normalizeEmail(email);
  return coupon.audience === "all" || coupon.customerEmails.some((e) => normalizeEmail(e) === key);
}

export type CouponStatus = "active" | "scheduled" | "expired" | "exhausted" | "inactive";

/**
 * Kuponun kullanim sayisi; userId verilirse yalnizca o uyenin. Iptal edilen
 * siparisteki kullanim (releasedAt) sayilmaz.
 */
export function couponUsageCount(couponId: string, redemptions: CouponRedemption[], userId?: string): number {
  return redemptions.filter(
    (r) => r.couponId === couponId && !r.releasedAt && (userId === undefined || r.userId === userId),
  ).length;
}

/** Kuponun verilen andaki durumu; used: gecerli kullanim sayisi. */
export function couponStatus(coupon: Coupon, used: number, at: Date = new Date()): CouponStatus {
  if (!coupon.active) return "inactive";
  const now = at.getTime();
  if (coupon.endsAt && now > new Date(coupon.endsAt).getTime()) return "expired";
  if (coupon.startsAt && now < new Date(coupon.startsAt).getTime()) return "scheduled";
  if (coupon.totalUsageLimit && used >= coupon.totalUsageLimit) return "exhausted";
  return "active";
}

export type CouponDraft = Omit<Coupon, "id" | "createdAt" | "updatedAt">;

/**
 * Kayittan once kuponun bicimi (panel; demo ve veritabani modu ayni): kod
 * buyuk harfe cevrilir, ad kirpilir, tekrarlar atilir. Butun urunler icin
 * olan kuponda secili urun ve kategoriler, herkese acik kuponda e-postalar
 * silinir; e-postalar kucuk harfe cevrilir.
 */
export function normalizeCouponDraft(d: CouponDraft): CouponDraft {
  return {
    ...d,
    code: normalizeCouponCode(d.code),
    name: d.name?.trim() || undefined,
    productIds: d.scope === "all" ? [] : [...new Set(d.productIds)],
    categoryIds: d.scope === "all" ? [] : [...new Set(d.categoryIds)],
    customerEmails: d.audience === "all" ? [] : [...new Set(d.customerEmails.map(normalizeEmail).filter(Boolean))],
  };
}

/** Kod baska kuponda kullaniliyorsa gosterilen hata. */
export const couponCodeTaken = (code: string) => `"${code}" kodu başka bir kuponda kullanılıyor.`;

const isPositiveInt = (n: number | undefined) => n === undefined || (Number.isInteger(n) && n >= 1);

/** Panelde girilen kuponu dogrular; sorun yoksa null. Kodun tekrarini kayit katmani denetler. */
export function validateCoupon(c: CouponDraft): string | null {
  if (!COUPON_CODE_PATTERN.test(normalizeCouponCode(c.code))) {
    return "Kupon kodu 3–30 karakter olmalıdır; yalnızca Türkçe karakter içermeyen harf, rakam ve tire kullanılabilir.";
  }
  if (c.discountType === "percent") {
    if (!Number.isInteger(c.discountValue) || c.discountValue < 1 || c.discountValue > 100) {
      return "İndirim oranı %1 ile %100 arasında tam sayı olmalıdır.";
    }
  } else if (!Number.isInteger(c.discountValue) || c.discountValue < 1) {
    return "İndirim tutarı en az 1 ₺ ve tam sayı olmalıdır.";
  }
  if (c.minCartTotal !== undefined && !(Number.isFinite(c.minCartTotal) && c.minCartTotal >= 0)) {
    return "En az sepet tutarı 0 ya da daha büyük olmalıdır.";
  }
  if (c.startsAt && c.endsAt && new Date(c.endsAt) <= new Date(c.startsAt)) {
    return "Bitiş, başlangıçtan sonra olmalıdır.";
  }
  if (!isPositiveInt(c.totalUsageLimit) || !isPositiveInt(c.perUserLimit)) {
    return "Kullanım sınırları en az 1 ve tam sayı olmalıdır (sınırsız için boş bırakın).";
  }
  if (c.scope === "targets" && c.productIds.length + c.categoryIds.length === 0) {
    return "Kupon belirli ürünler içinse en az bir ürün ya da kategori seçilmelidir.";
  }
  if (c.audience === "customers") {
    if (c.customerEmails.length === 0) return "Kişiye özel kupon için en az bir e-posta adresi eklenmelidir.";
    const wrong = c.customerEmails.find((e) => !EMAIL_PATTERN.test(e));
    if (wrong) return `Geçersiz e-posta adresi: ${wrong}`;
  }
  return null;
}

/** Kupon hesabina giren sepet satiri. */
export interface CouponCartLine {
  productId: string;
  /** Urunun kategorisinin kimligi (Category.id) */
  categoryId?: string;
  /** Satir tutari: kampanya uygulanmis, KDV dahil */
  totalIncVat: number;
}

/**
 * Kuponun neden uygulanmadigi. invalid: kod yok ya da kupon pasif;
 * notForYou: kisiye ozel kupon giris yapan uyenin e-postasina tanimli degil.
 */
export type CouponProblem =
  | "invalid"
  | "scheduled"
  | "expired"
  | "exhausted"
  | "notForYou"
  | "userLimit"
  | "minTotal"
  | "noEligible";

export type CouponResult =
  | {
      ok: true;
      coupon: Coupon;
      /** Toplam indirim (KDV dahil, tam lira) */
      discount: number;
      /** Indirimin satirlara dusen payi (lines ile ayni sirada; kurus) */
      lineDiscounts: number[];
    }
  | { ok: false; coupon?: Coupon; problem: CouponProblem };

/** Satir kupona uyuyor mu (kapsam: butun urunler ya da secilen urun/kategoriler). */
export function couponAppliesTo(coupon: Coupon, line: Pick<CouponCartLine, "productId" | "categoryId">): boolean {
  if (coupon.scope === "all") return true;
  return (
    coupon.productIds.includes(line.productId) ||
    (line.categoryId !== undefined && coupon.categoryIds.includes(line.categoryId))
  );
}

/**
 * Kuponu sepete uygular.
 *
 * - En az sepet tutari, butun urunlerin toplamina bakar (kargo ve kupon haric).
 * - Yuzdelik kupon uyan urunlerin toplamina uygulanir; TL kupon bir kez
 *   dusulur ve uyan urunlerin toplamini gecemez.
 * - Kisiye ozel kuponun e-postasi ve kisi basi sinir yalnizca uye bilinince
 *   denetlenir (sepette ziyaretci olabilir; odemede uye bellidir).
 */
export function evaluateCoupon(
  coupon: Coupon | undefined,
  lines: CouponCartLine[],
  {
    redemptions,
    userId,
    userEmail,
    at = new Date(),
  }: { redemptions: CouponRedemption[]; userId?: string; userEmail?: string; at?: Date },
): CouponResult {
  if (!coupon) return { ok: false, problem: "invalid" };
  const status = couponStatus(coupon, couponUsageCount(coupon.id, redemptions), at);
  if (status === "inactive") return { ok: false, coupon, problem: "invalid" };
  if (status !== "active") return { ok: false, coupon, problem: status };
  if (userEmail !== undefined && !couponAllowsEmail(coupon, userEmail)) {
    return { ok: false, coupon, problem: "notForYou" };
  }
  if (coupon.perUserLimit && userId && couponUsageCount(coupon.id, redemptions, userId) >= coupon.perUserLimit) {
    return { ok: false, coupon, problem: "userLimit" };
  }

  const productTotal = lines.reduce((sum, l) => sum + l.totalIncVat, 0);
  if (coupon.minCartTotal && productTotal < coupon.minCartTotal) {
    return { ok: false, coupon, problem: "minTotal" };
  }

  const eligible = lines.map((l) => couponAppliesTo(coupon, l) && l.totalIncVat > 0);
  const eligibleTotal = lines.reduce((sum, l, i) => (eligible[i] ? sum + l.totalIncVat : sum), 0);
  if (eligibleTotal <= 0) return { ok: false, coupon, problem: "noEligible" };

  const raw =
    coupon.discountType === "percent"
      ? Math.round((eligibleTotal * coupon.discountValue) / 100)
      : coupon.discountValue;
  const discount = Math.min(eligibleTotal, Math.max(1, raw));

  return { ok: true, coupon, discount, lineDiscounts: spread(discount, lines, eligible, eligibleTotal) };
}

/**
 * Indirimi uyan satirlara tutarlariyla orantili dagitir (kurusa yuvarlanir);
 * yuvarlama farki son uyan satira yazilir, toplam indirime esit kalir.
 */
function spread(discount: number, lines: CouponCartLine[], eligible: boolean[], eligibleTotal: number): number[] {
  const totalKurus = Math.round(discount * 100);
  const last = eligible.lastIndexOf(true);
  let given = 0;
  return lines.map((l, i) => {
    if (!eligible[i]) return 0;
    const share = i === last ? totalKurus - given : Math.round((totalKurus * l.totalIncVat) / eligibleTotal);
    given += share;
    return share / 100;
  });
}

/**
 * Kupon sonucunun musteriye gosterilen hali (sepet ve odeme). Kuponun
 * tamami (kisiye ozel kuponda tanimli e-postalar dahil) tarayiciya
 * gonderilmez; veritabani modunda kupon sunucuda degerlendirilir ve bu
 * hali doner (Asama 5.2).
 */
export type CouponView =
  | {
      ok: true;
      couponId: string;
      code: string;
      discount: number;
      lineDiscounts: number[];
      /** Kisiye ozel kupon: e-postasi odeme adiminda uyeye gore denetlenir */
      personal: boolean;
    }
  | { ok: false; problem: CouponProblem; startsAt?: string; minCartTotal?: number };

export function couponView(result: CouponResult): CouponView {
  if (result.ok) {
    const { coupon, discount, lineDiscounts } = result;
    return {
      ok: true,
      couponId: coupon.id,
      code: coupon.code,
      discount,
      lineDiscounts,
      personal: coupon.audience === "customers",
    };
  }
  return {
    ok: false,
    problem: result.problem,
    ...(result.problem === "scheduled" && result.coupon?.startsAt ? { startsAt: result.coupon.startsAt } : {}),
    ...(result.problem === "minTotal" && result.coupon?.minCartTotal ? { minCartTotal: result.coupon.minCartTotal } : {}),
  };
}
