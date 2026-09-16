"use client";

import { ShieldCheck } from "lucide-react";
import { stockPhotos } from "@zenweld/data";
import { ProductImage } from "@/components/ProductImage";
import { useT } from "@/lib/i18n-client";
import { STORE } from "@/lib/store-config";

const LOREM =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.";

export default function AboutPage() {
  const t = useT();
  return (
    <>
      <section className="relative overflow-hidden bg-zw-ink">
        <ProductImage
          src={stockPhotos.industrialShop}
          alt={STORE.name}
          label={STORE.name}
          className="absolute inset-0 h-full w-full object-cover opacity-35"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-zw-ink to-transparent" />
        <div className="zw-container relative py-16 text-white">
          <h1 className="font-display text-4xl font-bold uppercase sm:text-5xl">
            {STORE.legalName}
          </h1>
          <p className="mt-3 flex items-center gap-2 text-zw-grey-300">
            <ShieldCheck size={18} className="text-zw-red-500" />
            {t.shop.authorizedDealer}
          </p>
        </div>
      </section>

      <div className="zw-container py-12">
        <div className="max-w-3xl space-y-4 text-[15px] leading-relaxed text-zw-grey-700">
          <p>{LOREM}</p>
          <p>{LOREM}</p>
          <p>{LOREM}</p>
        </div>

        <dl className="mt-10 grid gap-6 sm:grid-cols-3">
          <div>
            <dt className="text-xs font-bold uppercase tracking-wide text-zw-grey-500">Telefon</dt>
            <dd className="mt-1 font-semibold">{STORE.phone}</dd>
          </div>
          <div>
            <dt className="text-xs font-bold uppercase tracking-wide text-zw-grey-500">E-posta</dt>
            <dd className="mt-1 font-semibold">{STORE.email}</dd>
          </div>
          <div>
            <dt className="text-xs font-bold uppercase tracking-wide text-zw-grey-500">Adres</dt>
            <dd className="mt-1 font-semibold">{STORE.address}</dd>
          </div>
        </dl>
      </div>
    </>
  );
}
