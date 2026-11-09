"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { ProductImage } from "@zenweld/ui";
import { useT } from "@/lib/i18n-client";

/** Kurumsal sayfanin arka plan fotografi (ornek; sahibi gonderecek). */
const CORPORATE_PHOTO = "/images/hero/kaynak-atolyesi.webp";
/** Sahibinin gonderdigi urun fotograflari (arka plani saydam). */
const FORCE_PHOTO = "/images/home/force-mig-200.webp";
const LASER_PHOTO = "/images/home/jasic-lazer-kaynak.webp";

/** Her sayfanin ekranda kalma suresi; ilerleme cizgisi bu surede dolar. */
const SLIDE_MS = 7000;

type SlideId = "corporate" | "force" | "laser";

/**
 * ANASAYFA TANITIM ALANI (kayan uc sayfa)
 *
 * 1. Kurumsal: atolye fotografi, Zenweld'i ve farkini anlatan yazi.
 * 2. Force Serisi: karanlik endustriyel sahnede ForceMIG 200.
 * 3. Jasic Lazer: teknik cizim izgarasi ve lazer cizgisi uzerinde Jasic.
 *
 * Sayfalar kendiliginden doner: alttaki sekmede ilerleme cizgisi dolunca
 * sonraki sayfa gelir (CSS animasyonu; fare uzerindeyken ya da klavyeyle
 * icerideyken durur). Hareket azaltma tercihinde kendiliginden donmez.
 * Telefonda parmakla saga-sola kaydirilir. Butun sayfalarin metni sayfanin
 * HTML'inde vardir (arama motorlari icin); gorunmeyenler gizlenir.
 */
