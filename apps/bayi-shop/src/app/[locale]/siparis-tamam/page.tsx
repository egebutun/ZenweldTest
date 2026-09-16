"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Check } from "lucide-react";
import { Button } from "@zenweld/ui";
import { LocaleLink } from "@/components/LocaleLink";
import { useT } from "@/lib/i18n-client";

function Inner() {
  const t = useT();
  const code = useSearchParams().get("kod") ?? "—";

  return (
    <div className="zw-container py-24 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
        <Check size={32} />
      </div>
      <h1 className="mt-6 font-display text-3xl font-bold uppercase">{t.shop.orderPlaced}</h1>
      <p className="mt-3 text-zw-grey-600">{t.shop.orderCode.replace("{code}", code)}</p>
      <p className="mt-1 text-sm text-zw-grey-500">{t.shop.demoCheckout}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <LocaleLink href="/magaza">
          <Button variant="outline">{t.shop.continueShopping}</Button>
        </LocaleLink>
        <LocaleLink href="/hesabim">
          <Button>{t.nav.myOrders}</Button>
        </LocaleLink>
      </div>
    </div>
  );
}

export default function OrderCompletePage() {
  return (
    <Suspense fallback={<div className="zw-container py-24">…</div>}>
      <Inner />
    </Suspense>
  );
}
