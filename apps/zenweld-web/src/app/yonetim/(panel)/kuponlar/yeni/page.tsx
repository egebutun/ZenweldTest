"use client";

import { AdminPageHeader } from "@/components/admin/AdminShell";
import { CouponForm } from "@/components/admin/CouponForm";

export default function NewCouponPage() {
  return (
    <>
      <AdminPageHeader
        title="Yeni Kupon"
        description="Müşterinin sepette yazacağı indirim kodu. Kupon kampanyalı fiyatın üstüne uygulanır, kargoya uygulanmaz."
      />
      <CouponForm />
    </>
  );
}
