"use client";

import { useMemo } from "react";
import { ArrowRight, Award, Compass, Factory, Flame, Handshake, Headphones, Truck, Wrench } from "lucide-react";
import type { Product } from "@zenweld/data";
import { listBlogPosts, listProducts, useDatabase, useNow } from "@zenweld/store";
import { Accordion, ProductImage } from "@zenweld/ui";
import { discountPercent, isDiscountActive } from "@zenweld/data";
import { DealerFinder } from "@/components/dealers/DealerFinder";
import Link from "next/link";
import { ProductMarquee } from "@/components/product/ProductMarquee";
import { SectionTitle } from "@/components/home/CategoryShowcase";
import { useT } from "@/lib/i18n-client";
import { formatDate } from "@zenweld/utils";

/** "Tumunu Gor" baglantisi (bolum basliginin saginda). */
function ViewAll({ href, label, dark }: { href: string; label: string; dark?: boolean }) {
  return (
    <Link
      href={href}
      className={`group inline-flex shrink-0 items-center gap-2 self-start whitespace-nowrap text-sm font-bold uppercase tracking-wide sm:self-auto ${
        dark ? "text-white hover:text-zw-red-400" : "text-zw-ink hover:text-zw-red-600"
      }`}
    >
      {label}
      <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
    </Link>
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
      listProducts(db)
        .filter((p) => isDiscountActive(p, now))
        .sort((a, b) => discountPercent(b, now) - discountPercent(a, now))
        .slice(0, 12),
    [db, now],
  );

  if (items.length === 0) return null;

  return (
    <section className="bg-zw-grey-50">
      <div className="zw-container zw-section">
        <SectionTitle
          eyebrow={
            <span className="flex items-center gap-1.5">
              <Flame size={15} />
              {t.home.hotSaleEyebrow}
            </span>
          }
          title={t.home.hotSaleTitle}
          subtitle={t.home.hotSaleSubtitle}
          action={<ViewAll href="/ekipmanlar" label={t.common.viewAll} />}
        />
        <ProductMarquee products={items} />
      </div>
    </section>
  );
}

/**
 * SERI SERITLERI: Force Serisi (Model Serisi "Force") ve Jasic lazer
 * urunleri (markasi Jasic). Kampanyali urunler gibi yana kayar; seriye
 * yeni urun eklenince kendiliginden girer.
 */
export function SeriesStrips() {
  const t = useT();
  const db = useDatabase();
  const { force, jasic } = useMemo(() => {
    const visible = listProducts(db);
    return {
      force: visible.filter((p) => p.filterValues?.["model-serisi"]?.includes("force")),
      jasic: visible.filter((p) => p.brand?.toLocaleLowerCase("tr") === "jasic"),
    };
  }, [db]);

  return (
    <>
      <SeriesStrip
        word="FORCE"
        title={t.home.forceStripTitle}
        subtitle={t.home.forceStripSubtitle}
        href="/arama?q=Force"
        products={force}
        dark
      />
      <SeriesStrip
        word="LAZER"
        title={t.home.laserStripTitle}
        subtitle={t.home.laserStripSubtitle}
        href="/ekipmanlar/lazer-makineleri"
        products={jasic}
      />
    </>
  );
}

function SeriesStrip({
  word,
  title,
  subtitle,
  href,
  products,
  dark,
}: {
  word: string;
  title: string;
  subtitle: string;
  href: string;
  products: Product[];
  dark?: boolean;
}) {
  const t = useT();
  if (products.length === 0) return null;
  return (
    <section className={`relative overflow-hidden ${dark ? "zw-steel-section bg-zw-ink" : "bg-white"}`}>
      <div
        aria-hidden="true"
        className={`zw-big-word pointer-events-none absolute -top-6 right-0 select-none font-display font-bold uppercase leading-none ${
          dark ? "" : "zw-big-word-light"
        }`}
      >
        {word}
      </div>
      <div className="zw-container zw-section relative">
        <SectionTitle
          title={title}
          subtitle={subtitle}
          dark={dark}
          action={<ViewAll href={href} label={t.common.viewAll} dark={dark} />}
        />
        <ProductMarquee products={products} />
      </div>
    </section>
  );
}

