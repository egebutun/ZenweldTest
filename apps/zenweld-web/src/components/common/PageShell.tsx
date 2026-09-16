"use client";

import type { ReactNode } from "react";
import { ProductImage } from "./ProductImage";

export function PageHero({
  title,
  subtitle,
  image,
}: {
  title: string;
  subtitle?: string;
  image?: string;
}) {
  if (image) {
    return (
      <section className="relative overflow-hidden bg-zw-ink">
        <ProductImage
          src={image}
          alt={title}
          label={title}
          className="absolute inset-0 h-full w-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-zw-ink via-zw-ink/80 to-transparent" />
        <div className="zw-container relative py-16 text-white lg:py-24">
          <h1 className="max-w-3xl font-display text-4xl font-bold uppercase leading-tight sm:text-5xl">
            {title}
          </h1>
          {subtitle && <p className="mt-4 max-w-2xl text-zw-grey-300">{subtitle}</p>}
        </div>
      </section>
    );
  }

  return (
    <section className="border-b border-zw-grey-200 bg-zw-grey-50">
      <div className="zw-container py-12">
        <h1 className="font-display text-4xl font-bold uppercase sm:text-5xl">{title}</h1>
        {subtitle && <p className="mt-3 max-w-2xl text-zw-grey-600">{subtitle}</p>}
      </div>
    </section>
  );
}

export function Prose({ children }: { children: ReactNode }) {
  return (
    <div className="zw-container py-12">
      <div className="max-w-3xl space-y-4 text-[15px] leading-relaxed text-zw-grey-700">
        {children}
      </div>
    </div>
  );
}

const LOREM =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";

export function LoremParagraphs({ count = 4 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <p key={i}>{LOREM}</p>
      ))}
    </>
  );
}

/** Basit icerik sayfasi iskeleti (KVKK, gizlilik, iade vb.) */
export function SimpleContentPage({
  title,
  subtitle,
  paragraphs = 6,
}: {
  title: string;
  subtitle?: string;
  paragraphs?: number;
}) {
  return (
    <>
      <PageHero title={title} subtitle={subtitle} />
      <Prose>
        <LoremParagraphs count={paragraphs} />
      </Prose>
    </>
  );
}
