"use client";

import { Heart } from "lucide-react";
import type { Product } from "@zenweld/data";
import { Badge } from "@zenweld/ui";
import { LocaleLink } from "@/components/common/LocaleLink";
import { ProductImage } from "@/components/common/ProductImage";
import { useLocale, useT, useText } from "@/lib/i18n-client";
import { formatPrice, priceWithVat } from "@/lib/format";
import { useFavourites } from "@/lib/favourites";

export function ProductCard({ product }: { product: Product }) {
  const t = useT();
  const locale = useLocale();
  const text = useText();
  const favourites = useFavourites();

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-[4px] border border-zw-grey-200 bg-white transition-shadow hover:shadow-lg">
      <button
        onClick={() => favourites.toggle(product.id)}
        aria-label="Favori"
        className="absolute right-2 top-2 z-10 rounded-full bg-white/90 p-1.5 text-zw-grey-500 transition-colors hover:text-zw-red-600"
      >
        <Heart
          size={17}
          className={favourites.has(product.id) ? "fill-zw-red-600 text-zw-red-600" : ""}
        />
      </button>

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
            {!product.inStock && <Badge tone="outline">{t.product.outOfStock}</Badge>}
          </div>
        </div>
      </LocaleLink>

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-zw-grey-500">
          {product.processes.slice(0, 3).join(" · ") || product.sku}
        </div>
        <LocaleLink href={`/urun/${product.slug}`}>
          <h3 className="font-display text-lg font-semibold leading-tight text-zw-ink transition-colors group-hover:text-zw-red-600">
            {product.name}
          </h3>
        </LocaleLink>
        <p className="mt-1.5 line-clamp-2 text-sm text-zw-grey-500">
          {text(product.shortDescription)}
        </p>

        <div className="mt-auto pt-4">
          <div className="text-lg font-bold text-zw-ink">
            {formatPrice(priceWithVat(product.priceExVat, product.vatRate), locale)}
            <span className="ml-1.5 text-xs font-normal text-zw-grey-500">
              {t.product.priceIncVat}
            </span>
          </div>
          <div className="text-xs text-zw-grey-500">
            {formatPrice(product.priceExVat, locale)} {t.product.priceExVat}
          </div>
          <LocaleLink
            href={`/urun/${product.slug}`}
            className="mt-3 block rounded-[4px] bg-zw-ink py-2.5 text-center text-xs font-bold uppercase tracking-wide text-white transition-colors hover:bg-zw-red-600"
          >
            {t.product.whereToBuy}
          </LocaleLink>
        </div>
      </div>
    </div>
  );
}
