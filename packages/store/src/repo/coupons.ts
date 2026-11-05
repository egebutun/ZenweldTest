"use client";

import {
  couponCodeTaken,
  couponStatus,
  couponUsageCount,
  evaluateCoupon,
  normalizeCouponCode,
  normalizeCouponDraft,
  validateCoupon,
  type Coupon,
  type CouponCartLine,
  type CouponDraft,
  type CouponRedemption,
  type CouponResult,
  type CouponStatus,
  type Order,
  type ZenweldDatabase,
} from "@zenweld/data";
import { getSnapshot, mutate, uid } from "../database";
import { nowIso } from "./shared";

/**
 * KUPONLAR (KARARLAR K-85, IS-KURALLARI › 21)
 *
 * Hesap kurallari packages/data/src/coupon.ts'tedir; burada kayit ve
 * kullanim islemleri vardir. Kupon siparisle birlikte kullanilmis sayilir
 * (placeOrder), siparis iptal edilince kullanim geri sayilir.
 */

export function listCoupons(db: ZenweldDatabase = getSnapshot()): Coupon[] {
  return [...db.coupons].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function findCoupon(id: string, db: ZenweldDatabase = getSnapshot()): Coupon | undefined {
  return db.coupons.find((c) => c.id === id);
}

/** Kodla arar; buyuk/kucuk harf ve bosluk fark etmez. */
export function findCouponByCode(code: string, db: ZenweldDatabase = getSnapshot()): Coupon | undefined {
  const key = normalizeCouponCode(code);
  return key ? db.coupons.find((c) => c.code === key) : undefined;
}

/** Kuponun kullanildigi siparisler, yeniden eskiye (iptal edilenler dahil). */
export function couponRedemptions(couponId: string, db: ZenweldDatabase = getSnapshot()): CouponRedemption[] {
  return db.couponRedemptions
    .filter((r) => r.couponId === couponId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Gecerli kullanim sayisi (iptal edilen siparisler haric). */
export function couponUsage(couponId: string, db: ZenweldDatabase = getSnapshot()): number {
  return couponUsageCount(couponId, db.couponRedemptions);
}

export function couponStatusOf(coupon: Coupon, db: ZenweldDatabase = getSnapshot(), at?: Date): CouponStatus {
  return couponStatus(coupon, couponUsage(coupon.id, db), at);
}

/**
 * Kuponu ekler ya da gunceller; sorun varsa hata metni doner. Bicim
 * (normalizeCouponDraft) ve kurallar packages/data'dadir; kod baska kuponda
 * kullanilamaz.
 */
export function saveCoupon(
  input: CouponDraft & { id?: string },
): { ok: true; id: string } | { ok: false; error: string } {
  const { id: inputId, ...rest } = input;
  const draft = normalizeCouponDraft(rest);
  const problem = validateCoupon(draft);
  if (problem) return { ok: false, error: problem };
  if (getSnapshot().coupons.some((c) => c.code === draft.code && c.id !== inputId)) {
    return { ok: false, error: couponCodeTaken(draft.code) };
  }

  const at = nowIso();
  const id = inputId ?? uid("cpn");
  mutate((db) => {
    const i = db.coupons.findIndex((c) => c.id === id);
    if (i >= 0) db.coupons[i] = { ...draft, id, createdAt: db.coupons[i].createdAt, updatedAt: at };
    else db.coupons.unshift({ ...draft, id, createdAt: at, updatedAt: at });
  });
  return { ok: true, id };
}

/** Hic kullanilmamis kupon silinir; kullanilmis kupon silinmez, pasife alinir (false). */
export function deleteCoupon(id: string): boolean {
  if (getSnapshot().couponRedemptions.some((r) => r.couponId === id)) return false;
  return mutate((db) => {
    db.coupons = db.coupons.filter((c) => c.id !== id);
  });
}

/** Sepete yazilan kodu degerlendirir (sepet ve odeme sayfasi); uye bilinmiyorsa userId/userEmail bos. */
export function checkCoupon(
  code: string,
  lines: CouponCartLine[],
  { userId, userEmail, at }: { userId?: string; userEmail?: string; at?: Date } = {},
  db: ZenweldDatabase = getSnapshot(),
): CouponResult {
  return evaluateCoupon(findCouponByCode(code, db), lines, {
    redemptions: db.couponRedemptions,
    userId,
    userEmail,
    at,
  });
}

/* Siparisle birlikte cagrilir (commerce.ts); ayni yazma isleminin icinde. */

/** Siparisteki kuponun kullanimini yazar. */
export function addRedemption(db: ZenweldDatabase, order: Order): void {
  if (!order.coupon) return;
  db.couponRedemptions.push({
    id: uid("cpr"),
    couponId: order.coupon.couponId,
    couponCode: order.coupon.code,
    userId: order.userId,
    orderId: order.id,
    discountAmount: order.coupon.discount,
    createdAt: order.createdAt,
  });
}

/** Siparis iptal edildi: kupon kullanimi geri sayilir. */
export function releaseRedemption(db: ZenweldDatabase, orderId: string, at: string): void {
  db.couponRedemptions.forEach((r) => {
    if (r.orderId === orderId && !r.releasedAt) r.releasedAt = at;
  });
}