export function HomeHero() {
  const t = useT();
  const s = t.home.slides;
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);

  const slides: { id: SlideId; tab: string }[] = [
    { id: "corporate", tab: s.corporateTab },
    { id: "force", tab: s.forceTab },
    { id: "laser", tab: s.laserTab },
  ];
  const go = (i: number) => setActive((i + slides.length) % slides.length);

  return (
    <section
      aria-roledescription="carousel"
      aria-label={s.label}
      className="zw-hero relative isolate overflow-hidden bg-zw-ink text-white"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onPointerDown={(e) => {
        if (e.pointerType === "touch") touchX.current = e.clientX;
      }}
      onPointerUp={(e) => {
        if (touchX.current === null) return;
        const dx = e.clientX - touchX.current;
        touchX.current = null;
        if (Math.abs(dx) > 50) go(active + (dx < 0 ? 1 : -1));
      }}
    >
      {/* Arama motorlari icin sayfanin ana basligi */}
      <h1 className="sr-only">{t.home.heroTitle}</h1>

      <div className="relative h-[700px] sm:h-[640px] lg:h-[clamp(580px,74vh,720px)]">
        {slides.map((slide, i) => (
          <div
            key={slide.id}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} / ${slides.length}: ${slide.tab}`}
            aria-hidden={i !== active}
            inert={i !== active}
            data-active={i === active}
            className="zw-hero-slide absolute inset-0"
          >
            {slide.id === "corporate" && <CorporateSlide />}
            {slide.id === "force" && <ForceSlide />}
            {slide.id === "laser" && <LaserSlide />}
          </div>
        ))}
      </div>

      {/* Alt serit: sayfa sekmeleri (ilerleme cizgisiyle) ve oklar */}
      <div className="absolute inset-x-0 bottom-0 z-10 border-t border-white/10 bg-gradient-to-t from-black/50 to-transparent">
        <div className="zw-container flex items-stretch gap-2 sm:gap-6">
          <div className="flex flex-1 gap-2 sm:gap-6">
            {slides.map((slide, i) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => go(i)}
                aria-label={slide.tab}
                aria-current={i === active}
                className="group relative flex-1 py-4 text-left sm:py-5"
              >
                <span className="absolute inset-x-0 top-0 h-[3px] bg-white/15">
                  {i === active && (
                    <span
                      key={active}
                      className="zw-hero-progress absolute inset-0 origin-left bg-zw-red-600"
                      style={{ animationDuration: `${SLIDE_MS}ms`, animationPlayState: paused ? "paused" : "running" }}
                      onAnimationEnd={() => go(active + 1)}
                    />
                  )}
                </span>
                <span className="hidden items-baseline gap-2 sm:flex">
                  <span className={`font-display text-sm font-bold ${i === active ? "text-zw-red-500" : "text-white/40"}`}>
                    0{i + 1}
                  </span>
                  <span
                    className={`text-sm font-semibold uppercase tracking-wide transition-colors ${
                      i === active ? "text-white" : "text-white/50 group-hover:text-white/80"
                    }`}
                  >
                    {slide.tab}
                  </span>
                </span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 py-2.5">
            <ArrowButton label={s.previous} onClick={() => go(active - 1)}>
              <ChevronLeft size={18} />
            </ArrowButton>
            <ArrowButton label={s.next} onClick={() => go(active + 1)}>
              <ChevronRight size={18} />
            </ArrowButton>
          </div>
        </div>
      </div>
    </section>
  );
}

function ArrowButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 text-white transition-colors hover:border-white hover:bg-white hover:text-zw-ink zw-focus"
    >
      {children}
    </button>
  );
}

/* ------------------------------ Sayfalar ------------------------------ */

function CorporateSlide() {
  const t = useT();
  const s = t.home.slides;
  return (
    <>
      <div className="zw-hero-photo absolute inset-0">
        <ProductImage
          src={CORPORATE_PHOTO}
          alt=""
          label=""
          priority
          className="h-full w-full object-cover object-[70%_center]"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-zw-ink via-zw-ink/80 to-zw-ink/10" />
      <div className="absolute inset-0 bg-gradient-to-t from-zw-ink/90 via-transparent to-zw-ink/30" />
      <Embers />

      <SlideContent
        eyebrow={s.corporateEyebrow}
        title={s.corporateTitle}
        text={s.corporateText}
        primary={{ label: s.corporateCta, href: "/ekipmanlar" }}
        secondary={{ label: s.corporateCtaSecondary, href: "/hakkimizda" }}
      >
        <ul className="zw-hero-in mt-6 flex flex-wrap gap-x-6 gap-y-2 [animation-delay:260ms]">
          {s.corporatePoints.map((point) => (
            <li key={point} className="flex items-center gap-2 text-sm font-semibold text-white/90">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zw-red-600">
                <Check size={13} strokeWidth={3} />
              </span>
              {point}
            </li>
          ))}
        </ul>
      </SlideContent>
    </>
  );
}

function ForceSlide() {
  const t = useT();
  const s = t.home.slides;
  return (
    <>
      {/* Karanlik atolye: bulanik fotograf (kivilcim isiltisi), firca izli
          celik dokusu, urunun arkasinda kirmizi isik */}
      <div className="absolute inset-0 opacity-40 blur-2xl">
        <ProductImage src={CORPORATE_PHOTO} alt="" label="" className="h-full w-full scale-110 object-cover object-[85%_60%]" />
      </div>
      <div className="zw-steel absolute inset-0" />
      <div className="zw-hero-glow absolute inset-0" />
      <BigWord word="FORCE" />
      <Embers count={10} />

      <ProductStage src={FORCE_PHOTO} className="lg:right-[9%] lg:w-[33%]" />

      <SlideContent
        eyebrow={s.forceEyebrow}
        title={s.forceTitle}
        text={s.forceText}
        primary={{ label: s.forceCta, href: "/arama?q=Force" }}
        secondary={{ label: s.quoteCta, href: "/teklif-al" }}
        narrow
      />
    </>
  );
}

function LaserSlide() {
  const t = useT();
  const s = t.home.slides;
  return (
    <>
      {/* Teknik cizim izgarasi ve bir kez boydan boya gecen lazer cizgisi */}
      <div className="zw-blueprint absolute inset-0" />
      <div className="zw-hero-glow zw-hero-glow-cool absolute inset-0" />
      <BigWord word="LAZER" />
      <div aria-hidden="true" className="zw-laser-line absolute left-[46%] right-0 hidden lg:block" />

      <ProductStage src={LASER_PHOTO} className="lg:right-[6%] lg:w-[43%]" />

      <SlideContent
        eyebrow={s.laserEyebrow}
        title={s.laserTitle}
        text={s.laserText}
        primary={{ label: s.laserCta, href: "/ekipmanlar/lazer-makineleri" }}
        secondary={{ label: s.quoteCta, href: "/teklif-al" }}
        chips={s.laserModels}
        narrow
      />
    </>
  );
}

/* ------------------------------ Ortak parcalar ------------------------------ */

function SlideContent({
  eyebrow,
  title,
  text,
  primary,
  secondary,
  chips,
  narrow,
  children,
}: {
  eyebrow: string;
  title: string;
  text: string;
  primary: { label: string; href: string };
  secondary: { label: string; href: string };
  chips?: string[];
  /** Urun sayfalarinda yazi sol yarida kalir (sagda urun). */
  narrow?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="zw-container relative flex h-full flex-col justify-start pb-24 pt-10 sm:pt-14 lg:justify-center lg:pb-20 lg:pt-0">
      <div className={narrow ? "max-w-xl lg:max-w-[46%]" : "max-w-2xl"}>
        {/* Ust baslik yalnizca telefonda: genis ekranda ayni ad alttaki sekmede yazar. */}
        <div className="zw-hero-in mb-4 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.22em] text-zw-red-500 sm:hidden">
          <span className="h-[2px] w-8 bg-zw-red-600" />
          {eyebrow}
        </div>
        <h2 className="zw-hero-in font-display text-[40px] font-bold uppercase leading-[0.95] tracking-tight [animation-delay:80ms] sm:text-6xl lg:text-[68px]">
          {title}
        </h2>
        <p className="zw-hero-in mt-5 max-w-xl text-base leading-relaxed text-white/80 [animation-delay:160ms] sm:text-lg">
          {text}
        </p>
        {chips && (
          <ul className="zw-hero-in mt-5 hidden flex-wrap gap-2 [animation-delay:220ms] sm:flex">
            {chips.map((chip) => (
              <li
                key={chip}
                className="rounded-full border border-white/25 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/90 backdrop-blur-sm"
              >
                {chip}
              </li>
            ))}
          </ul>
        )}
        {children}
        <div className="zw-hero-in mt-7 flex flex-wrap gap-2.5 [animation-delay:300ms] sm:mt-8 sm:gap-3">
          <Link
            href={primary.href}
            className="group inline-flex items-center gap-2 rounded-[4px] bg-zw-red-600 px-4 py-3 text-[13px] font-bold uppercase tracking-wide text-white transition-colors hover:bg-zw-red-700 sm:px-6 sm:py-3.5 sm:text-sm zw-focus"
          >
            {primary.label}
            <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href={secondary.href}
            className="inline-flex items-center rounded-[4px] border border-white/40 px-4 py-3 text-[13px] font-bold uppercase tracking-wide text-white transition-colors hover:border-white hover:bg-white hover:text-zw-ink sm:px-6 sm:py-3.5 sm:text-sm zw-focus"
          >
            {secondary.label}
          </Link>
        </div>
      </div>
    </div>
  );
}

/** Urun fotografi: masaustunde sagda, telefonda yazinin altinda; altinda zemin yansimasi. */
function ProductStage({ src, className = "" }: { src: string; className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`absolute bottom-[78px] right-3 w-[64%] max-w-[300px] sm:right-8 sm:max-w-[340px] lg:bottom-auto lg:top-1/2 lg:max-w-none lg:-translate-y-1/2 ${className}`}
    >
      <div className="zw-hero-product">
        <ProductImage src={src} alt="" label="" className="zw-float h-auto w-full drop-shadow-[0_30px_40px_rgb(0_0_0/0.55)]" />
      </div>
      <div className="mx-auto -mt-4 h-6 w-3/4 rounded-[50%] bg-black/60 blur-xl" />
    </div>
  );
}

/** Arka planda dev, ici bos harflerle seri adi. */
function BigWord({ word }: { word: string }) {
  return (
    <div
      aria-hidden="true"
      className="zw-big-word zw-big-word-vertical pointer-events-none absolute right-0 top-1/2 hidden select-none font-display font-bold uppercase leading-none lg:block"
    >
      {word}
    </div>
  );
}

/** Yukari dogru suzulen kivilcim parcaciklari (sabit yerler: sunucu ve tarayici ayni cizer). */
const EMBERS = [
  [62, 78, 0, 5.2, 18], [70, 84, 1.1, 6.1, -24], [76, 72, 2.3, 4.8, 30], [82, 88, 0.6, 5.6, -12],
  [88, 76, 3.1, 6.4, 22], [66, 90, 4.2, 5.1, -30], [92, 82, 1.7, 4.6, 14], [72, 68, 2.8, 5.9, -18],
  [58, 86, 3.6, 6.2, 26], [86, 70, 0.3, 5.4, -20], [78, 92, 4.6, 4.9, 12], [95, 74, 2.1, 6.6, -26],
  [64, 74, 3.9, 5.3, 20], [80, 80, 1.4, 6.0, -14],
] as const;

function Embers({ count = EMBERS.length }: { count?: number }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      {EMBERS.slice(0, count).map(([x, y, delay, duration, dx], i) => (
        <span
          key={i}
          className="zw-ember absolute"
          style={
            {
              left: `${x}%`,
              top: `${y}%`,
              animationDelay: `${delay}s`,
              animationDuration: `${duration}s`,
              "--dx": `${dx}px`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
