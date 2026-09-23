"use client";

import { useMemo } from "react";
import { useDatabase } from "@zenweld/store";
import type { Product, TopLevelSection } from "@zenweld/data";
import type { Dictionary } from "@zenweld/i18n";
import { useLocale, useT } from "./i18n-client";

/** Mega menudeki kucuk urun onizleme karti. */
export interface MenuProduct {
  id: string;
  name: string;
  href: string;
  imageUrl?: string;
  /** Satista one cikan 1-2 ozellik */
  highlights: string[];
}

export interface MenuLink {
  label: string;
  description?: string;
  href: string;
  /** Menude gosterilen ilk 6 urun (yalnizca urun menulerinde) */
  products?: MenuProduct[];
  /** Kategorideki toplam urun sayisi (6'dan fazlaysa "tumunu gor" onemli) */
  productCount?: number;
}

/** Mega menude gosterilecek en fazla urun sayisi (3 sutun x 2 satir). */
export const MENU_PRODUCT_LIMIT = 6;

export interface MenuColumn {
  /** Sol kolondaki grup (Unimig'deki "Welding Machines" gibi) */
  label: string;
  href: string;
  links: MenuLink[];
}

export interface TopMenu {
  id: string;
  label: string;
  href: string;
  columns: MenuColumn[];
}

const SECTIONS: { id: TopLevelSection; labelKey: keyof Dictionary["nav"] }[] = [
  { id: "ekipmanlar", labelKey: "equipment" },
  { id: "guvenlik", labelKey: "safety" },
  { id: "aksesuarlar", labelKey: "accessories" },
  { id: "dolgu-metalleri", labelKey: "fillerMetals" },
];

/** Yer tutucu metinleri ayirt etmek icin kullanilan lorem ipsum kaliplari. */
const LOREM = /\b(lorem|ipsum|dolor sit amet|consectetur|adipiscing|eiusmod|tempor|incididunt)\b/i;

/**
 * Menu kartinda gosterilecek 3 satislik ozellik secer.
 *
 * Bazi aksesuar tohumlarinda ozellikler henuz lorem ipsum oldugu icin
 * bunlar elenir; hicbiri kalmazsa kisa aciklamaya dusulur.
 */
function sellingPoints(product: Product, locale: "tr" | "en"): string[] {
  const real = product.highlights.map((h) => h[locale]).filter((h) => h && !LOREM.test(h));
  if (real.length > 0) return real.slice(0, 3);
  const short = product.shortDescription[locale];
  return short && !LOREM.test(short) ? [short] : [];
}

export function useMainMenu(): TopMenu[] {
  const db = useDatabase();
  const locale = useLocale();
  const t = useT();

  return useMemo(() => {
    const productMenus: TopMenu[] = SECTIONS.map(({ id, labelKey }) => {
      const groups = db.categoryGroups
        .filter((g) => g.section === id)
        .sort((a, b) => a.order - b.order);

      return {
        id,
        label: t.nav[labelKey],
        href: `/${id}`,
        columns: groups.map((group) => ({
          label: group.name[locale],
          href: `/${id}?grup=${group.slug}`,
          links: db.categories
            .filter((c) => c.section === id && c.group === group.slug)
            .sort((a, b) => a.order - b.order)
            .map((c) => {
              const inCategory = db.products.filter(
                (p) => p.active && p.categorySlug === c.slug,
              );
              return {
                label: c.name[locale],
                description: c.description[locale],
                href: `/${id}/${c.slug}`,
                productCount: inCategory.length,
                products: inCategory.slice(0, MENU_PRODUCT_LIMIT).map((p) => ({
                  id: p.id,
                  name: p.name,
                  href: `/urun/${p.slug}`,
                  imageUrl: p.images[0]?.url,
                  highlights: sellingPoints(p, locale),
                })),
              };
            }),
        })),
      };
    });

    const explore: TopMenu = {
      id: "kesfet",
      label: t.nav.explore,
      href: "/kesfet/hakkimizda",
      columns: [
        {
          label: t.nav.discover,
          href: "/kesfet/hakkimizda",
          links: [
            { label: t.explore.about, description: t.explore.aboutDesc, href: "/kesfet/hakkimizda" },
            { label: t.explore.weldersClub, description: t.explore.weldersClubDesc, href: "/kesfet/welders-club" },
            { label: t.explore.guide, description: t.explore.guideDesc, href: "/kesfet/rehber" },
            { label: t.explore.blog, description: t.explore.blogDesc, href: "/kesfet/blog" },
            { label: t.explore.events, description: t.explore.eventsDesc, href: "/kesfet/etkinlikler" },
            { label: t.explore.news, description: t.explore.newsDesc, href: "/kesfet/haberler" },
            { label: t.explore.msds, description: t.explore.msdsDesc, href: "/kesfet/msds" },
            { label: t.explore.checkWarranty, description: t.explore.checkWarrantyDesc, href: "/kesfet/garanti-sorgula" },
            { label: t.explore.batchCertificates, description: t.explore.batchCertificatesDesc, href: "/kesfet/parti-sertifikalari" },
            { label: t.explore.productSelector, description: t.explore.productSelectorDesc, href: "/kesfet/urun-secici" },
            { label: t.explore.registerWarranty, description: t.explore.registerWarrantyDesc, href: "/kesfet/garanti-kayit" },
          ],
        },
      ],
    };

    return [...productMenus, explore];
  }, [db, locale, t]);
}

