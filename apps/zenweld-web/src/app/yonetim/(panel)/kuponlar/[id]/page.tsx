"use client";

import { use } from "react";
import Link from "next/link";
import { couponStatusOf, couponUsage, findCoupon, useDatabase, useNow } from "@zenweld/store";
import { Alert } from "@zenweld/ui";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { CouponForm } from "@/components/admin/CouponForm";

const STATUS_TEXT = {
  active: "Geçerli",
  scheduled: "Planlandı",
  expired: "Süresi doldu",
  exhausted: "Sınır doldu",
  inactive: "Pasif",
};

export default function EditCouponPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const db = useDatabase();
  const now = useNow();
  const coupon = findCoupon(id, db);
  if (!coupon) return <Alert tone="danger">Kupon bulunamadı.</Alert>;

  return (
    <>
      <AdminPageHeader
        title={coupon.code}
        description={`${STATUS_TEXT[couponStatusOf(coupon, db, now)]} · ${couponUsage(coupon.id, db)} kullanım`}
        action={
          <Link href="/yonetim/kuponlar" className="text-sm font-semibold text-zw-grey-600 hover:text-zw-ink">
            ← Tüm kuponlar
          </Link>
        }
      />
      <CouponForm coupon={coupon} />
    </>
  );
}
