"use client";

import { useLocale } from "@/lib/i18n-client";
import { formatPrice } from "@/lib/format";
import { STORE } from "@/lib/store-config";

const LOREM =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.";

export default function ShippingReturnsPage() {
  const locale = useLocale();

  return (
    <div className="zw-container py-12">
      <h1 className="font-display text-4xl font-bold uppercase">Kargo & İade</h1>
      <div className="mt-6 max-w-3xl space-y-4 text-[15px] leading-relaxed text-zw-grey-700">
        <h2 className="font-display text-2xl font-bold uppercase">Kargo</h2>
        <p>
          {formatPrice(STORE.freeShippingOver, locale)} ve üzeri siparişlerde kargo ücretsizdir.
          Altındaki siparişlerde {formatPrice(STORE.shippingFee, locale)} kargo bedeli
          uygulanır. Siparişler iş günlerinde 16:00&apos;a kadar verilirse aynı gün kargoya
          verilir.
        </p>
        <p>{LOREM}</p>
        <h2 className="font-display text-2xl font-bold uppercase">İade</h2>
        <p>{LOREM}</p>
        <p>{LOREM}</p>
      </div>
    </div>
  );
}
