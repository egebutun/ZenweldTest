"use client";

import { useMemo } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Award,
  Flame,
  Factory,
  Headphones,
  MapPin,
  ShieldCheck,
  Truck,
  Wrench,
} from "lucide-react";
import { useDatabase } from "@zenweld/store";
import { Button, SectionHeading } from "@zenweld/ui";
import { stockPhotos } from "@zenweld/data";
import { LocaleLink } from "@/components/common/LocaleLink";
import { ProductImage } from "@/components/common/ProductImage";
import { ProductCard } from "@/components/product/ProductCard";
import { useLocale, useT, useText } from "@/lib/i18n-client";
import { formatDate, formatPrice, priceWithVat } from "@/lib/format";

export function Hero() {
  const t = useT();
  return (
    <section className="relative overflow-hidden bg-zw-ink">
      <ProductImage
        src={stockPhotos.heroWide}
        alt="Zenweld"
        label="ZENWELD"
        priority
        className="absolute inset-0 h-full w-full object-cover opacity-40"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-zw-ink via-zw-ink/85 to-transparent" />

      <div className="zw-container relative py-20 lg:py-32">
        <div className="max-w-2xl text-white">
          <div className="mb-4 inline-block border-l-4 border-zw-red-600 pl-3 text-xs font-bold uppercase tracking-[0.2em] text-zw-red-500">
            {t.common.tagline}
          </div>
          <h1 className="font-display text-4xl font-bold uppercase leading-[1.02] tracking-tight sm:text-5xl lg:text-6xl">
            {t.home.heroTitle}
          </h1>
          <p className="mt-4 font-display text-2xl font-semibold uppercase tracking-tight text-zw-red-500 sm:text-3xl">
            {t.home.heroSlogan}
          </p>
          <p className="mt-4 max-w-xl text-zw-grey-300">{t.home.heroSubtitle}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <LocaleLink href="/ekipmanlar">
              <Button size="lg" rightIcon={<ArrowRight size={18} />}>
                {t.home.heroCta}
              </Button>
            </LocaleLink>
            <LocaleLink href="/teklif-al">
              <Button
                size="lg"
                variant="outline"
                className="border-white bg-transparent text-white hover:bg-white hover:text-zw-ink"
              >
                {t.home.heroCtaSecondary}
              </Button>
            </LocaleLink>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Kampanyali urunler. hotSale isaretli urunler listelenir. */
export function HotSale() {
  const t = useT();
  const db = useDatabase();
  const items = useMemo(
    () => db.products.filter((p) => p.active && p.hotSale).slice(0, 8),
    [db],
  );

  if (items.length === 0) return null;

  return (
    <section className="bg-zw-ink text-white">
      <div className="zw-container zw-section">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-zw-red-500">
              <Flame size={18} />
              {t.home.hotSaleEyebrow}
            </div>
            <h2 className="mt-2 font-display text-3xl font-bold uppercase sm:text-4xl">
              {t.home.hotSaleTitle}
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-zw-grey-300">{t.home.hotSaleSubtitle}</p>
          </div>
          <LocaleLink
            href="/ekipmanlar"
            className="hidden items-center gap-1.5 text-sm font-semibold uppercase text-white hover:text-zw-red-500 sm:flex"
          >
            {t.common.viewAll} <ArrowRight size={16} />
          </LocaleLink>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </section>
  );
}

/** Zenweld deposunda stogu azalan urunler. */
export function LowStock() {
  const t = useT();
  const locale = useLocale();
  const db = useDatabase();

  const items = useMemo(
    () =>
      db.products
        .filter((p) => p.active && (p.stockQuantity ?? 0) > 0 && (p.stockQuantity ?? 0) <= 5)
        .sort((a, b) => (a.stockQuantity ?? 0) - (b.stockQuantity ?? 0))
        .slice(0, 8),
    [db],
  );

  if (items.length === 0) return null;

  return (
    <section className="zw-container zw-section">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-amber-600">
            <AlertTriangle size={18} />
            {t.home.lowStockEyebrow}
          </div>
          <h2 className="mt-2 font-display text-3xl font-bold uppercase sm:text-4xl">
            {t.home.lowStockTitle}
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-zw-grey-600">{t.home.lowStockSubtitle}</p>
        </div>
        <LocaleLink
          href="/nereden-alabilirim"
          className="hidden items-center gap-1.5 text-sm font-semibold uppercase text-zw-red-600 hover:underline sm:flex"
        >
          {t.nav.findDealer} <ArrowRight size={16} />
        </LocaleLink>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((p) => (
          <LocaleLink
            key={p.id}
            href={`/urun/${p.slug}`}
            className="group flex gap-4 rounded-[4px] border border-zw-grey-200 bg-white p-4 transition-shadow hover:shadow-lg"
          >
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[3px] bg-zw-grey-50">
              <ProductImage
                src={p.images[0]?.url}
                alt={p.name}
                label={p.name}
                className="max-h-16 max-w-16 object-contain"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="line-clamp-2 font-display text-[15px] font-semibold leading-tight text-zw-ink group-hover:text-zw-red-600">
                {p.name}
              </div>
              <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
                <AlertTriangle size={12} />
                {t.home.lowStockLeft.replace("{count}", String(p.stockQuantity))}
              </div>
              <div className="mt-2 text-sm font-bold text-zw-ink">
                {formatPrice(priceWithVat(p.priceExVat, p.vatRate), locale)}
              </div>
            </div>
          </LocaleLink>
        ))}
      </div>
    </section>
  );
}

export function WhyZenweld() {
  const t = useT();
  const items = [
    { Icon: Factory, title: t.trust.industry },
    { Icon: ShieldCheck, title: t.trust.local },
    { Icon: Award, title: t.trust.award },
    { Icon: Headphones, title: t.trust.support },
    { Icon: Wrench, title: t.explore.checkWarranty },
    { Icon: Truck, title: t.nav.findDealer },
  ];

  return (
    <section className="zw-container zw-section">
      <SectionHeading align="center" title={t.home.whyTitle} subtitle={t.home.whySubtitle} />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(({ Icon, title }) => (
          <div
            key={title}
            className="rounded-[4px] border border-zw-grey-200 p-6 transition-colors hover:border-zw-red-600"
          >
            <Icon size={28} className="text-zw-red-600" />
            <h3 className="mt-4 font-display text-xl font-semibold uppercase">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-zw-grey-500">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
              incididunt ut labore et dolore magna aliqua.
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function DealerStrip() {
  const t = useT();
  const db = useDatabase();

  return (
    <section className="bg-zw-grey-100">
      <div className="zw-container zw-section grid items-center gap-10 lg:grid-cols-2">
        <div>
          <h2 className="font-display text-4xl font-bold uppercase leading-tight">
            {t.home.dealerTitle}
          </h2>
          <p className="mt-3 text-zw-grey-600">{t.home.dealerSubtitle}</p>
          <LocaleLink href="/nereden-alabilirim" className="mt-6 inline-block">
            <Button variant="dark" size="lg" leftIcon={<MapPin size={18} />}>
              {t.home.dealerCta}
            </Button>
          </LocaleLink>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {db.dealers.slice(0, 9).map((d) => (
            <div
              key={d.id}
              className="rounded-[4px] border border-zw-grey-200 bg-white px-3 py-3 text-center"
            >
              <div className="truncate font-display text-sm font-bold uppercase">{d.city}</div>
              <div className="truncate text-xs text-zw-grey-500">{d.name}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function QuoteBanner() {
  const t = useT();
  return (
    <section className="zw-container py-12">
      <div className="flex flex-col items-start gap-6 overflow-hidden rounded-[4px] bg-zw-red-600 px-8 py-10 text-white lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl font-bold uppercase leading-tight sm:text-4xl">
            {t.home.quoteBannerTitle}
          </h2>
          <p className="mt-2 text-white/90">{t.home.quoteBannerText}</p>
        </div>
        <LocaleLink href="/teklif-al" className="shrink-0">
          <Button
            size="lg"
            className="bg-white text-zw-red-700 hover:bg-zw-grey-100"
            rightIcon={<ArrowRight size={18} />}
          >
            {t.home.quoteBannerCta}
          </Button>
        </LocaleLink>
      </div>
    </section>
  );
}

export function BlogTeaser() {
  const t = useT();
  const locale = useLocale();
  const text = useText();
  const db = useDatabase();

  return (
    <section className="zw-container zw-section">
      <SectionHeading
        eyebrow={t.home.blogSubtitle}
        title={t.home.blogTitle}
        action={
          <LocaleLink
            href="/kesfet/blog"
            className="hidden items-center gap-1.5 text-sm font-semibold uppercase text-zw-red-600 hover:underline sm:flex"
          >
            {t.common.viewAll} <ArrowRight size={16} />
          </LocaleLink>
        }
      />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {db.blogPosts.slice(0, 3).map((post) => (
          <LocaleLink
            key={post.id}
            href={`/kesfet/blog/${post.slug}`}
            className="group overflow-hidden rounded-[4px] border border-zw-grey-200"
          >
            <div className="aspect-[16/9] overflow-hidden bg-zw-grey-100">
              <ProductImage
                src={post.coverUrl}
                alt={text(post.title)}
                label={text(post.category)}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <div className="p-5">
              <div className="text-xs font-semibold uppercase tracking-wide text-zw-red-600">
                {text(post.category)}
              </div>
              <h3 className="mt-2 font-display text-xl font-semibold leading-tight group-hover:text-zw-red-600">
                {text(post.title)}
              </h3>
              <p className="mt-2 line-clamp-2 text-sm text-zw-grey-500">{text(post.excerpt)}</p>
              <div className="mt-3 text-xs text-zw-grey-400">
                {formatDate(post.publishedAt, locale)}
              </div>
            </div>
          </LocaleLink>
        ))}
      </div>
    </section>
  );
}
