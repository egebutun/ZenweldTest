"use client";

import { useState } from "react";
import { Check, ShoppingCart } from "lucide-react";
import type { Product, RetailerStock } from "@zenweld/data";
import { Badge, Button } from "@zenweld/ui";
import { LocaleLink } from "./LocaleLink";
import { ProductImage } from "./ProductImage";
import { useLocale, useT, useText } from "@/lib/i18n-client";
import { formatPrice, priceWithVat } from "@/lib/format";
import { useCart } from "@/lib/cart";

export function ShopProductCard({
  product,
  stock,
}: {
  product: Product;
  stock?: RetailerStock;
}) {
  const t = useT();
  const locale = useLocale();
  const text = useText();
  const cart = useCart();
  const [added, setAdded] = useState(false);

  const price = stock?.price ?? priceWithVat(product.priceExVat, product.vatRate);
  const available = stock?.inStock ?? false;

  return (
    <div className="group flex flex-col overflow-hidden rounded-[4px] border border-zw-grey-200 bg-white text-zw-ink transition-shadow hover:shadow-lg">
      <LocaleLink href={`/urun/${product.slug}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-zw-grey-50">
          <ProductImage
            src={product.images[0]?.url}
            alt={text(product.images[0]?.alt) || product.name}
            label={product.name}
            className="h-full w-full object-contain p-3 transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute left-2 top-2 flex flex-col gap-1">
            {product.isNew && <Badge tone="red">{t.product.new}</Badge>}
            {!available && <Badge tone="outline">{t.product.outOfStock}</Badge>}
          </div>
        </div>
      </LocaleLink>

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-zw-grey-500">
          {product.sku}
        </div>
        <LocaleLink href={`/urun/${product.slug}`}>
          <h3 className="font-display text-lg font-semibold leading-tight text-zw-ink group-hover:text-zw-red-600">
            {product.name}
          </h3>
        </LocaleLink>
        <p className="mt-1.5 line-clamp-2 text-sm text-zw-grey-500">
          {text(product.shortDescription)}
        </p>

        <div className="mt-auto pt-4">
          <div className="font-display text-2xl font-bold text-zw-ink">
            {formatPrice(price, locale)}
          </div>
          <div className="text-xs text-zw-grey-500">{t.product.priceIncVat}</div>

          <Button
            className="mt-3"
            fullWidth
            disabled={!available}
            leftIcon={added ? <Check size={17} /> : <ShoppingCart size={17} />}
            onClick={() => {
              cart.add({
                productId: product.id,
                name: product.name,
                slug: product.slug,
                image: product.images[0]?.url,
                unitPrice: price,
              });
              setAdded(true);
              setTimeout(() => setAdded(false), 1800);
            }}
          >
            {!available ? t.product.outOfStock : added ? t.shop.addedToCart : t.shop.addToCart}
          </Button>
        </div>
      </div>
    </div>
  );
}