/**
 * Urun secici bandi: tek satir baslik ve "Teste Basla!" dugmesi. Sayfanin
 * ortasinda, kirmizi zeminli genis bir bant.
 */
export function FinderBand() {
  const t = useT();
  return (
    <section className="zw-container py-12 sm:py-16">
      <div className="zw-finder relative overflow-hidden rounded-[6px] bg-zw-red-600 px-6 py-10 text-white sm:px-10 lg:px-14">
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-5">
            <span className="hidden h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/30 sm:flex">
              <Compass size={30} />
            </span>
            <h2 className="font-display text-3xl font-bold uppercase leading-[0.95] sm:text-[44px]">{t.finder.question}</h2>
          </div>
          <Link
            href="/urun-secici"
            className="group inline-flex w-fit shrink-0 items-center gap-2 rounded-[4px] bg-white px-7 py-4 text-sm font-bold uppercase tracking-wide text-zw-red-700 shadow-lg transition-colors hover:bg-zw-ink hover:text-white zw-focus"
          >
            {t.finder.cta}
            <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/** Neden Zenweld? Numarali maddeler (metinler sonra yazilacak). */
export function WhyZenweld() {
  const t = useT();
  const items = [
    { Icon: Factory, title: t.trust.industry },
    { Icon: Award, title: t.trust.award },
    { Icon: Headphones, title: t.trust.support },
    { Icon: Wrench, title: t.explore.checkWarranty },
    { Icon: Truck, title: t.nav.findDealer },
  ];

  return (
    <section className="zw-steel-section relative overflow-hidden bg-zw-ink text-white">
      <div className="zw-container zw-section relative">
        <SectionTitle title={t.home.whyTitle} dark />
        <ul className="grid gap-px overflow-hidden rounded-[6px] bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(({ Icon, title }, i) => (
            <li key={title} className="group relative bg-zw-ink p-7 transition-colors hover:bg-zw-grey-900">
              <div className="flex items-center justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-[4px] bg-zw-red-600/15 text-zw-red-500 ring-1 ring-zw-red-600/40 transition-colors group-hover:bg-zw-red-600 group-hover:text-white">
                  <Icon size={24} />
                </span>
                <span className="font-display text-4xl font-bold text-white/10">{String(i + 1).padStart(2, "0")}</span>
              </div>
              <h3 className="mt-6 font-display text-2xl font-bold uppercase">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/60">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et
                dolore magna aliqua.
              </p>
            </li>
          ))}
          {/* Izgaranin son kutusu: Hakkimizda */}
          <li>
            <Link
              href="/hakkimizda"
              className="group flex h-full flex-col justify-between bg-zw-red-600 p-7 transition-colors hover:bg-zw-red-700 zw-focus"
            >
              <span className="font-display text-4xl font-bold uppercase leading-[0.95]">{t.home.slides.corporateCtaSecondary}</span>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wide">
                {t.explore.about}
                <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          </li>
        </ul>
      </div>
    </section>
  );
}

/**
 * Anasayfadaki bayi/servis bolumu: bayi bulucu sayfasindaki haritanin
 * aynisi (sehir ve tur suzgecleri calisir).
 */
export function DealerStrip() {
  const t = useT();

  return (
    <section className="bg-zw-grey-100">
      <div className="zw-container zw-section">
        <SectionTitle title={t.home.dealerTitle} subtitle={t.home.dealerSubtitle} />
        <DealerFinder variant="home" compact />
      </div>
    </section>
  );
}

/**
 * Kurumsal teklif ve bayilik: yan yana iki kart (eskiden iki ayri bant).
 */
