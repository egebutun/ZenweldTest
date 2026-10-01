"use client";

import { useState } from "react";
import { Check, Flame, ShoppingCart } from "lucide-react";
import {
  FLASH_DISCOUNT_THRESHOLD,
  productHighlights,
  type Product,
  type RetailerStock,
} from "@zenweld/data";
import { useNow } from "@zenweld/store";
import { Badge, Button, FlashFrame } from "@zenweld/ui";
import { LocaleLink } from "./LocaleLink";
import { ProductImage } from "./ProductImage";
import { useLocale, useT, useText } from "@/lib/i18n-client";
import { formatPrice } from "@/lib/format";
import { useCart } from "@/lib/cart";
import { shopPrice } from "@/lib/pricing";

/**
 * MAGAZA URUN KARTI
 *
 * Gorsel dil ana siteyle AYNIDIR: flas indirim etiketi ve alevli
 * cerceve, "Yeni" rozeti, indirimli fiyatin kirmizi kutuda beyaz-bold
 * yazilmasi, ustu cizili liste fiyati. Magazaya ozgu olan kisimlar
 * korunur: sepete ekle butonu, magaza fiyati ve "Son N adet" uyarisi.
 *
 * Fiyat farki: ana site marka fiyatini, magaza kendi satis fiyatini
 * gosterir (stock.price). Kampanyayi da bayi kendisi belirler
 * (stock.discount); Zenweld kampanyalari magazayi etkilemez
 * (bkz. lib/pricing.ts).
 */
export function ShopProductCard({
  product,
  stock,
  /** Anasayfadaki kayan seritte kullanilan daha kucuk hal. */
  compact = false,
}: {
  product: Product;
  stock?: RetailerStock;
  compact?: boolean;
}) {
  const t = useT();
  const locale = useLocale();
  const text = useText();
  const cart = useCart();
  const [added, setAdded] = useState(false);
  const now = useNow();

  const { normal, sale: price, percent: discount } = shopPrice(product, stock, now);
  const flash = discount >= FLASH_DISCOUNT_THRESHOLD;
  const available = stock?.inStock ?? false;
  const highlights = productHighlights(product, locale, 3);
  /** Magaza stogunda 5 ve altinda kalanlar icin uyari rozeti. */
  const left = stock?.quantity ?? 0;
  const runningLow = available && left > 0 && left <= 5;

  const card = (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-[4px] border border-zw-grey-200 bg-white text-zw-ink transition-shadow hover:shadow-lg">
      <LocaleLink href={`/urun/${product.slug}`} className="block">
        <div
          className={`relative overflow-hidden bg-zw-grey-50 ${compact ? "aspect-[4/3]" : "aspect-square"}`}
        >
          <ProductImage
            src={product.images[0]?.url}
            alt={text(product.images[0]?.alt) || product.name}
            label={product.name}
            className={`h-full w-full object-contain transition-transform duration-300 group-hover:scale-105 ${compact ? "p-2" : "p-3"}`}
          />
          {/* Indirimli bir urun ayni zamanda yeni olabilir; ikisi de gosterilir. */}
          <div className="absolute left-2 top-2 flex flex-col items-start gap-1">
            {flash ? (
              <span className="inline-flex items-center gap-1 rounded-[3px] bg-zw-red-600 px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow">
                <Flame size={12} />
                {t.product.flashDeal} %{discount}
              </span>
            ) : (
              discount > 0 && <Badge tone="red">%{discount} {t.product.discount}</Badge>
            )}
            {product.isNew && (
              <Badge tone={discount > 0 ? "dark" : "red"}>{t.product.new}</Badge>
            )}
            {runningLow && <Badge tone="amber">Son {left} adet</Badge>}
            {!available && <Badge tone="outline">{t.product.outOfStock}</Badge>}
          </div>
        </div>
      </LocaleLink>

      <div className={`flex flex-1 flex-col ${compact ? "p-3" : "p-4"}`}>
        <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-zw-grey-500">
          {product.processes.slice(0, 3).join(" · ") || product.sku}
        </div>
        <LocaleLink href={`/urun/${product.slug}`}>
          <h3
            className={`font-display font-semibold leading-tight text-zw-ink transition-colors group-hover:text-zw-red-600 ${compact ? "text-base" : "text-lg"}`}
          >
            {product.name}
          </h3>
        </LocaleLink>
        {/* Satista one cikan ilk 3 ozellik */}
        {highlights.length > 0 ? (
          <ul className="mt-2 space-y-1">
            {highlights.map((h, i) => (
              <li key={i} className="flex gap-2 text-xs leading-snug text-zw-grey-600">
                <span className="mt-[6px] h-1 w-1 shrink-0 rounded-full bg-zw-red-600" />
                <span className="line-clamp-2">{h}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1.5 line-clamp-2 text-sm text-zw-grey-500">
            {text(product.shortDescription)}
          </p>
        )}

        <div className={compact ? "mt-auto pt-3" : "mt-auto pt-4"}>
          {/* Indirimli fiyat kirmizi kutuda beyaz ve kalin; indirimsizler
              de eskisinden belirgin sekilde buyuk. */}
          {discount > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-block rounded-[4px] bg-zw-red-600 px-2.5 py-1 font-bold text-white ${
                  compact ? "text-xl" : "text-2xl"
                }`}
              >
                {formatPrice(price, locale)}
              </span>
              <span
                className={`text-zw-grey-500 line-through ${compact ? "text-sm" : "text-base"}`}
              >
                {formatPrice(normal, locale)}
              </span>
            </div>
          ) : (
            <div className={`font-bold text-zw-ink ${compact ? "text-xl" : "text-2xl"}`}>
              {formatPrice(price, locale)}
            </div>
          )}
          {/* Magaza fiyatlari KDV dahil tutulur; KDV haric tutar ondan hesaplanir. */}
          <div className="mt-1 text-xs text-zw-grey-500">
            {t.product.priceIncVat} ·{" "}
            {formatPrice(Math.round(price / (1 + product.vatRate / 100)), locale)}{" "}
            {t.product.priceExVat}
          </div>

          <Button
            className="mt-3"
            size={compact ? "sm" : "md"}
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

  // Esigi asan urunler alevli cercevenin icine alinir.
  return flash ? <FlashFrame>{card}</FlashFrame> : card;
}
