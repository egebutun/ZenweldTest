"use client";

import { useState } from "react";
import { Check, Flame, Heart, ShoppingCart } from "lucide-react";
import {
  discountPercent,
  FLASH_DISCOUNT_THRESHOLD,
  productHighlights,
  salePriceExVat,
  type Product,
} from "@zenweld/data";
import { useNow } from "@zenweld/store";
import { Badge, FlashFrame, ProductImage } from "@zenweld/ui";
import Link from "next/link";
import { useT } from "@/lib/i18n-client";
import { formatPrice, priceWithVat } from "@zenweld/utils";
import { useFavourites } from "@/lib/favourites";
import { useCart } from "@/lib/cart";

export function ProductCard({
  product,
  /** Anasayfadaki kayan seritte kullanilan daha kucuk hal. */
  compact = false,
}: {
  product: Product;
  compact?: boolean;
}) {
  const t = useT();
  const favourites = useFavourites();

  const now = useNow();

  const highlights = productHighlights(product);
  // Fiyat ve kampanya kurallari tek yerden gelir (packages/data/src/discount.ts).
  // Kampanya tarihleri "now" ile degerlendirilir.
  const discount = discountPercent(product, now);
  const flash = discount >= FLASH_DISCOUNT_THRESHOLD;
  const sale = salePriceExVat(product, now);

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

      <Link href={`/urun/${product.slug}`} className="block">
        <div
          className={`relative overflow-hidden bg-zw-grey-50 ${compact ? "aspect-[4/3]" : "aspect-square"}`}
        >
          <ProductImage
            src={product.images[0]?.url}
            alt={product.images[0]?.alt || product.name}
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
          </div>
        </div>
      </Link>

      <div className={`flex flex-1 flex-col ${compact ? "p-3" : "p-4"}`}>
        <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-zw-grey-500">
          {product.sku}
        </div>
        <Link href={`/urun/${product.slug}`}>
          <h3
            className={`font-display font-semibold leading-tight text-zw-ink transition-colors group-hover:text-zw-red-600 ${compact ? "text-base" : "text-lg"}`}
          >
            {product.name}
          </h3>
        </Link>
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
            {product.shortDescription}
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
                {formatPrice(priceWithVat(sale, product.vatRate))}
              </span>
              <span
                className={`text-zw-grey-500 line-through ${compact ? "text-sm" : "text-base"}`}
              >
                {formatPrice(priceWithVat(product.priceExVat, product.vatRate))}
              </span>
            </div>
          ) : (
            <div className={`font-bold text-zw-ink ${compact ? "text-xl" : "text-2xl"}`}>
              {formatPrice(priceWithVat(sale, product.vatRate))}
            </div>
          )}
          <div className="mt-1 text-xs text-zw-grey-500">
            {t.product.priceIncVat} · {formatPrice(sale)} {t.product.priceExVat}
          </div>
          <CardCartButton product={product} />
        </div>
      </div>
    </div>
  );

  // Esigi asan urunler alevli cercevenin icine alinir. Alev dilleri
  // kartin arkasinda, farkli gecikmelerle yukselir.
  if (!flash) return card;

  return <FlashFrame>{card}</FlashFrame>;
}

/**
 * Kartin altindaki dugme. Seceneksiz urun dogrudan sepete eklenir;
 * secenekli urunde (3 m / 5 m torc gibi) once secim yapilsin diye urun
 * sayfasina gidilir.
 */
function CardCartButton({ product }: { product: Product }) {
  const t = useT();
  const cart = useCart();
  const [added, setAdded] = useState(false);
  const className =
    "mt-3 flex w-full items-center justify-center gap-2 rounded-[4px] py-2.5 text-center text-xs font-bold uppercase tracking-wide text-white transition-colors";

  if (product.options?.variants.length) {
    return (
      <Link href={`/urun/${product.slug}`} className={`${className} bg-zw-ink hover:bg-zw-red-600`}>
        {t.cart.chooseOptions}
      </Link>
    );
  }

  if (added) {
    return (
      <Link href="/sepet" className={`${className} bg-emerald-600 hover:bg-emerald-700`}>
        <Check size={15} />
        {t.cart.goToCart}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        cart.add(product.id, {});
        setAdded(true);
      }}
      className={`${className} bg-zw-ink hover:bg-zw-red-600`}
    >
      <ShoppingCart size={15} />
      {t.cart.addToCart}
    </button>
  );
}
