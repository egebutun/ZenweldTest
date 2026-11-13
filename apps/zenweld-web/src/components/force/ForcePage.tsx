"use client";

import {
  ArrowDown,
  ArrowRight,
  BadgeCheck,
  Ban,
  Check,
  Cpu,
  Flame,
  Fuel,
  Gauge,
  Heart,
  Magnet,
  Monitor,
  ShieldCheck,
  SlidersHorizontal,
  Thermometer,
  Weight,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { Product } from "@zenweld/data";
import { isProductInStock, useDatabase } from "@zenweld/store";
import { ProductImage } from "@zenweld/ui";
import Link from "next/link";
import { CardCartButton, ProductPrice } from "@/components/product/ProductCard";
import { useFavourites } from "@/lib/favourites";
import { FORCE_SHOWCASE, useForceProducts, type ForceMachine, type ForceMachineKey } from "@/lib/force";
import { useT } from "@/lib/i18n-client";
import { ForceDealerMap } from "./ForceDealerMap";
import { ForceSpecTable } from "./ForceSpecTable";
import { useReveal } from "./force-motion";

/**
 * FORCE SERISI TANITIM SAYFASI (/force; KARARLAR K-114)
 *
 * Ust menudeki FORCE ve anasayfa tanitim alanindaki "Force Serisini Incele"
 * buraya gelir. Bolumler:
 *  1. Acilis: dev FORCE yazisi, kaynak ustasi, dort makine (sabit durur).
 *  2. Kayan serit (yontemler).
 *  3. Dort yontem. Tek seri: makine kartlari (bolumlere iner).
 *  4. Her makineye bir bolum: tur, slogan, one cikan ozellikler, ozellik
 *     simgeleri, rakamlar, fiyat, sepet.
 *  5. Her Force'ta standart: ortak ozellikler.
 *  6. Kapanis: Destek ve Garanti, Force bayileri haritasi.
 *  7. Teknik ozellikler: ziyaretcinin sectigi makineler yan yana.
 * Kaydirinca yalnizca yumusak belirme vardir (force-motion.tsx).
 * Yazilar ve teknik degerler Force katalogundan (packages/i18n › forcePage);
 * fiyat, stok ve sepet urun kayitlarindan.
 */
export function ForcePage() {
  const products = useForceProducts();
  return (
    <div className="bg-[#0a0b0d]">
      <Hero />
      <Ticker />
      <Lineup />
      {FORCE_SHOWCASE.map((machine, i) => (
        <Chapter key={machine.key} index={i} machine={machine} product={products[machine.key]} />
      ))}
      <Dna />
      <FinalCta />
      <Compare products={products} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 1. Acilis                                                           */
/* ------------------------------------------------------------------ */

/** Afisteki kaynak ustasi (zemini kaldirilmis; alt kismi makinelerin arkasinda kalir). */
const WELDER = "/images/force/kaynak-ustasi.webp";

/** Acilistaki dizilis: soldan saga, genislik (%), derinlik; makineler aralikli ve sabit durur. */
const HERO_LINEUP: { key: ForceMachineKey; width: string; z: number; delay: number; lift: string }[] = [
  { key: "arc", width: "w-[22%] md:w-[21%]", z: 10, delay: 350, lift: "mb-[2%]" },
  { key: "mig", width: "w-[30%] md:w-[28%]", z: 30, delay: 150, lift: "" },
  { key: "tig", width: "w-[24%] md:w-[22%]", z: 20, delay: 250, lift: "mb-[1%]" },
  { key: "cut", width: "w-[21%] md:w-[19%]", z: 10, delay: 450, lift: "mb-[3%]" },
];

function Hero() {
  const f = useT().forcePage;
  return (
    <section className="relative isolate flex flex-col overflow-hidden text-white md:min-h-[calc(100svh-72px)]">
      <div aria-hidden="true" className="zw-force-hero-bg absolute inset-0 -z-10" />

      <div className="zw-container relative pt-8">
        <p className="zw-force-in flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.32em] text-zw-red-500 md:text-xs">
          <span className="h-px w-10 bg-zw-red-500" />
          {f.eyebrow}
        </p>
      </div>

      <h1 className="relative mt-3 select-none text-center font-display font-bold leading-[0.78] md:mt-0">
        <span className="sr-only">{f.title}</span>
        <span aria-hidden="true" className="zw-force-word block">
          FORCE
        </span>
      </h1>

      {/* Katmanlar: arkada FORCE yazisi, onun altindan yukselen kaynak ustasi, onde dort
          makine. Usta yazinin alt kenarina, makineler ustanin govdesine biner. */}
      <div aria-hidden="true" className="zw-force-welder pointer-events-none relative z-10 mx-auto -mt-[5vw] w-[74%] max-w-[580px] md:-mt-[3.4vw] md:w-[35%]">
        <div className="zw-force-welder-in relative">
          <ProductImage src={WELDER} alt="" label="Zenweld kaynak ustası" priority className="w-full" />
          {/* Torc ucundaki ark */}
          <span className="zw-force-torch absolute left-[85.5%] top-[85%]" />
        </div>
      </div>

      {/* Dort makine aralikli durur ve ustanin govdesinin alt kismina biner. */}
      <div className="relative z-20 mx-auto -mt-[13vw] flex w-full max-w-[1100px] items-end justify-center px-2 md:-mt-[4.4vw] md:max-w-[920px] 2xl:max-w-[1080px]">
        {/* Makinelerin bastigi isikli zemin cizgisi */}
        <div aria-hidden="true" className="zw-force-floor absolute inset-x-[-30%] bottom-[3%] h-px" />
        {HERO_LINEUP.map(({ key, width, z, delay, lift }) => {
          const machine = FORCE_SHOWCASE.find((m) => m.key === key)!;
          return (
            <div key={key} className={`zw-force-unit relative mx-[0.5%] shrink-0 md:mx-[1.2%] ${width} ${lift}`} style={{ zIndex: z }}>
              <div className="zw-force-rise" style={{ "--d": `${delay}ms` } as React.CSSProperties}>
                <ProductImage src={machine.image} alt={machine.name} label={machine.name} priority className="w-full" />
              </div>
            </div>
          );
        })}
      </div>

      <div className="zw-container relative z-20 mt-auto flex flex-col gap-6 pb-10 pt-8 md:flex-row md:items-end md:justify-between md:pb-9 md:pt-5">
        <div className="zw-force-in [animation-delay:500ms]">
          <p className="font-display text-[40px] font-bold uppercase leading-[0.92] md:text-[54px]">
            <span className="block">{f.heroLineA}</span>
            <span className="block text-zw-red-500">{f.heroLineB}</span>
          </p>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-white/65 md:text-base">{f.heroText}</p>
        </div>
        <div className="zw-force-in flex flex-wrap gap-3 [animation-delay:650ms]">
          <a
            href="#makineler"
            className="inline-flex items-center gap-2 rounded-[4px] bg-zw-red-600 px-6 py-3.5 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-zw-red-700"
          >
            {f.heroCta}
            <ArrowDown size={16} />
          </a>
          <a
            href="#karsilastirma"
            className="inline-flex items-center gap-2 rounded-[4px] border border-white/25 px-6 py-3.5 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:border-white hover:bg-white hover:text-zw-ink"
          >
            {f.heroCompare}
          </a>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 2. Kayan serit                                                      */
/* ------------------------------------------------------------------ */

function Ticker() {
  const words = useT().forcePage.ticker;
  const row = (copy: number) => (
    <ul aria-hidden={copy === 1} className="flex shrink-0 items-center">
      {words.map((w) => (
        <li key={`${copy}-${w}`} className="flex items-center gap-8 whitespace-nowrap px-8 font-display text-2xl font-bold uppercase tracking-wide md:text-[32px]">
          {w}
          <span aria-hidden="true" className="h-2.5 w-2.5 rotate-45 bg-white/80" />
        </li>
      ))}
    </ul>
  );
  return (
    <div className="zw-force-ticker relative overflow-hidden bg-zw-red-600 py-4 text-white">
      <div className="zw-force-marquee flex w-max">
        {row(0)}
        {row(1)}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 3. Dort yontem. Tek seri.                                           */
/* ------------------------------------------------------------------ */

function Lineup() {
  const f = useT().forcePage;
  const ref = useReveal<HTMLElement>();
  return (
    <section id="makineler" ref={ref} className="zw-fx scroll-mt-[72px] bg-[#0e1012] py-16 text-white md:py-24">
      <SectionHead eyebrow={f.eyebrow} title={f.lineupTitle} text={f.lineupText} dark />
      <div className="zw-container mt-10 grid grid-cols-2 gap-3 md:mt-14 md:gap-5 lg:grid-cols-4">
        {FORCE_SHOWCASE.map((m, i) => {
          const copy = f.machines[m.key];
          return (
            <a
              key={m.key}
              href={`#force-${m.key}`}
              data-fx="up"
              style={{ "--d": `${150 + i * 110}ms` } as React.CSSProperties}
              className="zw-force-card group relative flex flex-col overflow-hidden rounded-[6px] border border-white/10 p-4 transition duration-500 hover:-translate-y-1.5 hover:border-zw-red-600/60 md:p-6"
            >
              <div className="relative flex aspect-square items-center justify-center">
                <div aria-hidden="true" className="zw-force-card-glow absolute inset-[12%] rounded-full" />
                <ProductImage
                  src={m.image}
                  alt={m.name}
                  label={m.name}
                  className="relative w-[88%] transition-transform duration-500 group-hover:-translate-y-1 group-hover:scale-[1.06]"
                />
              </div>
              <div className="mt-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-zw-red-500">{copy.method}</div>
              <div className="mt-1 font-display text-2xl font-bold leading-none md:text-[32px]">{m.name}</div>
              <p className="mt-2 hidden text-sm text-white/55 sm:block">{copy.slogan}</p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-white/70 transition-colors group-hover:text-white">
                <span className="h-px w-6 bg-zw-red-600 transition-all duration-500 group-hover:w-10" />
                <ArrowDown size={14} />
              </span>
            </a>
          );
        })}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 4. Makine bolumleri                                                 */
/* ------------------------------------------------------------------ */

/** Katalogdaki ozellik simgelerinin karsiligi. */
const FEATURE_ICONS: Record<ForceMachine["features"][number], LucideIcon> = {
  thermal: Thermometer,
  emc: Magnet,
  arcForce: Zap,
  hotStart: Flame,
  antiStick: Ban,
  lcd: Monitor,
  generator: Fuel,
  ipTest: BadgeCheck,
  igbt: Cpu,
  synergic: SlidersHorizontal,
};

function Chapter({ index, machine, product }: { index: number; machine: ForceMachine; product?: Product }) {
  const f = useT().forcePage;
  const copy = f.machines[machine.key];
  const reveal = useReveal<HTMLDivElement>();
  const reverse = index % 2 === 1;

  return (
    <section
      id={`force-${machine.key}`}
      className={`relative isolate scroll-mt-[72px] overflow-hidden py-16 text-white md:py-28 ${
        reverse ? "zw-steel" : "bg-[#0a0b0d]"
      }`}
    >
      <div
        aria-hidden="true"
        className={`zw-force-ghost pointer-events-none absolute top-1/2 -z-10 select-none font-display font-bold leading-none ${
          reverse ? "left-[-4%]" : "right-[-4%]"
        }`}
      >
        {machine.ghost}
      </div>

      {/* Masaustunde: gorsel ve altinda ozellik simgeleri bir yanda, yazilar obur yanda. */}
      <div ref={reveal} className="zw-fx zw-container grid gap-10 lg:grid-cols-2 lg:gap-x-16">
        {/* Gorsel: kirmizi isik ve yansima */}
        <div className={`relative lg:row-start-1 ${reverse ? "lg:col-start-2" : "lg:col-start-1"}`} data-fx="up">
          <div aria-hidden="true" className="zw-force-halo absolute inset-[6%] rounded-full" />
          <div className="relative mx-auto max-w-[520px]">
            <ProductImage src={machine.image} alt={machine.name} label={machine.name} className="zw-force-reflect w-full" />
          </div>
        </div>

        <div className={`lg:row-span-2 lg:row-start-1 lg:self-center ${reverse ? "lg:col-start-1" : "lg:col-start-2"}`}>
          <h2 data-fx="up" className="font-display text-5xl font-bold leading-[0.9] md:text-7xl">
            {machine.name}
          </h2>
          <p data-fx="up" style={{ "--d": "150ms" } as React.CSSProperties} className="mt-4 text-sm font-semibold uppercase tracking-[0.16em] text-white/60">
            {copy.method}
          </p>
          <p data-fx="up" style={{ "--d": "220ms" } as React.CSSProperties} className="mt-1 font-display text-[26px] font-semibold uppercase leading-tight text-zw-red-500 md:text-[34px]">
            {copy.slogan}
          </p>
          <div data-fx="up" style={{ "--d": "300ms" } as React.CSSProperties} className="mt-6 max-w-xl">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/45">{f.highlightsTitle}</h3>
            <ul className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-2">
              {copy.highlights.map((h) => (
                <li key={h} className="flex gap-2 text-[15px] leading-snug text-white/75">
                  <Check size={16} strokeWidth={2.5} className="mt-0.5 shrink-0 text-zw-red-500" />
                  {h}
                </li>
              ))}
            </ul>
          </div>

          <dl data-fx="up" style={{ "--d": "380ms" } as React.CSSProperties} className="mt-8 grid max-w-xl grid-cols-3 border-y border-white/10">
            {copy.stats.map((s, i) => (
              <div key={s.label} className={`py-5 ${i ? "border-l border-white/10 pl-4 md:pl-6" : "pr-4"}`}>
                <dt className="sr-only">{s.label}</dt>
                <dd>
                  <span className="whitespace-nowrap font-display text-3xl font-bold leading-none sm:text-4xl md:text-5xl">
                    {s.value}
                  </span>
                  {s.unit && <span className="ml-1 font-display text-xl font-bold text-zw-red-500 md:text-2xl">{s.unit}</span>}
                  <span className="mt-2 block text-[11px] uppercase tracking-[0.14em] text-white/45 md:text-xs">{s.label}</span>
                </dd>
              </div>
            ))}
          </dl>

          {product && (
            <div data-fx="up" style={{ "--d": "460ms" } as React.CSSProperties} className="mt-8 flex flex-wrap items-end gap-x-8 gap-y-5">
              <div>
                <ProductPrice product={product} dark />
              </div>
              <ChapterActions product={product} />
            </div>
          )}
          <div data-fx="up" style={{ "--d": "520ms" } as React.CSSProperties} className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold">
            {product && (
              <Link href={`/urun/${product.slug}`} className="group inline-flex items-center gap-1.5 text-white hover:text-zw-red-500">
                {f.productLink}
                <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
              </Link>
            )}
            <a href="#karsilastirma" className="text-white/55 hover:text-white">
              {f.specsLink}
            </a>
          </div>
        </div>

        {/* Katalogdaki ozellik simgeleri */}
        <ul
          data-fx="up"
          style={{ "--d": "200ms" } as React.CSSProperties}
          className={`grid grid-cols-2 gap-2 sm:grid-cols-3 lg:row-start-2 lg:self-start ${reverse ? "lg:col-start-2" : "lg:col-start-1"}`}
        >
          {machine.features.map((key) => {
            const Icon = FEATURE_ICONS[key];
            return (
              <li key={key} className="flex items-center gap-2.5 rounded-[4px] border border-white/10 bg-white/[0.03] px-3 py-2.5">
                <Icon size={18} strokeWidth={1.75} className="shrink-0 text-zw-red-500" />
                <span className="text-xs leading-snug text-white/70">{f.featureLabels[key]}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

function ChapterActions({ product }: { product: Product }) {
  const favourites = useFavourites();
  const inStock = isProductInStock(product, undefined, useDatabase());
  const liked = favourites.has(product.id);
  return (
    <div className="flex w-full max-w-xs items-end gap-2 sm:w-64">
      <div className="min-w-0 flex-1">
        <CardCartButton product={product} inStock={inStock} accent />
      </div>
      <button
        type="button"
        onClick={() => favourites.toggle(product.id)}
        aria-label="Favori"
        aria-pressed={liked}
        className="flex h-[38px] w-10 shrink-0 items-center justify-center rounded-[4px] border border-white/25 text-white/70 transition-colors hover:border-white hover:text-white"
      >
        <Heart size={17} className={liked ? "fill-zw-red-500 text-zw-red-500" : ""} />
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 5. Her Force'ta standart                                            */
/* ------------------------------------------------------------------ */

/** Ortak ozelliklerin simgeleri, i18n › forcePage.dna sirasiyla. */
const DNA_ICONS = [Gauge, Weight, Fuel, ShieldCheck, BadgeCheck, Wrench];

function Dna() {
  const f = useT().forcePage;
  const ref = useReveal<HTMLElement>();
  return (
    <section ref={ref} className="zw-fx zw-force-dna relative overflow-hidden bg-white py-16 md:py-24">
      <SectionHead eyebrow={f.dnaEyebrow} title={f.dnaTitle} />
      <div className="zw-container mt-10 md:mt-14">
        <div className="grid gap-px overflow-hidden rounded-[6px] border border-zw-grey-200 bg-zw-grey-200 sm:grid-cols-2 lg:grid-cols-3">
          {f.dna.map((item, i) => {
            const Icon = DNA_ICONS[i % DNA_ICONS.length];
            return (
              <div
                key={item.title}
                data-fx="up"
                style={{ "--d": `${i * 90}ms` } as React.CSSProperties}
                className="group relative bg-white p-7 transition-colors duration-500 hover:bg-zw-ink md:p-9"
              >
                <span aria-hidden="true" className="absolute inset-x-0 top-0 h-[3px] origin-left scale-x-0 bg-zw-red-600 transition-transform duration-500 group-hover:scale-x-100" />
                <Icon size={30} strokeWidth={1.5} className="text-zw-red-600" />
                <h3 className="mt-8 font-display text-2xl font-bold uppercase leading-tight text-zw-ink transition-colors group-hover:text-white">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zw-grey-600 transition-colors group-hover:text-white/65">{item.text}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 7. Teknik ozellikler                                                */
/* ------------------------------------------------------------------ */

function Compare({ products }: { products: Record<ForceMachineKey, Product | undefined> }) {
  const f = useT().forcePage;
  const ref = useReveal<HTMLElement>();
  return (
    <section id="karsilastirma" ref={ref} className="zw-fx scroll-mt-[72px] bg-zw-grey-50 py-16 md:py-24">
      <SectionHead eyebrow={f.tableEyebrow} title={f.tableTitle} text={f.tableText} />
      <div data-fx="up" style={{ "--d": "250ms" } as React.CSSProperties} className="mx-auto mt-10 max-w-[1680px] px-4 sm:px-6">
        <ForceSpecTable products={products} />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 6. Kapanis (teknik tablonun ustunde)                               */
/* ------------------------------------------------------------------ */

function FinalCta() {
  const f = useT().forcePage;
  const ref = useReveal<HTMLElement>();
  return (
    <section ref={ref} className="zw-fx zw-force-cta relative isolate overflow-hidden py-20 text-white md:py-28">
      <div className="zw-container relative flex flex-col items-center text-center">
        <div data-fx="up" className="flex w-full max-w-3xl items-end justify-center">
          {FORCE_SHOWCASE.map((m) => (
            <ProductImage key={m.key} src={m.image} alt="" label="" className="-mx-[2%] w-1/4" />
          ))}
        </div>
        <h2 data-fx="up" style={{ "--d": "150ms" } as React.CSSProperties} className="mt-8 font-display text-5xl font-bold uppercase leading-[0.92] md:text-7xl">
          {f.ctaTitle}
        </h2>
        <div data-fx="up" style={{ "--d": "250ms" } as React.CSSProperties} className="mt-7">
          <Link
            href="/destek"
            className="inline-flex items-center gap-2 rounded-[4px] border border-white/25 px-6 py-3.5 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:border-white hover:bg-white hover:text-zw-ink"
          >
            {f.ctaSupport}
          </Link>
        </div>
        <ForceDealerMap />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

function SectionHead({ eyebrow, title, text, dark = false }: { eyebrow: string; title: string; text?: string; dark?: boolean }) {
  return (
    <div className="zw-container">
      <p data-fx="up" className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.3em] text-zw-red-600 md:text-xs">
        <span className="h-px w-10 bg-zw-red-600" />
        {eyebrow}
      </p>
      <h2
        data-fx="up"
        style={{ "--d": "100ms" } as React.CSSProperties}
        className={`mt-4 max-w-4xl font-display text-[44px] font-bold uppercase leading-[0.92] md:text-7xl ${dark ? "text-white" : "text-zw-ink"}`}
      >
        {title}
      </h2>
      {text && (
        <p data-fx="up" style={{ "--d": "200ms" } as React.CSSProperties} className={`mt-4 max-w-xl ${dark ? "text-white/60" : "text-zw-grey-600"}`}>
          {text}
        </p>
      )}
    </div>
  );
}
