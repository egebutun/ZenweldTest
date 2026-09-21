"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Urun gorseli.
 *
 * Uzak gorsel (Unsplash vb.) yuklenemezse markali SVG placeholder'a duser —
 * boylece sitede hicbir zaman kirik gorsel gorunmez.
 */

function placeholderDataUri(label: string): string {
  const safe = label
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .slice(0, 34);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#f1f2f4"/>
        <stop offset="100%" stop-color="#c9cdd2"/>
      </linearGradient>
    </defs>
    <rect width="800" height="800" fill="url(#g)"/>
    <path d="M300 300 h120 l-84 112 h84 v40 H276 l84-112 h-60 z" fill="#b82429" opacity="0.9"/>
    <text x="400" y="520" text-anchor="middle" font-family="Arial Narrow, Arial, sans-serif" font-size="34" font-weight="700" fill="#2b2f33" letter-spacing="1">ZENWELD</text>
    <text x="400" y="560" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" fill="#6b7178">${safe}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function ProductImage({
  src,
  alt,
  className = "",
  label,
  priority,
  alternates,
}: {
  src?: string;
  alt: string;
  className?: string;
  label?: string;
  priority?: boolean;
  /** src yuklenemezse sirayla denenecek adresler (orn. ayni dosyanin .svg hali). */
  alternates?: string[];
}) {
  const fallback = placeholderDataUri(label ?? alt);
  const chain = [...(src && src.length > 0 ? [src] : []), ...(alternates ?? []), fallback];
  const [index, setIndex] = useState(0);
  const current = chain[Math.min(index, chain.length - 1)];
  const ref = useRef<HTMLImageElement>(null);

  const next = () => setIndex((i) => Math.min(i + 1, chain.length - 1));

  useEffect(() => {
    setIndex(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, alternates?.join("|")]);

  // Gorsel, React hydration tamamlanmadan once hata verdiyse onError tetiklenmez;
  // bu yuzden mount sonrasi durumu elle kontrol ediyoruz.
  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth === 0) next();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={ref}
      src={current}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      onError={next}
      className={className}
    />
  );
}

export { placeholderDataUri };