/** Baslikta "Destek" uzerine gelince acilan kisa liste. */
export function useSupportMenu(): MenuLink[] {
  const t = useT();
  return useMemo(
    () => [
      { label: t.nav.findDealer, href: "/nereden-alabilirim" },
      { label: t.support.faqTitle, href: "/destek/sss" },
      { label: t.support.serviceTitle, href: "/destek/servis-agi" },
      { label: t.support.contactTitle, href: "/destek/iletisim" },
    ],
    [t],
  );
}

export function useFooterMenu() {
  const t = useT();
  return useMemo(
    () => [
      {
        title: t.footer.support,
        links: [
          { label: t.footer.helpCentre, href: "/destek" },
          { label: t.footer.registerWarranty, href: "/kesfet/garanti-kayit" },
          { label: t.footer.contact, href: "/destek/iletisim" },
          { label: t.footer.recall, href: "/destek/geri-cagirma" },
        ],
      },
      {
        title: t.footer.tools,
        links: [
          { label: t.footer.msds, href: "/kesfet/msds" },
          { label: t.footer.batchCertificates, href: "/kesfet/parti-sertifikalari" },
          { label: t.footer.productSelector, href: "/kesfet/urun-secici" },
          { label: t.footer.guide, href: "/kesfet/rehber" },
        ],
      },
      {
        title: t.footer.company,
        links: [
          { label: t.footer.about, href: "/kesfet/hakkimizda" },
          { label: t.footer.findStore, href: "/nereden-alabilirim" },
          { label: t.footer.checkWarranty, href: "/kesfet/garanti-sorgula" },
          { label: t.footer.contact, href: "/destek/iletisim" },
        ],
      },
      {
        title: t.footer.community,
        links: [
          { label: t.footer.blog, href: "/kesfet/blog" },
          { label: t.explore.events, href: "/kesfet/etkinlikler" },
          { label: t.explore.news, href: "/kesfet/haberler" },
          { label: t.footer.weldersClub, href: "/kesfet/welders-club" },
        ],
      },
      {
        title: t.footer.account,
        links: [
          { label: t.footer.signIn, href: "/giris" },
          { label: t.footer.createAccount, href: "/kayit" },
        ],
      },
      {
        title: t.footer.legal,
        links: [
          { label: t.footer.terms, href: "/kurumsal/kullanim-kosullari" },
          { label: t.footer.warrantyTerms, href: "/kurumsal/garanti-sartlari" },
          { label: t.footer.privacy, href: "/kurumsal/gizlilik" },
          { label: t.footer.kvkk, href: "/kurumsal/kvkk" },
          { label: t.footer.returns, href: "/kurumsal/iade" },
        ],
      },
    ],
    [t],
  );
}

/** Zenweld ofisleri. Harita ve yol tarifi baglantilari adresten uretilir. */
export interface Office {
  id: string;
  city: string;
  /** Sirket unvani — merkezde tam unvan gosterilir */
  legalName?: string;
  addressLines: string[];
  phones: string[];
}

export const OFFICES: Office[] = [
  {
    id: "istanbul",
    city: "İstanbul",
    legalName: "Zenweld Kaynak ve Kesme Ekip İnş San Tic A.Ş.",
    addressLines: [
      "İkitelli O.S.B. Demirciler Sitesi A1 Blok",
      "No.7 Başakşehir 34490 İstanbul",
    ],
    phones: ["+90 212 549 61 86", "+90 212 549 61 89"],
  },
  {
    id: "izmir",
    city: "İzmir",
    addressLines: ["İTOB OSB, 10026. Sk. No:7", "35471 Menderes / İzmir"],
    phones: ["+90 232 203 37 08"],
  },
];

/** Adresin tek satirlik, haritaya verilebilir hali. */
export function officeQuery(office: Office): string {
  return [office.legalName, ...office.addressLines].filter(Boolean).join(", ");
}

/** Google Haritalar goml baglantisi (anahtar gerektirmez). */
export function mapEmbedUrl(office: Office): string {
  return `https://www.google.com/maps?q=${encodeURIComponent(officeQuery(office))}&hl=tr&z=15&output=embed`;
}

/** Tiklaninca yol tarifi baslatan baglanti. */
export function mapDirectionsUrl(office: Office): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(officeQuery(office))}`;
}

export const CONTACT = {
  /** Merkez telefon — footer ve kisa alanlarda kullanilir */
  phone: OFFICES[0].phones[0],
  /** Sehir ayrimi yok, ortak kullaniliyor */
  email: "info@zenweld.com",
  address: `${OFFICES[0].addressLines.join(" ")}`,
  offices: OFFICES,
  social: {
    instagram: "#",
    facebook: "#",
    youtube: "#",
    linkedin: "#",
  },
};
