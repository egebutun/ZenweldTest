"use client";

import { Flame, Heart } from "lucide-react";
import { productHighlights, type Product } from "@zenweld/data";
import { Badge, FlashFrame } from "@zenweld/ui";
import { LocaleLink } from "@/components/common/LocaleLink";
import { ProductImage } from "@/components/common/ProductImage";
import { useLocale, useT, useText } from "@/lib/i18n-client";
import { formatPrice, priceWithVat } from "@/lib/format";
import { useFavourites } from "@/lib/favourites";
import { discountPercent, isFlashDeal } from "@/lib/discount";

export function ProductCard({
  product,
  /** Anasayfadaki kayan seritte kullanilan daha kucuk hal. */
  compact = false,
}: {
  product: Product;
  compact?: boolean;
}) {
  const t = useT();
  const locale = useLocale();
  const text = useText();
  const favourites = useFavourites();

  const highlights = productHighlights(product, locale, 3);
  const list = product.listPriceExVat;
  // Indirim orani ve "flas" esigi tek yerden gelir (lib/discount.ts).
  const discount = discountPercent(product);
  const flash = isFlashDeal(product);

  const card = (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-[4px] border border-zw-grey-200 bg-white transition-shadow hover:shadow-lg">
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
        <div
          className={`relative overflow-hidden bg-zw-grey-50 ${compact ? "aspect-[4/3]" : "aspect-square"}`}
        >
          <ProductImage
            src={product.images[0]?.url}
            alt={text(product.images[0]?.alt) || product.name}
            label={product.name}
            className={`h-full w-full object-contain transition-transform duration-300 group-hover:scale-105 ${compact ? "p-2" : "p-3"}`}
          />
          {/* Indirimli bir urun ayni zamanda yeni olabilir; ikisi de gosterilir.
              Onceden indirim varken "Yeni" etiketi gizleniyordu. */}
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
            {!product.inStock && <Badge tone="outline">{t.product.outOfStock}</Badge>}
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
        {/* Satista one cikan ilk 3 ozellik (yonetim panelinden duzenlenir) */}
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
                {formatPrice(priceWithVat(product.priceExVat, product.vatRate), locale)}
              </span>
              {list && (
                <span
                  className={`text-zw-grey-500 line-through ${compact ? "text-sm" : "text-base"}`}
                >
                  {formatPrice(priceWithVat(list, product.vatRate), locale)}
                </span>
              )}
            </div>
          ) : (
            <div className={`font-bold text-zw-ink ${compact ? "text-xl" : "text-2xl"}`}>
              {formatPrice(priceWithVat(product.priceExVat, product.vatRate), locale)}
            </div>
          )}
          <div className="mt-1 text-xs text-zw-grey-500">
            {t.product.priceIncVat} · {formatPrice(product.priceExVat, locale)}{" "}
            {t.product.priceExVat}
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

  // Esigi asan urunler alevli cercevenin icine alinir. Alev dilleri
  // kartin arkasinda, farkli gecikmelerle yukselir.
  if (!flash) return card;

  return <FlashFrame>{card}</FlashFrame>;
}
