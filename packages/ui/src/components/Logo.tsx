"use client";

import { useEffect, useState } from "react";

/**
 * ZENWELD LOGOSU
 *
 * Gercek logo dosyasi su yollardan okunur (her iki uygulamanin public
 * klasorunde bulunur):
 *
 *   /images/brand/zenweld-logo.svg         acik zeminler icin (koyu yazili)
 *   /images/brand/zenweld-logo-light.svg   koyu zeminler icin (beyaz yazili)
 *
 * Dosya SVG degil PNG ise .png uzantisi da denenir. Hicbiri bulunamazsa
 * asagidaki gomulu SVG'ye duser — yani logo dosyasi yuklenmemis olsa bile
 * sitede hicbir zaman kirik gorsel cikmaz.
 */

const CANDIDATES: Record<"dark" | "light", string[]> = {
  dark: [
    "/images/brand/zenweld-logo.svg",
    "/images/brand/zenweld-logo.png",
  ],
  light: [
    "/images/brand/zenweld-logo-light.svg",
    "/images/brand/zenweld-logo-light.png",
    // Beyaz versiyon yoksa normal logoyu dene
    "/images/brand/zenweld-logo.svg",
    "/images/brand/zenweld-logo.png",
  ],
};

/** Gomulu yedek logo — gercek dosya bulunamadiginda kullanilir. */
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
      <path d="M2 4 h26 l-18 24 h18 v8 H0 l18-24 H2 Z" fill="#d62027" />
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

/**
 * Aday logo dosyalarini sirayla dener ve YALNIZCA basariyla yuklenen dosyayi
 * sayfaya koyar. Boylece dosya yokken kisa sureligine kirik gorsel gorunmez;
 * yerine gomulu yedek logo durur.
 */
function useResolvedLogo(variant: "dark" | "light"): string | null | undefined {
  // undefined = araniyor, null = hicbiri bulunamadi, string = bulundu
  const [src, setSrc] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;

    const probe = (url: string) =>
      new Promise<boolean>((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img.naturalWidth > 0);
        img.onerror = () => resolve(false);
        img.src = url;
      });

    (async () => {
      for (const candidate of CANDIDATES[variant]) {
        const ok = await probe(candidate);
        if (cancelled) return;
        if (ok) {
          setSrc(candidate);
          return;
        }
      }
      if (!cancelled) setSrc(null);
    })();

    return () => {
      cancelled = true;
    };
  }, [variant]);

  return src;
}

export function ZenweldLogo({
  className = "",
  variant = "dark",
}: {
  className?: string;
  variant?: "dark" | "light";
}) {
  const src = useResolvedLogo(variant);

  if (!src) {
    return <FallbackMark className={className} variant={variant} label="Zenweld" />;
  }

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="Zenweld" className={className} />;
}

/**
 * Bayi magazasi logosu: Zenweld logosu + bayi adi.
 * Bayi adi store-config.ts'ten gelir, varsayilan "BAYİ-A".
 */
export function ZenweldBayiLogo({
  className = "",
  variant = "dark",
  suffix = "BAYİ-A",
}: {
  className?: string;
  variant?: "dark" | "light";
  suffix?: string;
}) {
  const src = useResolvedLogo(variant);

  if (!src) {
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
    <span className={`inline-flex items-center gap-2 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={`Zenweld ${suffix}`} className="h-full w-auto" />
      <span
        className="font-display text-[0.8em] font-bold uppercase leading-none tracking-tight"
        style={{ color: variant === "light" ? "#FFFFFF" : "#141619" }}
      >
        {suffix}
      </span>
    </span>
  );
}
