import type { Coupon } from "../types";

/**
 * ORNEK KUPONLAR (KARARLAR K-85)
 *
 * Kupon ekranlari denenebilsin diye uc kupon: butun urunlerde gecerli,
 * yalnizca bir kategoride gecerli ve suresi dolmus. Tarihler kurulum anina
 * gore verilir.
 */
const DAY = 86_400_000;

export function createSampleCoupons(now: number): Coupon[] {
  const at = (days: number) => new Date(now + days * DAY).toISOString();
  return [
    {
      id: "cpn-hosgeldin5",
      code: "HOSGELDIN5",
      name: "Hoş geldin indirimi",
      discountType: "percent",
      discountValue: 5,
      perUserLimit: 1,
      scope: "all",
      productIds: [],
      categoryIds: [],
      active: true,
      createdAt: at(-30),
      updatedAt: at(-30),
    },
    {
      id: "cpn-lazer25000",
      code: "LAZER25000",
      name: "Lazer kaynak makinelerinde 25.000 ₺",
      discountType: "amount",
      discountValue: 25000,
      minCartTotal: 500000,
      endsAt: at(60),
      totalUsageLimit: 20,
      scope: "targets",
      productIds: [],
      // Lazer Kaynak Makineleri
      categoryIds: ["c1.1.1"],
      active: true,
      createdAt: at(-10),
      updatedAt: at(-10),
    },
    {
      id: "cpn-yaz10",
      code: "YAZ10",
      name: "Yaz kampanyası",
      discountType: "percent",
      discountValue: 10,
      startsAt: at(-120),
      endsAt: at(-30),
      scope: "all",
      productIds: [],
      categoryIds: [],
      active: true,
      createdAt: at(-125),
      updatedAt: at(-125),
    },
  ];
}
