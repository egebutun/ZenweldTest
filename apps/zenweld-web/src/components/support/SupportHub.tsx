"use client";

import Link from "next/link";
import { ArrowRight, Mail, MapPin, Navigation, Phone } from "lucide-react";
import { ProductImage } from "@zenweld/ui";
import { SupportIcon } from "@/components/support/SupportIcons";
import { useT } from "@/lib/i18n-client";
import { mapDirectionsUrl, supportWarrantyColumns, useCompany } from "@/lib/menu";

/**
 * Ust bolumun arkasindaki urun gorseli (gecici; gercek gorsel gelince
 * yalnizca bu adres degisir).
 */
const HERO_IMAGE = "/images/products/evomig-205-p.webp";

/**
 * DESTEK VE GARANTI (/destek)
 *
 * Ust menudeki Destek ve Garanti basligi ve menudeki "Tumunu Gor" bu
 * sayfaya gelir. Ustte baslik ve efektli urun gorseli, ortada menudeki
 * baglantilarin aynisi sembollu kartlar halinde, altta Iletisim
 * sayfasindaki bilgilerle "Destek ekibimize ulasin".
 */
export function SupportHub() {
  const t = useT();
  const s = t.supportHub;
  const company = useCompany();
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
                  <SupportIcon name={link.icon} size={34} className="h-7 w-7 text-zw-red-600 sm:h-[34px] sm:w-[34px]" />
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

      {/* 3. Destek ekibimize ulasin: Iletisim sayfasindaki bilgiler */}
      <section className="zw-container pb-12 md:pb-16">
        <div className="zw-support-contact relative overflow-hidden rounded-[6px] bg-zw-red-600 px-6 py-12 text-center text-white md:px-12 md:py-16">
          <h2 className="relative font-display text-3xl font-bold md:text-[42px]">{s.contactTitle}</h2>
          <p className="relative mx-auto mt-2 max-w-xl text-white/85">{s.contactText}</p>

          <div className="relative mx-auto mt-10 grid max-w-5xl gap-10 md:grid-cols-3 md:gap-6">
            <div className="flex flex-col items-center">
              <ContactIcon>
                <Mail size={22} strokeWidth={1.75} />
              </ContactIcon>
              <div className="mt-4 text-xs font-bold uppercase tracking-[0.16em] text-white/75">{s.contactEmail}</div>
              <a href={`mailto:${company.email}`} className="mt-2 text-lg font-semibold hover:underline">
                {company.email}
              </a>
              <p className="mt-1 text-sm text-white/75">{t.support.emailNote}</p>
            </div>

            {company.offices.map((office) => (
              <div key={office.id} className="flex flex-col items-center">
                <ContactIcon>
                  <MapPin size={22} strokeWidth={1.75} />
                </ContactIcon>
                <div className="mt-4 text-xs font-bold uppercase tracking-[0.16em] text-white/75">{office.city}</div>
                <div className="mt-2 text-sm leading-relaxed text-white/90">
                  {office.addressLines.map((line) => (
                    <div key={line}>{line}</div>
                  ))}
                </div>
                <div className="mt-2.5 space-y-0.5">
                  {office.phones.map((phone) => (
                    <a
                      key={phone}
                      href={`tel:${phone.replace(/\s/g, "")}`}
                      className="flex items-center justify-center gap-1.5 font-semibold hover:underline"
                    >
                      <Phone size={14} strokeWidth={2} />
                      {phone}
                    </a>
                  ))}
                </div>
                <a
                  href={mapDirectionsUrl(office)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 text-sm text-white/80 hover:text-white hover:underline"
                >
                  <Navigation size={13} />
                  {t.support.directions}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function ContactIcon({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/30">
      {children}
    </span>
  );
}
