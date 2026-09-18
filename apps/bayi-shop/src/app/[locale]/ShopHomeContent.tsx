"use client";

import { ArrowRight, CreditCard, Headphones, ShieldCheck, Truck } from "lucide-react";
import { stockPhotos } from "@zenweld/data";
import { stockForRetailer, useDatabase } from "@zenweld/store";
import { Button, SectionHeading } from "@zenweld/ui";
import { LocaleLink } from "@/components/LocaleLink";
import { ProductImage } from "@/components/ProductImage";
import { ShopProductCard } from "@/components/ShopProductCard";
import { useLocale, useT } from "@/lib/i18n-client";
import { STORE } from "@/lib/store-config";
import { formatPrice } from "@/lib/format";

export function ShopHomeContent() {
  const t = useT();
  const locale = useLocale();
  const db = useDatabase();

  const stock = stockForRetailer(STORE.retailerId, db);
  const stockMap = new Map(stock.map((s) => [s.productId, s]));
  const inStockProducts = db.products.filter(
    (p) => p.active && stockMap.get(p.id)?.inStock,
  );
  const featured = inStockProducts.filter((p) => p.featured).slice(0, 8);
  const rest = inStockProducts.filter((p) => !p.featured).slice(0, 4);

  const trust = [
    { Icon: Truck, title: "Hızlı Kargo", text: `${formatPrice(STORE.freeShippingOver, locale)} üzeri ücretsiz` },
    { Icon: ShieldCheck, title: "Yetkili Bayi", text: "Orijinal ürün ve garanti" },
    { Icon: CreditCard, title: "Güvenli Ödeme", text: "Kredi kartı ve havale" },
    { Icon: Headphones, title: "Teknik Destek", text: "Uzman ekip desteği" },
  ];

  return (
    <>
      <section className="relative overflow-hidden bg-zw-ink">
        <ProductImage
          src={stockPhotos.heroWide}
          alt={STORE.name}
          label={STORE.name}
          priority
          className="absolute inset-0 h-full w-full object-cover opacity-35"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-zw-ink via-zw-ink/85 to-transparent" />
        <div className="zw-container relative py-16 text-white lg:py-24">
          <div className="max-w-xl">
            <div className="mb-3 inline-block border-l-4 border-zw-red-600 pl-3 text-xs font-bold uppercase tracking-[0.2em] text-zw-red-500">
              {t.shop.authorizedDealer}
            </div>
            <h1 className="font-display text-3xl font-bold uppercase leading-[1.05] sm:text-5xl">
              Zenweld Kaynak Makineleri ve Ekipmanları — Stoktan Teslim
            </h1>
            <p className="mt-4 text-zw-grey-300">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
              incididunt ut labore et dolore magna aliqua.
            </p>
            <LocaleLink href="/magaza" className="mt-7 inline-block">
              <Button size="lg" rightIcon={<ArrowRight size={18} />}>
                Ürünleri Gör
              </Button>
            </LocaleLink>
          </div>
        </div>
      </section>

      <section className="border-b border-zw-grey-200 bg-zw-grey-50">
        <div className="zw-container grid gap-6 py-8 sm:grid-cols-2 lg:grid-cols-4">
          {trust.map(({ Icon, title, text }) => (
            <div key={title} className="flex items-start gap-3">
              <Icon size={24} className="shrink-0 text-zw-red-600" />
              <div>
                <div className="font-semibold">{title}</div>
                <div className="text-sm text-zw-grey-500">{text}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="zw-container zw-section">
        <SectionHeading
          eyebrow={STORE.name}
          title="Öne Çıkan Ürünler"
          action={
            <LocaleLink
              href="/magaza"
              className="hidden items-center gap-1.5 text-sm font-semibold uppercase text-zw-red-600 hover:underline sm:flex"
            >
              {t.common.viewAll} <ArrowRight size={16} />
            </LocaleLink>
          }
        />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((p) => (
            <ShopProductCard key={p.id} product={p} stock={stockMap.get(p.id)} />
          ))}
        </div>
      </section>

      {rest.length > 0 && (
        <section className="bg-zw-grey-50">
          <div className="zw-container zw-section">
            <SectionHeading title="Yeni Gelenler" />
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {rest.map((p) => (
                <ShopProductCard key={p.id} product={p} stock={stockMap.get(p.id)} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
