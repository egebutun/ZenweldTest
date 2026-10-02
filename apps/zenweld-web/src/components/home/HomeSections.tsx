"use client";

import { useMemo } from "react";
import { ArrowRight, Award, Compass, Flame, Factory, Handshake, Headphones, ShieldCheck, Truck, Wrench } from "lucide-react";
import { listBlogPosts, useDatabase, useNow } from "@zenweld/store";
import { Accordion, Button, SectionHeading } from "@zenweld/ui";
import { blogSlug, discountPercent, isOnSale, stockPhotos } from "@zenweld/data";
import { DealerFinder } from "@/components/dealers/DealerFinder";
import { LocaleLink } from "@/components/common/LocaleLink";
import { ProductImage } from "@/components/common/ProductImage";
import { ProductMarquee } from "@/components/product/ProductMarquee";
import { useLocale, useT, useText } from "@/lib/i18n-client";
import { formatDate } from "@/lib/format";

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

/**
 * Kampanyali urunler. Kampanyasi SU AN gecerli olan urunler listelenir;
 * kampanya baslayinca bolume kendiliginden girer, bitince cikar.
 * En yuksek indirim en basta.
 */
export function HotSale() {
  const t = useT();
  const db = useDatabase();
  const now = useNow();
  const items = useMemo(
    () =>
      db.products
        .filter((p) => p.active && isOnSale(p, now))
        .sort((a, b) => discountPercent(b, now) - discountPercent(a, now))
        .slice(0, 12),
    [db, now],
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

        <ProductMarquee products={items} />
      </div>
    </section>
  );
}

/**
 * Baslik altindaki urun secici seridi.
 *
 * Ziyaretciyi 3 adimlik urun seciciye yonlendirir; malzeme kisayollari
 * seciciyi ilgili secimle acar.
 */
export function ProductFinderStrip() {
  const t = useT();

  return (
    <section className="relative overflow-hidden bg-zw-ink text-white">
      {/* Marka kirmizisindan egik bir isik huzmesi — dikkat ceker ama
          paletten cikmaz. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "linear-gradient(105deg, transparent 38%, var(--color-zw-red-800) 58%, var(--color-zw-red-600) 78%, var(--color-zw-red-700) 100%)",
        }}
      />

      <div className="zw-container relative flex flex-col gap-4 py-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3.5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/25">
            <Compass size={21} className="text-white" />
          </span>
          <div>
            <div className="font-display text-xl font-bold uppercase leading-tight sm:text-2xl">
              {t.finder.question}
            </div>
            <div className="mt-0.5 text-sm text-zw-grey-300">{t.finder.hint}</div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-4">
          <LocaleLink
            href="/kesfet/urun-secici"
            className="group inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-zw-red-700 shadow-lg transition-colors hover:bg-zw-grey-100"
          >
            {t.finder.cta}
            <ArrowRight
              size={17}
              className="transition-transform duration-200 group-hover:translate-x-1"
            />
          </LocaleLink>
        </div>
      </div>
    </section>
  );
}

/** Yeni eklenen urunler. */
export function NewArrivals() {
  const t = useT();
  const db = useDatabase();
  const items = useMemo(
    () => db.products.filter((p) => p.active && p.isNew).slice(0, 12),
    [db],
  );

  if (items.length === 0) return null;

  return (
    <section className="bg-zw-grey-50">
      <div className="zw-container zw-section">
        <SectionHeading
          eyebrow={t.home.newArrivalsEyebrow}
          title={t.home.newArrivalsTitle}
          subtitle={t.home.newArrivalsSubtitle}
          action={
            <LocaleLink
              href="/ekipmanlar"
              className="hidden items-center gap-1.5 text-sm font-semibold uppercase text-zw-red-600 hover:underline sm:flex"
            >
              {t.common.viewAll} <ArrowRight size={16} />
            </LocaleLink>
          }
        />
        <ProductMarquee products={items} />
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

/**
 * Anasayfadaki bayi/servis bolumu.
 *
 * Onceden sehir ve bayi adi yazan kutucuklar vardi; yerine bayi bulucu
 * sayfasindaki haritanin aynisi kondu. Sehir ve tur (yetkili satici /
 * yetkili servis) filtreleri burada da calisiyor.
 */
export function DealerStrip() {
  const t = useT();

  return (
    <section className="bg-zw-grey-100">
      <div className="zw-container zw-section">
        <div className="mb-6">
          <div className="max-w-3xl">
            <h2 className="font-display text-3xl font-bold uppercase leading-tight sm:text-4xl">
              {t.home.dealerTitle}
            </h2>
            <p className="mt-3 text-zw-grey-600">{t.home.dealerSubtitle}</p>
          </div>
        </div>

        <DealerFinder variant="home" compact />
      </div>
    </section>
  );
}

/**
 * Anasayfadaki sik sorulan sorular.
 *
 * SEO icin onemli: sorular sayfanin HTML'inde duz metin olarak bulunur
 * ve ayrica FAQPage yapisal verisi olarak arama motoruna bildirilir
 * (bkz. app/[locale]/page.tsx). Google bu sorulari sonuc sayfasinda
 * dogrudan gosterebiliyor.
 */
export function HomeFaq() {
  const t = useT();
  const text = useText();
  const db = useDatabase();
  const items = useMemo(() => db.faqs.slice(0, 8), [db]);

  if (items.length === 0) return null;

  return (
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
            items={items.map((f) => ({
              id: f.id,
              title: text(f.question),
              content: text(f.answer),
            }))}
          />
        </div>
      </div>
    </section>
  );
}

/** Anasayfada bayilik basvurusuna cagri. */
export function DealerApplyBanner() {
  const t = useT();
  return (
    <section className="zw-container py-12">
      <div className="flex flex-col items-start gap-5 rounded-[6px] border-2 border-zw-red-600 bg-zw-red-50 px-7 py-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-zw-red-600 text-white">
            <Handshake size={24} />
          </span>
          <div>
            <h2 className="font-display text-2xl font-bold uppercase text-zw-ink sm:text-3xl">
              {t.dealerApply.homeTitle}
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-zw-grey-700">{t.dealerApply.homeText}</p>
          </div>
        </div>
        <LocaleLink href="/kesfet/bayilik-basvurusu" className="shrink-0">
          <Button size="lg">{t.dealerApply.homeCta}</Button>
        </LocaleLink>
      </div>
    </section>
  );
}

/**
 * Kurumsal alim / teklif seridi.
 *
 * Anasayfada urun secici seridinin hemen altinda, ona yapisik ve tam
 * genislikte durur; ikisi birlikte ince bir ust bant olusturur, buyuk
 * tanitim alani ilk ekranda gorunur kalir.
 */
export function QuoteBanner() {
  const t = useT();
  return (
    <section className="border-t border-white/15 bg-zw-red-600 text-white">
      <div className="zw-container flex flex-col items-start gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-bold uppercase leading-tight sm:text-2xl">
            {t.home.quoteBannerTitle}
          </h2>
          <p className="mt-0.5 text-sm text-white/90">{t.home.quoteBannerText}</p>
        </div>
        <LocaleLink href="/teklif-al" className="shrink-0">
          <Button variant="light" rightIcon={<ArrowRight size={17} />}>
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
        {listBlogPosts(db).slice(0, 3).map((post) => (
          <LocaleLink
            key={post.id}
            href={`/kesfet/blog/${blogSlug(post, locale)}`}
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
