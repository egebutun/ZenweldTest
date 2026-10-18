"use client";

import { useState } from "react";
import {
  Award,
  Check,
  Factory,
  Flame,
  Headphones,
  MapPin,
  MessageCircle,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingCart,
} from "lucide-react";
import {
  discountPercent,
  FLASH_DISCOUNT_THRESHOLD,
  salePriceExVat,
  type Product,
} from "@zenweld/data";
import { useNow } from "@zenweld/store";
import { Badge, Button, Modal, ProductImage } from "@zenweld/ui";
import { DealerFinder } from "@/components/dealers/DealerFinder";
import { LocaleLink } from "@/components/common/LocaleLink";
import { useLocale, useT, useText } from "@/lib/i18n-client";
import { openSupportChat } from "@/lib/support-chat";
import { MAX_LINE_QUANTITY, useCart } from "@/lib/cart";
import type { VariantSelection } from "@/lib/variants";
import { formatDateTime, formatPrice, priceWithVat } from "@zenweld/utils";

/* ---------------------------------------------------------------- */

export function ProductGallery({ product }: { product: Product }) {
  const text = useText();
  const images = product.images.length > 0 ? product.images : [{ url: "", alt: { tr: product.name, en: product.name } }];
  const [active, setActive] = useState(0);

  return (
    <div className="grid gap-3">
      <div className="aspect-square overflow-hidden rounded-[4px] bg-zw-grey-50">
        <ProductImage
          src={images[active]?.url}
          alt={text(images[active]?.alt) || product.name}
          label={product.name}
          priority
          className="h-full w-full object-contain p-6"
        />
      </div>

      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-3">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`aspect-square overflow-hidden rounded-[4px] border-2 bg-zw-grey-50 transition-colors ${
                i === active ? "border-zw-red-600" : "border-transparent hover:border-zw-grey-300"
              }`}
            >
              <ProductImage
                src={img.url}
                alt={text(img.alt) || product.name}
                label={product.name}
                className="h-full w-full object-contain p-2"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- */

/**
 * Urun sayfasindaki fiyat. Kampanya gecerliyse indirimli fiyat kirmizi
 * kutuda, normal fiyat ustu cizili, oran rozetle ve (varsa) bitis tarihi
 * gosterilir — kartlardaki gorunumle ayni dil. Onceden urun sayfasi
 * indirimi hic gostermiyordu.
 */
export function PriceBlock({ product }: { product: Product }) {
  const t = useT();
  const locale = useLocale();
  const now = useNow();

  const percent = discountPercent(product, now);
  const sale = salePriceExVat(product, now);
  const incVat = priceWithVat(sale, product.vatRate);
  const endsAt = percent > 0 ? product.discount?.endsAt : undefined;

  return (
    <div className="mt-5 border-y border-zw-grey-200 py-5">
      {percent > 0 && (
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-[3px] bg-zw-red-600 px-2 py-1 text-xs font-bold uppercase tracking-wide text-white">
            {percent >= FLASH_DISCOUNT_THRESHOLD && <Flame size={13} />}
            {percent >= FLASH_DISCOUNT_THRESHOLD ? `${t.product.flashDeal} ` : ""}%{percent}{" "}
            {t.product.discount}
          </span>
          <span className="text-sm text-zw-grey-500">
            {t.product.normalPrice}{" "}
            <span className="line-through">
              {formatPrice(priceWithVat(product.priceExVat, product.vatRate), locale)}
            </span>
          </span>
        </div>
      )}
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span
          className={`font-display text-4xl font-bold tracking-tight ${
            percent > 0 ? "rounded-[4px] bg-zw-red-600 px-3 py-1 text-white" : ""
          }`}
        >
          {formatPrice(incVat, locale)}
        </span>
        <span className="text-sm font-medium text-zw-grey-500">{t.product.priceIncVat}</span>
      </div>
      <div className="mt-1 text-sm text-zw-grey-500">
        {formatPrice(sale, locale)} <span>{t.product.priceExVat}</span>
        <span className="mx-2 text-zw-grey-300">·</span>
        KDV %{product.vatRate}
      </div>
      {endsAt && (
        <p className="mt-2 text-sm font-semibold text-zw-red-700">
          {t.product.campaignEnds.replace("{date}", formatDateTime(endsAt, locale))}
        </p>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- */

/** Adet secimi + Sepete Ekle. Secili urun secenekleriyle birlikte eklenir. */
export function AddToCart({
  product,
  selection,
}: {
  product: Product;
  selection: VariantSelection;
}) {
  const t = useT();
  const cart = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  return (
    <div>
      <div className="flex gap-3">
        <QuantityStepper value={quantity} onChange={setQuantity} size="lg" />
        <Button
          size="lg"
          fullWidth
          leftIcon={<ShoppingCart size={20} />}
          onClick={() => {
            cart.add(product.id, selection, quantity);
            setAdded(true);
          }}
        >
          {t.cart.addToCart}
        </Button>
      </div>
      {added && (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-[4px] border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-800">
          <span className="flex items-center gap-2">
            <Check size={16} />
            {t.cart.added}
          </span>
          <LocaleLink href="/sepet" className="underline underline-offset-2 hover:text-emerald-950">
            {t.cart.goToCart} →
          </LocaleLink>
        </div>
      )}
    </div>
  );
}

/** - [adet] + kutusu; sepet ve urun sayfasinda ortak. */
export function QuantityStepper({
  value,
  onChange,
  size = "md",
}: {
  value: number;
  onChange: (value: number) => void;
  size?: "md" | "lg";
}) {
  const t = useT();
  const height = size === "lg" ? "h-14" : "h-10";
  const set = (n: number) => onChange(Math.max(1, Math.min(MAX_LINE_QUANTITY, n || 1)));
  const button = "flex w-10 items-center justify-center text-zw-grey-600 hover:text-zw-ink disabled:opacity-30";
  return (
    <div className={`flex shrink-0 items-stretch rounded-[4px] border border-zw-grey-300 bg-white ${height}`}>
      <button type="button" aria-label={t.cart.decrease} className={button} disabled={value <= 1} onClick={() => set(value - 1)}>
        <Minus size={16} />
      </button>
      <input
        type="number"
        inputMode="numeric"
        min={1}
        max={MAX_LINE_QUANTITY}
        aria-label={t.cart.quantity}
        value={value}
        onChange={(e) => set(Number(e.target.value))}
        className="w-12 border-x border-zw-grey-200 text-center text-sm font-semibold [appearance:textfield] focus:outline-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <button type="button" aria-label={t.cart.increase} className={button} disabled={value >= MAX_LINE_QUANTITY} onClick={() => set(value + 1)}>
        <Plus size={16} />
      </button>
    </div>
  );
}

/* ---------------------------------------------------------------- */

export function WhereToBuyButton({
  product,
  /** Secili urun secenegi; bayi listesi buna gore filtrelenir. */
  variantId,
}: {
  product: Product;
  variantId?: string;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="lg"
        fullWidth
        onClick={() => setOpen(true)}
        leftIcon={<MapPin size={20} />}
      >
        {t.product.whereToBuy}
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title={t.dealers.title} size="full">
        <DealerFinder
          productId={product.id}
          productName={product.name}
          variantId={variantId}
          compact
        />
      </Modal>
    </>
  );
}

/* ---------------------------------------------------------------- */

export function InTheBoxList({ product }: { product: Product }) {
  const t = useT();
  const text = useText();
  if (product.inTheBox.length === 0) return null;

  return (
    <div className="mt-6">
      <h2 className="mb-2 text-sm font-semibold text-zw-ink">{t.product.inTheBox}</h2>
      <ul className="space-y-1.5 text-sm text-zw-grey-700">
        {product.inTheBox.map((item, i) => (
          <li key={i} className="flex gap-2">
            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-zw-grey-400" />
            {text(item)}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------------------------------------------------------------- */

export function SpecTable({ product }: { product: Product }) {
  const text = useText();
  return (
    <table className="w-full text-sm">
      <tbody>
        {product.specs.map((row, i) => (
          <tr key={i} className="border-b border-zw-grey-200 last:border-0">
            <th className="w-2/5 py-3 pr-4 text-left font-semibold text-zw-grey-700">
              {text(row.label)}
            </th>
            <td className="py-3 text-zw-grey-600">{text(row.value)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* ---------------------------------------------------------------- */

export function TrustBadges() {
  const t = useT();
  const items = [
    { Icon: Factory, label: t.trust.industry },
    { Icon: Award, label: t.trust.award },
    { Icon: Headphones, label: t.trust.support },
  ];

  return (
    <div className="mt-8 grid grid-cols-1 gap-4 rounded-[4px] bg-zw-grey-100 px-5 py-5 sm:grid-cols-2">
      {items.map(({ Icon, label }) => (
        <div key={label} className="flex items-center gap-3 text-sm font-medium text-zw-ink">
          <Icon size={22} className="shrink-0 text-zw-grey-600" />
          {label}
        </div>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------- */

export function SupportCta() {
  const t = useT();
  return (
    <div className="mt-6 overflow-hidden rounded-[4px] bg-zw-ink px-6 py-6 text-white">
      <h3 className="font-display text-2xl font-bold uppercase">{t.supportCta.title}</h3>
      <p className="mt-1 text-sm text-zw-grey-300">{t.supportCta.text}</p>
      {/* Tiklaninca sag alttaki destek sohbetini acar. */}
      <button
        type="button"
        onClick={openSupportChat}
        className="mt-4 inline-flex items-center gap-2 border-b border-white pb-0.5 text-sm font-semibold transition-colors hover:border-zw-red-500 hover:text-zw-red-500 zw-focus"
      >
        <MessageCircle size={16} />
        {t.supportCta.cta}
      </button>
    </div>
  );
}

/* ---------------------------------------------------------------- */

export function ProductHighlights({ product }: { product: Product }) {
  const t = useT();
  const text = useText();
  if (product.highlights.length === 0) return null;

  return (
    <div className="mt-6">
      <h2 className="mb-3 text-sm font-semibold text-zw-ink">{t.product.highlights}</h2>
      <div className="grid gap-2 sm:grid-cols-2">
        {product.highlights.map((h, i) => (
          <div key={i} className="flex items-start gap-2 text-sm text-zw-grey-700">
            <Check size={16} className="mt-0.5 shrink-0 text-zw-red-600" />
            {text(h)}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */

export function ProductMeta({ product }: { product: Product }) {
  const t = useT();
  return (
    <div className="flex flex-wrap items-center gap-2">
      {product.isNew && <Badge tone="red">{t.product.new}</Badge>}
      <Badge tone="grey">
        <ShieldCheck size={11} />
        {t.product.warrantyMonths.replace("{months}", String(product.warrantyMonths))}
      </Badge>
      <span className="text-xs text-zw-grey-500">
        {t.product.sku}: <strong className="text-zw-grey-700">{product.sku}</strong>
      </span>
      {product.modelCode && (
        <span className="text-xs text-zw-grey-500">
          {t.product.model}: <strong className="text-zw-grey-700">{product.modelCode}</strong>
        </span>
      )}
    </div>
  );
}
