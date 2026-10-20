"use client";

import { ProductImage } from "@zenweld/ui";

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
