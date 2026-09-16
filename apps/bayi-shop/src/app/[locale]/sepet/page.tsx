"use client";

import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { Button, EmptyState } from "@zenweld/ui";
import { LocaleLink } from "@/components/LocaleLink";
import { ProductImage } from "@/components/ProductImage";
import { useLocale, useT } from "@/lib/i18n-client";
import { formatPrice } from "@/lib/format";
import { useCart } from "@/lib/cart";
import { STORE } from "@/lib/store-config";

export default function CartPage() {
  const t = useT();
  const locale = useLocale();
  const cart = useCart();

  if (cart.items.length === 0) {
    return (
      <div className="zw-container py-20">
        <EmptyState
          icon={<ShoppingCart size={40} />}
          title={t.shop.emptyCart}
          action={
            <LocaleLink href="/magaza">
              <Button size="lg">{t.shop.continueShopping}</Button>
            </LocaleLink>
          }
        />
      </div>
    );
  }

  return (
    <div className="zw-container py-10">
      <h1 className="font-display text-4xl font-bold uppercase">{t.shop.cart}</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="overflow-hidden rounded-[4px] border border-zw-grey-200">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-zw-grey-100">
              {cart.items.map((item) => (
                <tr key={item.productId}>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-4">
                      <ProductImage
                        src={item.image}
                        alt={item.name}
                        label={item.name}
                        className="h-16 w-16 shrink-0 rounded-[3px] border border-zw-grey-200 object-cover"
                      />
                      <div className="min-w-0">
                        <LocaleLink
                          href={`/urun/${item.slug}`}
                          className="font-semibold hover:text-zw-red-600"
                        >
                          {item.name}
                        </LocaleLink>
                        <div className="text-xs text-zw-grey-500">
                          {formatPrice(item.unitPrice, locale)} / adet
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center rounded-[4px] border border-zw-grey-300">
                      <button
                        onClick={() => cart.setQuantity(item.productId, item.quantity - 1)}
                        className="px-2.5 py-2 text-zw-grey-600"
                        aria-label="Azalt"
                      >
                        <Minus size={15} />
                      </button>
                      <span className="w-8 text-center font-semibold">{item.quantity}</span>
                      <button
                        onClick={() => cart.setQuantity(item.productId, item.quantity + 1)}
                        className="px-2.5 py-2 text-zw-grey-600"
                        aria-label="Artır"
                      >
                        <Plus size={15} />
                      </button>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-right font-semibold">
                    {formatPrice(item.unitPrice * item.quantity, locale)}
                  </td>
                  <td className="px-4 py-4">
                    <button
                      onClick={() => cart.remove(item.productId)}
                      aria-label={t.shop.remove}
                      className="text-zw-grey-400 hover:text-zw-red-600"
                    >
                      <Trash2 size={17} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <aside className="h-fit rounded-[4px] border border-zw-grey-200 p-5">
          <h2 className="font-display text-xl font-bold uppercase">Sipariş Özeti</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-zw-grey-600">{t.shop.subtotal}</dt>
              <dd className="font-semibold">{formatPrice(cart.subtotal, locale)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-zw-grey-600">{t.shop.shipping}</dt>
              <dd className="font-semibold">
                {cart.shipping === 0 ? t.shop.freeShipping : formatPrice(cart.shipping, locale)}
              </dd>
            </div>
            <div className="flex justify-between border-t border-zw-grey-200 pt-3 text-base">
              <dt className="font-bold">{t.shop.total}</dt>
              <dd className="font-display text-2xl font-bold">
                {formatPrice(cart.total, locale)}
              </dd>
            </div>
          </dl>

          {cart.subtotal < STORE.freeShippingOver && (
            <p className="mt-3 rounded-[4px] bg-zw-grey-50 px-3 py-2 text-xs text-zw-grey-600">
              {formatPrice(STORE.freeShippingOver - cart.subtotal, locale)} daha ekleyin, kargo
              ücretsiz olsun.
            </p>
          )}

          <LocaleLink href="/odeme" className="mt-5 block">
            <Button size="lg" fullWidth>
              {t.shop.checkout}
            </Button>
          </LocaleLink>
          <LocaleLink
            href="/magaza"
            className="mt-3 block text-center text-sm text-zw-grey-600 hover:text-zw-ink"
          >
            {t.shop.continueShopping}
          </LocaleLink>
        </aside>
      </div>
    </div>
  );
}
