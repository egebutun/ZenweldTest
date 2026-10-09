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
}: {
  className: string;
  variant: "dark" | "light";
  label: string;
}) {
  const text = variant === "light" ? "#FFFFFF" : "#141619";

  return (
    <svg viewBox="0 0 220 40" className={className} role="img" aria-label={label}>
      <path d="M2 4 h26 l-18 24 h18 v8 H0 l18-24 H2 Z" fill="#b82429" />
      <text
        x="36"
        y="30"
        fill={text}
        fontFamily="Barlow Condensed, Arial Narrow, sans-serif"
        fontSize={30}
        fontWeight="700"
        letterSpacing="1"
      >
        ZENWELD
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
