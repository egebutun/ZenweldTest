"use client";

import { useState } from "react";

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
    <path d="M300 300 h120 l-84 112 h84 v40 H276 l84-112 h-60 z" fill="#d62027" opacity="0.9"/>
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
}: {
  src?: string;
  alt: string;
  className?: string;
  label?: string;
  priority?: boolean;
}) {
  const fallback = placeholderDataUri(label ?? alt);
  const [current, setCurrent] = useState(src && src.length > 0 ? src : fallback);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={current}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      onError={() => setCurrent(fallback)}
      className={className}
    />
  );
}

export { placeholderDataUri };