export function CtaCards() {
  const t = useT();
  return (
    <section className="zw-container py-12 sm:py-16">
      <div className="grid gap-4 lg:grid-cols-2">
        <CtaCard
          tone="red"
          title={t.home.quoteBannerTitle}
          text={t.home.quoteBannerText}
          href="/teklif-al"
          cta={t.home.quoteBannerCta}
          Icon={Factory}
        />
        <CtaCard
          tone="dark"
          eyebrow={t.home.ctaEyebrow}
          title={t.dealerApply.homeTitle}
          text={t.dealerApply.homeText}
          href="/bayilik-basvurusu"
          cta={t.dealerApply.homeCta}
          Icon={Handshake}
        />
      </div>
    </section>
  );
}

function CtaCard({
  tone,
  eyebrow,
  title,
  text,
  href,
  cta,
  Icon,
}: {
  tone: "red" | "dark";
  eyebrow?: string;
  title: string;
  text: string;
  href: string;
  cta: string;
  Icon: typeof Factory;
}) {
  return (
    <div
      className={`zw-cta-card relative flex flex-col overflow-hidden rounded-[6px] p-8 text-white sm:p-10 ${
        tone === "red" ? "bg-zw-red-600" : "zw-steel-section bg-zw-ink"
      }`}
    >
      <Icon aria-hidden="true" size={180} strokeWidth={1} className="pointer-events-none absolute -bottom-8 -right-6 text-white/10" />
      {eyebrow && (
        <div className="relative mb-4 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.22em] text-white/70">
          <span className="h-[2px] w-8 bg-white/60" />
          {eyebrow}
        </div>
      )}
      <h2 className="relative max-w-md font-display text-3xl font-bold uppercase leading-[0.95] sm:text-4xl">{title}</h2>
      <p className="relative mt-3 max-w-md text-white/85">{text}</p>
      <Link
        href={href}
        className={`group relative mt-8 inline-flex w-fit items-center gap-2 rounded-[4px] px-6 py-3.5 text-sm font-bold uppercase tracking-wide transition-colors zw-focus ${
          tone === "red" ? "bg-white text-zw-red-700 hover:bg-zw-ink hover:text-white" : "bg-zw-red-600 text-white hover:bg-white hover:text-zw-ink"
        }`}
      >
        {cta}
        <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
      </Link>
    </div>
  );
}

/**
 * Sik sorulan sorular (ilk 6) ve blog (en yeni 3) yan yana.
 *
 * SEO icin onemli: sorular sayfanin HTML'inde duz metin olarak bulunur
 * ve ayrica FAQPage yapisal verisi olarak arama motoruna bildirilir
 * (bkz. app/(site)/page.tsx).
 */
export function FaqAndBlog() {
  const t = useT();
  const db = useDatabase();
  const faqs = useMemo(() => db.faqs.slice(0, 6), [db]);
  const posts = useMemo(() => listBlogPosts(db).slice(0, 3), [db]);

  return (
    <section className="bg-white">
      <div className="zw-container zw-section grid gap-12 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
        {faqs.length > 0 && (
          <div>
            <SectionTitle
              title={t.home.faqTitle}
              action={<ViewAll href="/sss" label={t.common.viewAll} />}
            />
            <Accordion icon="plus" items={faqs.map((f) => ({ id: f.id, title: f.question, content: f.answer }))} />
          </div>
        )}

        <div>
          <SectionTitle
            title={t.home.blogTitle}
            action={<ViewAll href="/blog" label={t.common.viewAll} />}
          />
          <ul className="space-y-4">
            {posts.map((post) => (
              <li key={post.id}>
                <Link href={`/blog/${post.slug}`} className="group flex gap-4 rounded-[6px] p-2 transition-colors hover:bg-zw-grey-50">
                  <div className="aspect-[4/3] w-32 shrink-0 overflow-hidden rounded-[4px] bg-zw-grey-100 sm:w-40">
                    <ProductImage
                      src={post.coverUrl}
                      alt={post.title}
                      label={post.category}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="min-w-0 py-1">
                    <div className="text-xs font-bold uppercase tracking-wide text-zw-red-600">{post.category}</div>
                    <h3 className="mt-1 font-display text-xl font-bold leading-tight text-zw-ink group-hover:text-zw-red-600">
                      {post.title}
                    </h3>
                    <div className="mt-2 text-xs text-zw-grey-500">{formatDate(post.publishedAt)}</div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
