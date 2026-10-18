"use client";

import {
  applyDiscount,
  FLASH_DISCOUNT_THRESHOLD,
  MAX_DISCOUNT_PERCENT,
  MIN_DISCOUNT_PERCENT,
} from "@zenweld/data";
import { useNow } from "@zenweld/store";
import { CampaignBadge, Checkbox, FormRow, Input } from "@zenweld/ui";
import { formatPrice, fromDateTimeLocal, priceWithVat, toDateTimeLocal } from "@zenweld/utils";
import type { ProductTabProps } from "./types";

/**
 * KAMPANYA / INDIRIM — normal fiyat formda kalir, indirim yalnizca
 * gecerlilik suresi icinde uygulanir. Altta musterinin gorecegi fiyatin
 * canli onizlemesi var.
 */
export function DiscountFields({ draft, set }: ProductTabProps) {
  const now = useNow();

  return (
    <div className="rounded-[4px] border border-zw-grey-200 bg-zw-grey-50 p-4">
      <Checkbox
        label="Bu ürüne kampanya / indirim uygula"
        checked={Boolean(draft.discount)}
        onChange={(e) =>
          set("discount", e.target.checked ? { percent: 10 } : undefined)
        }
      />

      {draft.discount && (
        <div className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <FormRow
              label="İndirim oranı (%)"
              required
              hint={`%${MIN_DISCOUNT_PERCENT}–%${MAX_DISCOUNT_PERCENT}. %${FLASH_DISCOUNT_THRESHOLD} ve üzeri "Flaş İndirim" olarak gösterilir.`}
            >
              <Input
                type="number"
                required
                min={MIN_DISCOUNT_PERCENT}
                max={MAX_DISCOUNT_PERCENT}
                step={1}
                value={draft.discount.percent}
                onChange={(e) =>
                  set("discount", { ...draft.discount!, percent: Number(e.target.value) })
                }
              />
            </FormRow>
            <FormRow label="Başlangıç" hint="Boş bırakılırsa hemen başlar">
              <Input
                type="datetime-local"
                value={toDateTimeLocal(draft.discount.startsAt)}
                onChange={(e) =>
                  set("discount", {
                    ...draft.discount!,
                    startsAt: fromDateTimeLocal(e.target.value),
                  })
                }
              />
            </FormRow>
            <FormRow label="Bitiş" hint="Boş bırakılırsa süresiz">
              <Input
                type="datetime-local"
                value={toDateTimeLocal(draft.discount.endsAt)}
                onChange={(e) =>
                  set("discount", {
                    ...draft.discount!,
                    endsAt: fromDateTimeLocal(e.target.value),
                  })
                }
              />
            </FormRow>
          </div>

          {/* Canli onizleme: musterinin gorecegi fiyat ve kampanya durumu */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[4px] border border-zw-grey-200 bg-white px-4 py-3 text-sm">
            <span className="text-zw-grey-600">
              Normal:{" "}
              <span className="line-through">
                {formatPrice(priceWithVat(draft.priceExVat, draft.vatRate))}
              </span>
            </span>
            <span className="font-semibold text-zw-ink">
              Kampanya fiyatı:{" "}
              <span className="rounded-[3px] bg-zw-red-600 px-2 py-0.5 text-white">
                {formatPrice(
                  priceWithVat(
                    applyDiscount(draft.priceExVat, draft.discount.percent),
                    draft.vatRate,
                  ),
                )}
              </span>{" "}
              <span className="font-normal text-zw-grey-500">KDV dahil</span>
            </span>
            <CampaignBadge discount={draft.discount} now={now} />
          </div>
          {(draft.variantGroups?.length ?? 0) > 0 && (
            <p className="text-xs text-zw-grey-500">
              Seçenekli ürün: aynı indirim oranı tüm seçeneklere (ör. 3 m / 5 m) uygulanır.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
