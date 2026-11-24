"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { MAX_LINE_QUANTITY } from "@/lib/cart";
import { useT } from "@/lib/i18n-client";

/**
 * - [adet] + kutusu; sepet, urun sayfasi ve urun kartlarinda ortak. "sm"
 * urun kartlari icindir: kucuk; dar kartta tum genisligi kaplar.
 */
export function QuantityStepper({
  value,
  onChange,
  size = "md",
}: {
  value: number;
  onChange: (value: number) => void;
  size?: "sm" | "md" | "lg";
}) {
  const t = useT();
  // Yazilirken kutu bos kalabilir (1'i silip 5 yazmak icin); gecerli bir
  // sayi yazilinca adet hemen guncellenir, kutudan cikinca bos kalmaz.
  const [draft, setDraft] = useState<string | null>(null);
  const height = size === "lg" ? "h-14" : size === "sm" ? "h-9" : "h-10";
  const clamp = (n: number) => Math.max(1, Math.min(MAX_LINE_QUANTITY, Math.floor(n) || 1));
  const set = (n: number) => onChange(clamp(n));
  const step = (n: number) => {
    setDraft(null);
    set(n);
  };
  const button = `flex ${size === "sm" ? "w-8" : "w-10"} items-center justify-center text-zw-grey-600 hover:text-zw-ink disabled:opacity-30`;
  return (
    <div className={`flex shrink-0 items-stretch rounded-[4px] border border-zw-grey-300 bg-white ${height}`}>
      <button type="button" aria-label={t.cart.decrease} className={button} disabled={value <= 1} onClick={() => step(value - 1)}>
        <Minus size={16} />
      </button>
      <input
        type="number"
        inputMode="numeric"
        min={1}
        max={MAX_LINE_QUANTITY}
        aria-label={t.cart.quantity}
        value={draft ?? value}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (n >= 1) {
            // Sinirin ustu (500 -> 99) ya da kesirli yazilirsa kutu gecerli adedi gosterir.
            set(n);
            setDraft(String(clamp(n)));
          } else setDraft(e.target.value);
        }}
        onBlur={() => setDraft(null)}
        className={`${size === "sm" ? "w-9 min-w-0 grow" : "w-12"} border-x border-zw-grey-200 bg-white text-center text-sm font-semibold text-zw-ink [appearance:textfield] focus:outline-none [&::-webkit-inner-spin-button]:appearance-none`}
      />
      <button type="button" aria-label={t.cart.increase} className={button} disabled={value >= MAX_LINE_QUANTITY} onClick={() => step(value + 1)}>
        <Plus size={16} />
      </button>
    </div>
  );
}
