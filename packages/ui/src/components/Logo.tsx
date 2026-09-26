"use client";

import { useState } from "react";

/**
 * ZENWELD LOGOSU
 *
 * Gercek logo dosyalari (her iki uygulamanin public klasorunde):
 *
 *   /images/brand/zenweld-logo.svg         acik zeminler icin (kirmizi yazili)
 *   /images/brand/zenweld-logo-light.svg   koyu zeminler icin (beyaz yazili)
 *
 * YANIP SONME NOTU
 * Onceki surum once gomulu yedek isareti ciziyor, arka planda dosyayi
 * new Image() ile deneyip yuklendiginde gercek logoyla degistiriyordu.
 * Bu yuzden her sayfa acilisinda once cizilmis yedek logo, hemen ardindan
 * gercek logo goruluyordu.
 *
 * Simdi gercek dosya dogrudan basiliyor; yedek isaret yalnizca dosya
 * gercekten yuklenemezse (onError) devreye giriyor. Dosyalar depoda
 * oldugu icin normal kullanimda yedek hic gorunmez.
 */

const SRC: Record<"dark" | "light", string> = {
  dark: "/images/brand/zenweld-logo.svg",
  light: "/images/brand/zenweld-logo-light.svg",
};

/** Gomulu yedek logo — gercek dosya yuklenemezse kullanilir. */
function FallbackMark({
  className,
  variant,
  label,
  suffix,
}: {
  className: string;
  variant: "dark" | "light";
  label: string;
  suffix?: string;
}) {
  const text = variant === "light" ? "#FFFFFF" : "#141619";
  const width = suffix ? 320 : 220;

  return (
    <svg viewBox={`0 0 ${width} 40`} className={className} role="img" aria-label={label}>
      <path d="M2 4 h26 l-18 24 h18 v8 H0 l18-24 H2 Z" fill="#b82429" />
      <text
        x="36"
        y="30"
        fill={text}
        fontFamily="Barlow Condensed, Arial Narrow, sans-serif"
        fontSize={suffix ? 28 : 30}
        fontWeight="700"
        letterSpacing="1"
      >
        {suffix ? `ZENWELD-${suffix}` : "ZENWELD"}
      </text>
    </svg>
  );
}

export function ZenweldLogo({
  className = "",
  variant = "dark",
}: {
  className?: string;
  variant?: "dark" | "light";
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <FallbackMark className={className} variant={variant} label="Zenweld" />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={SRC[variant]}
      alt="Zenweld"
      className={className}
      onError={() => setFailed(true)}
    />
  );
}

/**
 * Bayi magazasi logosu: Zenweld logosu + bayi adi.
 *
 * Hizalama notu: logo gorselinde kelime markasi ustteki tac yuzunden kutunun
 * tam ortasinda degil, %73 yuksekliginde duruyor. Bayi adi da bu optik
 * merkeze hizalanir, aksi halde logonun uzerinde kalip kopuk gorunuyor.
 *
 * Olculer logo yuksekligine (height) bagli em degerleridir; boylece her
 * kullanim boyutunda oran korunur.
 */
const WORDMARK_CENTER = 0.73; // logo yuksekliginin orani

export function ZenweldBayiLogo({
  className = "",
  variant = "dark",
  suffix = "BAYİ-A",
  height = 32,
}: {
  className?: string;
  variant?: "dark" | "light";
  suffix?: string;
  /** Logo yuksekligi (px). Yazi boyutu ve hizasi bundan turetilir. */
  height?: number;
}) {
  const [failed, setFailed] = useState(false);
  const color = variant === "light" ? "#FFFFFF" : "#141619";
  const shift = WORDMARK_CENTER - 0.5; // kutu merkezinden asagi kayma orani

  if (failed) {
    return (
      <FallbackMark
        className={className}
        variant={variant}
        label={`Zenweld ${suffix}`}
        suffix={suffix}
      />
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-[0.28em] ${className}`}
      style={{ height, fontSize: height }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={SRC[variant]}
        alt={`Zenweld ${suffix}`}
        className="h-full w-auto"
        onError={() => setFailed(true)}
      />
      <span
        aria-hidden
        className="w-px shrink-0"
        style={{
          height: "0.62em",
          transform: `translateY(${shift}em)`,
          backgroundColor:
            variant === "light" ? "rgba(255,255,255,0.4)" : "rgba(20,22,25,0.25)",
        }}
      />
      <span
        className="whitespace-nowrap font-display font-bold uppercase leading-none tracking-[0.04em]"
        style={{ color, fontSize: "0.5em", transform: `translateY(${shift * 2}em)` }}
      >
        {suffix}
      </span>
    </span>
  );
}
