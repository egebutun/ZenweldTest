"use client";

import { useState } from "react";
import {
  Award,
  Check,
  Factory,
  Headphones,
  MapPin,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import type { Product } from "@zenweld/data";
import { Badge, Button, Modal } from "@zenweld/ui";
import { DealerFinder } from "@/components/dealers/DealerFinder";
import { ProductImage } from "@/components/common/ProductImage";
import { LocaleLink } from "@/components/common/LocaleLink";
import { useLocale, useT, useText } from "@/lib/i18n-client";
import { formatPrice, priceWithVat } from "@/lib/format";
import { useQuoteList } from "@/lib/quote-list";

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
          className="h-full w-full object-cover"
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
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- */

export function PriceBlock({ product }: { product: Product }) {
  const t = useT();
  const locale = useLocale();
  const incVat = priceWithVat(product.priceExVat, product.vatRate);

  return (
    <div className="mt-5 border-y border-zw-grey-200 py-5">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="font-display text-4xl font-bold tracking-tight">
          {formatPrice(incVat, locale)}
        </span>
        <span className="text-sm font-medium text-zw-grey-500">{t.product.priceIncVat}</span>
      </div>
      <div className="mt-1 text-sm text-zw-grey-500">
        {formatPrice(product.priceExVat, locale)} <span>{t.product.priceExVat}</span>
        <span className="mx-2 text-zw-grey-300">·</span>
        KDV %{product.vatRate}
      </div>
      <p className="mt-3 rounded-[4px] bg-zw-grey-50 px-3 py-2 text-xs text-zw-grey-600">
        {t.product.deferredNote}
      </p>
    </div>
  );
}

/* ---------------------------------------------------------------- */

export function WhereToBuyButton({ product }: { product: Product }) {
  const t = useT();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="dark"
        size="lg"
        fullWidth
        onClick={() => setOpen(true)}
        leftIcon={<MapPin size={20} />}
      >
        {t.product.whereToBuy}
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title={t.dealers.title} size="full">
        <DealerFinder productId={product.id} productName={product.name} compact />
      </Modal>
    </>
  );
}

/* ---------------------------------------------------------------- */

export function AddToQuoteButton({ product }: { product: Product }) {
  const t = useT();
  const quoteList = useQuoteList();
  const [added, setAdded] = useState(false);

  if (!product.quotable) return null;

  return (
    <Button
      variant="primary"
      size="lg"
      fullWidth
      className="mt-3"
      onClick={() => {
        quoteList.add({ productId: product.id, productName: product.name });
        setAdded(true);
        setTimeout(() => setAdded(false), 2200);
      }}
      leftIcon={added ? <Check size={20} /> : undefined}
    >
      {added ? t.product.addedToQuote : t.product.addToQuote}
    </Button>
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
    { Icon: ShieldCheck, label: t.trust.local },
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
      <LocaleLink
        href="/destek"
        className="mt-4 inline-flex items-center gap-2 border-b border-white pb-0.5 text-sm font-semibold transition-colors hover:border-zw-red-600 hover:text-zw-red-600"
      >
        {t.supportCta.cta}
        <ArrowRight size={16} />
      </LocaleLink>
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
      <Badge tone={product.inStock ? "green" : "outline"}>
        {product.inStock ? t.product.inStock : t.product.outOfStock}
      </Badge>
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
