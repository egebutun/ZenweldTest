"use client";

import { ShoppingCart, Trash2 } from "lucide-react";
import { Button, EmptyState, ProductImage } from "@zenweld/ui";
import { formatPrice } from "@zenweld/utils";
import { LocaleLink } from "@/components/common/LocaleLink";
import { QuantityStepper } from "@/components/product/ProductDetailParts";
import { OrderSummary } from "@/components/shop/OrderSummary";
import { useCart } from "@/lib/cart";
import { useLocale, useT, useText } from "@/lib/i18n-client";

export default function CartPage() {
  const t = useT();
  const locale = useLocale();
  const text = useText();
  const cart = useCart();

  if (!cart.ready) {
    return <div className="zw-container py-20 text-center text-zw-grey-500">{t.common.loading}</div>;
  }

  if (cart.lines.length === 0) {
    return (
      <div className="zw-container py-16">
        <EmptyState
          icon={<ShoppingCart size={40} />}
          title={t.cart.empty}
          text={t.cart.emptyText}
          action={
            <LocaleLink href="/">
              <Button size="lg">{t.cart.continueShopping}</Button>
            </LocaleLink>
          }
        />
      </div>
    );
  }

  return (
    <div className="zw-container py-10">
      <h1 className="font-display text-4xl font-bold uppercase">{t.cart.title}</h1>
      <p className="mt-1 text-sm text-zw-grey-500">
        {t.cart.items.replace("{count}", String(cart.count))}
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <ul className="divide-y divide-zw-grey-200 border-y border-zw-grey-200">
          {cart.lines.map((line) => (
            <li key={line.key} className="flex gap-4 py-5">
              <LocaleLink
                href={`/urun/${line.product.slug}`}
                className="h-24 w-24 shrink-0 overflow-hidden rounded-[4px] bg-zw-grey-50"
              >
                <ProductImage
                  src={line.product.images[0]?.url}
                  alt={line.product.name}
                  label={line.product.name}
                  className="h-full w-full object-contain p-2"
                />
              </LocaleLink>

              <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-start">
                <div className="min-w-0 flex-1">
                  <LocaleLink
                    href={`/urun/${line.product.slug}`}
                    className="font-display text-lg font-semibold leading-tight hover:text-zw-red-600"
                  >
                    {line.product.name}
                  </LocaleLink>
                  {line.variantLabel && (
                    <div className="mt-0.5 text-sm text-zw-grey-600">{text(line.variantLabel)}</div>
                  )}
                  <div className="mt-0.5 text-xs text-zw-grey-500">{line.sku}</div>
                  <div className="mt-1 text-xs text-zw-grey-500">
                    {t.cart.unitPrice}: {formatPrice(line.unitIncVat, locale)}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                  <div className="font-display text-xl font-bold">
                    {formatPrice(line.totalIncVat, locale)}
                  </div>
                  <div className="flex items-center gap-2">
                    <QuantityStepper
                      value={line.quantity}
                      onChange={(q) => cart.setQuantity(line.key, q)}
                    />
                    <button
                      type="button"
                      onClick={() => cart.remove(line.key)}
                      aria-label={t.cart.remove}
                      title={t.cart.remove}
                      className="rounded-[4px] p-2 text-zw-grey-500 hover:bg-zw-grey-100 hover:text-zw-red-600"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <OrderSummary totals={cart.totals}>
            <LocaleLink href="/odeme">
              <Button size="lg" fullWidth>
                {t.cart.checkout}
              </Button>
            </LocaleLink>
            <p className="mt-2 text-center text-xs text-zw-grey-500">{t.cart.loginToCheckout}</p>
            <LocaleLink
              href="/"
              className="mt-4 block text-center text-sm font-semibold text-zw-grey-700 hover:text-zw-red-600"
            >
              {t.cart.continueShopping}
            </LocaleLink>
          </OrderSummary>
        </aside>
      </div>
    </div>
  );
}
