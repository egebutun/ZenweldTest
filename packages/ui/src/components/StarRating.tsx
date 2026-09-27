"use client";

import { Star } from "lucide-react";

/**
 * YILDIZ PUANI
 *
 * Salt gosterim icin `value` yeterli; puan vermek icin `onChange`
 * verildiginde yildizlar tiklanabilir hale gelir.
 */
export function StarRating({
  value,
  onChange,
  size = 18,
  label,
}: {
  value: number;
  onChange?: (value: number) => void;
  size?: number;
  label?: string;
}) {
  const interactive = Boolean(onChange);

  return (
    <div className="flex items-center gap-0.5" role={interactive ? "radiogroup" : undefined} aria-label={label}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= Math.round(value);
        const star = (
          <Star
            size={size}
            className={filled ? "fill-zw-red-600 text-zw-red-600" : "text-zw-grey-300"}
          />
        );
        return interactive ? (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={n === Math.round(value)}
            aria-label={`${n}`}
            onClick={() => onChange?.(n)}
            className="rounded-[3px] p-0.5 zw-focus"
          >
            {star}
          </button>
        ) : (
          <span key={n}>{star}</span>
        );
      })}
    </div>
  );
}
