"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductImage } from "@zenweld/ui";
import { MenuIcon } from "@/components/common/MenuIcons";
import { useT } from "@/lib/i18n-client";
import { supportWarrantyColumns } from "@/lib/menu";

/**
 * Ust bolumun arkasindaki urun gorseli (gecici; gercek gorsel gelince
 * yalnizca bu adres degisir).
 */
const HERO_IMAGE = "/images/products/evomig-205-p.webp";

/**
 * DESTEK VE GARANTI (/destek)
 *
 * Ust menudeki Destek ve Garanti basligi ve menudeki "Tumunu Gor" bu
 * sayfaya gelir. Ustte baslik ve efektli urun gorseli, altinda menudeki
 * baglantilarin aynisi ayni sirada sembollu kartlar halinde (Iletisim
 * dahil sekiz kart).
 */
export function SupportHub() {
  const t = useT();
  const s = t.supportHub;
  const links = supportWarrantyColumns(t).flatMap((col) => col.links);

  return (
    <>
      {/* 1. Baslik: solda yazi, sagda bulaniklasarak acik griye karisan urun
          gorseli (telefonda gorsel yazinin altinda). */}
      <section className="zw-support-hero relative isolate overflow-hidden bg-zw-grey-100">
        <div aria-hidden="true" className="zw-support-hero-glow absolute inset-x-0 bottom-0 h-[52%] md:inset-y-0 md:left-auto md:h-auto md:w-[72%]" />
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[52%] md:inset-y-0 md:left-auto md:h-auto md:w-[72%]">
          <ProductImage
            src={HERO_IMAGE}
            alt=""
            label=""
            priority
            className="zw-support-hero-image h-full w-full object-cover mix-blend-multiply"
          />
        </div>
        <div aria-hidden="true" className="zw-support-hero-frost absolute inset-0" />

        <div className="zw-container relative pb-60 pt-12 md:py-24 lg:py-28">
          <h1 className="zw-support-hero-text font-display text-[52px] font-bold leading-[0.92] text-zw-ink md:text-7xl">
            <span className="block text-zw-red-600">{s.brand}</span>
            <span className="block">{t.nav.supportWarranty}</span>
          </h1>
          <p className="zw-support-hero-text mt-6 max-w-md text-base leading-relaxed text-zw-grey-700 [animation-delay:120ms] md:text-lg">
            {s.heroText}
          </p>
        </div>
      </section>

      {/* 2. Ne yapmak istiyorsunuz: menudeki baglantilar, sembolleri ustte */}
      <section className="zw-container py-16 md:py-20">
        <div className="text-center">
          <h2 className="font-display text-3xl font-bold text-zw-ink md:text-[42px]">{s.tasksTitle}</h2>
          <p className="mt-2 text-zw-grey-600">{s.tasksText}</p>
        </div>

        {/* Telefonda iki sutun ve kisa kart (aciklama gizli); tek kalan kart ortalanir. */}
        <ul className="mt-8 flex flex-wrap justify-center gap-3 sm:mt-10 sm:gap-4">
          {links.map((link) => (
            <li key={link.href} className="w-[calc(50%-6px)] sm:w-[calc(50%-8px)] lg:w-[calc(25%-12px)]">
              <Link
                href={link.href}
                className="group flex h-full flex-col rounded-[6px] bg-zw-grey-100 p-4 transition duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-[0_14px_40px_-12px_rgb(20_22_25/0.25)] sm:p-6 zw-focus"
              >
                {link.icon && (
                  <MenuIcon name={link.icon} size={34} className="h-7 w-7 text-zw-red-600 sm:h-[34px] sm:w-[34px]" />
                )}
                <h3 className="mt-5 text-lg font-semibold leading-tight text-zw-ink sm:mt-8 sm:text-[22px]">{link.label}</h3>
                {link.description && (
                  <p className="mt-2.5 hidden text-sm leading-relaxed text-zw-grey-600 sm:block">{link.description}</p>
                )}
                {link.cta && (
                  <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-[13px] font-semibold text-zw-ink group-hover:text-zw-red-600 sm:pt-6 sm:text-sm">
                    {link.cta}
                    <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
