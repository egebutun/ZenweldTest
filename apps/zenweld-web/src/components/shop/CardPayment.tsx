"use client";

import { CreditCard, Lock } from "lucide-react";
import { availableInstallments, installmentQuote, type ShopSettings } from "@zenweld/data";
import { FormRow, Input } from "@zenweld/ui";
import { formatPrice } from "@zenweld/utils";
import { useLocale, useT } from "@/lib/i18n-client";
import { cardBrand, cardProgram, digitsOnly, formatCardNumber, formatExpiry } from "@/lib/payment";

export interface CardDraft {
  holder: string;
  number: string;
  expiry: string;
  cvc: string;
  installments: number;
}

export const EMPTY_CARD: CardDraft = { holder: "", number: "", expiry: "", cvc: "", installments: 1 };

/**
 * Kart formu ve taksit tablosu. Kart numarasinin ilk 6 hanesi girilince
 * kart programi ve taksit secenekleri gosterilir (gercek sistemde odeme
 * kurulusunun BIN sorgusu).
 */
export function CardPayment({
  card,
  onChange,
  total,
  shop,
}: {
  card: CardDraft;
  onChange: (card: CardDraft) => void;
  /** Vade farki haric odenecek tutar */
  total: number;
  shop: ShopSettings;
}) {
  const t = useT();
  const locale = useLocale();
  const set = <K extends keyof CardDraft>(k: K, v: CardDraft[K]) => onChange({ ...card, [k]: v });

  const brand = cardBrand(card.number);
  const program = cardProgram(card.number);
  const options = availableInstallments(total, shop);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormRow label={t.checkout.cardHolder} required>
          <Input
            autoComplete="cc-name"
            value={card.holder}
            onChange={(e) => set("holder", e.target.value)}
          />
        </FormRow>
        <FormRow label={t.checkout.cardNumber} required>
          <div className="relative">
            <Input
              inputMode="numeric"
              autoComplete="cc-number"
              placeholder="0000 0000 0000 0000"
              value={card.number}
              // Kart degisince taksit secimi sifirlanir (yeni kartin programi farkli olabilir).
              onChange={(e) =>
                onChange({ ...card, number: formatCardNumber(e.target.value), installments: 1 })
              }
              className="pr-24"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1 text-xs font-semibold text-zw-grey-500">
              <CreditCard size={15} />
              {brand}
            </span>
          </div>
        </FormRow>
        <FormRow label={t.checkout.expiry} required>
          <Input
            inputMode="numeric"
            autoComplete="cc-exp"
            placeholder="AA/YY"
            value={card.expiry}
            onChange={(e) => set("expiry", formatExpiry(e.target.value))}
          />
        </FormRow>
        <FormRow label={t.checkout.cvc} required>
          <Input
            inputMode="numeric"
            autoComplete="cc-csc"
            placeholder="•••"
            value={card.cvc}
            onChange={(e) => set("cvc", digitsOnly(e.target.value).slice(0, 4))}
          />
        </FormRow>
      </div>

      <div>
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-sm font-semibold text-zw-ink">{t.checkout.installments}</h3>
          {program && (
            <span className="text-xs text-zw-grey-500">
              {t.checkout.cardProgram.replace("{program}", program)}
            </span>
          )}
        </div>

        {!program ? (
          <p className="rounded-[4px] bg-zw-grey-50 px-3 py-2.5 text-xs text-zw-grey-600">
            {t.checkout.installmentHint}
          </p>
        ) : (
          <div className="overflow-hidden rounded-[4px] border border-zw-grey-200">
            {options.map((option) => {
              const quote = installmentQuote(total, option);
              const selected = card.installments === option.count;
              return (
                <label
                  key={option.count}
                  className={`flex cursor-pointer items-center gap-3 border-b border-zw-grey-100 px-4 py-3 text-sm last:border-0 ${
                    selected ? "bg-zw-red-50" : "bg-white hover:bg-zw-grey-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="installments"
                    checked={selected}
                    onChange={() => set("installments", option.count)}
                    className="accent-zw-red-600"
                  />
                  <span className="min-w-28 font-semibold">
                    {option.count === 1
                      ? t.checkout.singlePayment
                      : t.checkout.installmentCount.replace("{count}", String(option.count))}
                  </span>
                  <span className="flex-1 text-xs text-zw-grey-600">
                    {option.count > 1 &&
                      t.checkout.perMonth
                        .replace("{amount}", formatPrice(quote.monthly, locale))
                        .replace("{count}", String(option.count))}
                    {option.count > 1 && option.ratePercent === 0 && (
                      <span className="ml-2 rounded-[3px] bg-emerald-50 px-1.5 py-0.5 font-semibold text-emerald-700">
                        {t.checkout.noInterest}
                      </span>
                    )}
                  </span>
                  <span className="font-semibold">{formatPrice(quote.grandTotal, locale)}</span>
                </label>
              );
            })}
          </div>
        )}
        {program && options.length === 1 && (
          <p className="mt-2 text-xs text-zw-grey-500">
            {t.checkout.installmentMin.replace(
              "{amount}",
              formatPrice(shop.minInstallmentAmount, locale),
            )}
          </p>
        )}
      </div>

      <p className="flex items-start gap-2 text-xs text-zw-grey-500">
        <Lock size={14} className="mt-px shrink-0" />
        {t.checkout.secure}
      </p>
    </div>
  );
}
