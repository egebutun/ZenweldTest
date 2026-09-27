"use client";

import {
  AlertTriangle,
  ArrowRight,
  CreditCard,
  Flame,
  Headphones,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { stockPhotos } from "@zenweld/data";
import { stockForRetailer, useDatabase } from "@zenweld/store";
import { Accordion, Button, SectionHeading } from "@zenweld/ui";
import { LocaleLink } from "@/components/LocaleLink";
import { ProductImage } from "@/components/ProductImage";
import { ShopProductCard } from "@/components/ShopProductCard";
import { ShopProductMarquee } from "@/components/ShopProductMarquee";
import { ShopReviewMarquee } from "@/components/ShopReviewMarquee";
import { useLocale, useT, useText } from "@/lib/i18n-client";
import { STORE } from "@/lib/store-config";
import { formatDate, formatPrice } from "@/lib/format";

export function ShopHomeContent() {
  const t = useT();
  const locale = useLocale();
  const text = useText();
  const db = useDatabase();

  const stock = stockForRetailer(STORE.retailerId, db);
  const stockMap = new Map(stock.map((s) => [s.productId, s]));
  const inStockProducts = db.products.filter(
    (p) => p.active && stockMap.get(p.id)?.inStock,
  );
  /** Urun gamina yeni katilanlardan magazada stokta olanlar. */
  const newArrivals = inStockProducts
    .filter((p) => p.isNew)
    .slice(0, 12)
    .map((p) => ({ product: p, stock: stockMap.get(p.id) }));

  /** Zenweld'in kampanyali urunlerinden magazada stokta olanlar. */
  const hotSale = inStockProducts
    .filter((p) => p.hotSale)
    .slice(0, 12)
    .map((p) => ({ product: p, stock: stockMap.get(p.id) }));

  /** Magazanin kendi stogunda 5 adet ve altinda kalanlar. */
  const lowStock = inStockProducts
    .map((p) => ({ product: p, qty: stockMap.get(p.id)?.quantity ?? 0 }))
    .filter(({ qty }) => qty > 0 && qty <= 5)
    .sort((a, b) => a.qty - b.qty)
    .slice(0, 8);

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

      {hotSale.length > 0 && (
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
                <p className="mt-2 max-w-2xl text-sm text-zw-grey-300">
                  {t.home.hotSaleSubtitle}
                </p>
              </div>
              <LocaleLink
                href="/magaza"
                className="hidden items-center gap-1.5 text-sm font-semibold uppercase text-white hover:text-zw-red-500 sm:flex"
              >
                {t.common.viewAll} <ArrowRight size={16} />
              </LocaleLink>
            </div>
            <ShopProductMarquee items={hotSale} />
          </div>
        </section>
      )}

      {lowStock.length > 0 && (
        <section className="zw-container zw-section">
          <div className="mb-8">
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-amber-600">
              <AlertTriangle size={18} />
              {t.home.lowStockEyebrow}
            </div>
            <h2 className="mt-2 font-display text-3xl font-bold uppercase sm:text-4xl">
              {t.home.lowStockTitle}
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-zw-grey-600">
              Mağazamızda az sayıda kalan ürünler. Tükenmeden sipariş verebilirsiniz.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {lowStock.map(({ product }) => (
              <ShopProductCard
                key={product.id}
                product={product}
                stock={stockMap.get(product.id)}
              />
            ))}
          </div>
        </section>
      )}

      {newArrivals.length > 0 && (
        <section className="bg-zw-grey-50">
          <div className="zw-container zw-section">
            <SectionHeading
              eyebrow={t.home.newArrivalsEyebrow}
              title={t.home.newArrivalsTitle}
              subtitle={t.home.newArrivalsSubtitle}
              action={
                <LocaleLink
                  href="/magaza"
                  className="hidden items-center gap-1.5 text-sm font-semibold uppercase text-zw-red-600 hover:underline sm:flex"
                >
                  {t.common.viewAll} <ArrowRight size={16} />
                </LocaleLink>
              }
            />
            <ShopProductMarquee items={newArrivals} />
          </div>
        </section>
      )}

      {/* Magazanin kendi yorumlari — bayi hesabindan isaretlenenler. */}
      <ShopReviewMarquee />

      {/* Sik sorulan sorular — ana siteyle ayni sorular (tek kaynak).
          Arama motorlari icin de degerli, o yuzden anasayfada. */}
      {db.faqs.length > 0 && (
        <section className="bg-white">
          <div className="zw-container zw-section">
            <SectionHeading
              eyebrow={t.support.faqTitle}
              title={t.home.faqTitle}
              subtitle={t.home.faqSubtitle}
              action={
                <LocaleLink
                  href="/destek/sss"
                  className="hidden items-center gap-1.5 text-sm font-semibold uppercase text-zw-red-600 hover:underline sm:flex"
                >
                  {t.common.viewAll} <ArrowRight size={16} />
                </LocaleLink>
              }
            />
            <div className="max-w-3xl">
              <Accordion
                icon="plus"
                items={db.faqs.slice(0, 8).map((f) => ({
                  id: f.id,
                  title: text(f.question),
                  content: text(f.answer),
                }))}
              />
            </div>
          </div>
        </section>
      )}

      {/* Blog — yazilar Zenweld merkez editoru tarafindan hazirlanir,
          magaza yalnizca gosterir. */}
      {db.blogPosts.length > 0 && (
        <section className="zw-container zw-section">
          <SectionHeading
            eyebrow={t.home.blogSubtitle}
            title={t.home.blogTitle}
            action={
              <LocaleLink
                href="/blog"
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
                href={`/blog/${post.slug}`}
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
                  <p className="mt-2 line-clamp-2 text-sm text-zw-grey-500">
                    {text(post.excerpt)}
                  </p>
                  <div className="mt-3 text-xs text-zw-grey-400">
                    {formatDate(post.publishedAt, locale)}
                  </div>
                </div>
              </LocaleLink>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
