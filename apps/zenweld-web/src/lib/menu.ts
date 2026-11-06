"use client";

import { useMemo } from "react";
import { getCompany, listLegalPages, listProducts, useDatabase } from "@zenweld/store";
import { legalPath, productHighlights, type LegalPageId, type TopLevelSection } from "@zenweld/data";
import type { Dictionary } from "@zenweld/i18n";
import type { SupportIconName } from "@/components/support/SupportIcons";
import { useT } from "./i18n-client";
import { categoryHref, groupHref } from "./catalog";

export { headOfficeAddress, mapDirectionsUrl, mapEmbedUrl, officeQuery, socialLinks, type Office } from "./contact";

/** Sirket ve iletisim bilgileri (Magaza Ayarlari > Sirket ve Iletisim; KARARLAR K-105). */
export const useCompany = () => getCompany(useDatabase());

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
  /** Destek ve Garanti: menude ve /destek kartlarinda sembol */
  icon?: SupportIconName;
  /** Destek ve Garanti: /destek kartindaki baglanti metni */
  cta?: string;
}

/** Mega menude gosterilecek en fazla urun sayisi (3 sutun x 2 satir). */
const MENU_PRODUCT_LIMIT = 6;

export interface MenuColumn {
  /** Sol kolondaki grup ("Kaynak Makineleri" gibi). Ustune gelince kategorileri acar. */
  label: string;
  /** Urun menulerinde grup sayfasi: /ekipmanlar/kaynak-makineleri */
  href?: string;
  links: MenuLink[];
}

export interface TopMenu {
  id: string;
  label: string;
  /** Bolum ya da tanitim sayfasi: /ekipmanlar, /destek */
  href?: string;
  columns: MenuColumn[];
  /** Menunun solunda baslik, kisa aciklama ve "Tumunu Gor" (Destek ve Garanti) */
  intro?: string;
}

const SECTIONS: { id: TopLevelSection; labelKey: keyof Dictionary["nav"] }[] = [
  { id: "ekipmanlar", labelKey: "equipment" },
  { id: "guvenlik", labelKey: "safety" },
  { id: "aksesuarlar", labelKey: "accessories" },
  { id: "dolgu-metalleri", labelKey: "fillerMetals" },
];

export function useMainMenu(): TopMenu[] {
  const db = useDatabase();
  const t = useT();

  return useMemo(() => {
    const visible = listProducts(db);
    const productMenus: TopMenu[] = SECTIONS.map(({ id, labelKey }) => {
      const groups = db.categoryGroups
        .filter((g) => g.section === id)
        .sort((a, b) => a.order - b.order);

      return {
        id,
        label: t.nav[labelKey],
        href: `/${id}`,
        columns: groups.map((group) => ({
          label: group.name,
          href: groupHref(group),
          links: db.categories
            .filter((c) => c.section === id && c.group === group.slug)
            .sort((a, b) => a.order - b.order)
            .map((c) => {
              const inCategory = visible.filter((p) => p.categorySlug === c.slug);
              return {
                label: c.name,
                description: c.description,
                href: categoryHref(c),
                productCount: inCategory.length,
                products: inCategory.slice(0, MENU_PRODUCT_LIMIT).map((p) => ({
                  id: p.id,
                  name: p.name,
                  href: `/urun/${p.slug}`,
                  imageUrl: p.images[0]?.url,
                  highlights: productHighlights(p),
                })),
              };
            }),
        })),
      };
    });

    // Urun disi menuler; alt basliklari (Kurumsal, Destek, Garanti ...) mega
    // menude sol kolonda durur.
    const explore: TopMenu = {
      id: "kesfet",
      label: t.nav.explore,
      columns: exploreColumns(t),
    };

    // Basligi /destek sayfasina gider; menude solda tanitim, sagda sembollu baglantilar.
    const supportWarranty: TopMenu = {
      id: "destek-garanti",
      label: t.nav.supportWarranty,
      href: "/destek",
      intro: t.nav.supportWarrantyIntro,
      columns: supportWarrantyColumns(t),
    };

    return [...productMenus, explore, supportWarranty];
  }, [db, t]);
}

/**
 * Kesfet menusunun alt basliklari. Ust menu ve alt bilgi ayni listeleri
 * kullanir; bir baglanti eklendiginde iki yerde de gorunur.
 */
function exploreColumns(t: Dictionary): MenuColumn[] {
  return [
    {
      label: t.nav.corporate,
      links: [
        { label: t.explore.about, description: t.explore.aboutDesc, href: "/hakkimizda" },
        { label: t.explore.salesReps, description: t.explore.salesRepsDesc, href: "/satis-temsilcilerimiz" },
        { label: t.dealerApply.title, description: t.dealerApply.homeText, href: "/bayilik-basvurusu" },
        { label: t.support.contactTitle, description: t.support.contactCardText, href: "/iletisim" },
      ],
    },
    {
      label: t.nav.updates,
      links: [
        { label: t.explore.news, description: t.explore.newsDesc, href: "/haberler" },
        { label: t.explore.events, description: t.explore.eventsDesc, href: "/etkinlikler" },
        { label: t.explore.blog, description: t.explore.blogDesc, href: "/blog" },
        { label: t.explore.weldersClub, description: t.explore.weldersClubDesc, href: "/welders-club" },
      ],
    },
    {
      label: t.nav.other,
      links: [
        { label: t.explore.productSelector, description: t.explore.productSelectorDesc, href: "/urun-secici" },
        { label: t.explore.guide, description: t.explore.guideDesc, href: "/kaynak-rehberi" },
        { label: t.explore.msds, description: t.explore.msdsDesc, href: "/msds" },
        { label: t.explore.batchCertificates, description: t.explore.batchCertificatesDesc, href: "/parti-sertifikalari" },
      ],
    },
  ];
}

/** Destek ve Garanti > Garanti */
function warrantyLinks(t: Dictionary): MenuLink[] {
  const s = t.supportHub;
  return [
    { label: t.nav.warrantyRegister, description: t.explore.registerWarrantyDesc, href: "/garanti/kayit", icon: "garanti-kayit", cta: s.ctaWarrantyRegister },
    { label: t.nav.warrantyCheck, description: t.explore.checkWarrantyDesc, href: "/garanti/sorgulama", icon: "garanti-sorgulama", cta: s.ctaWarrantyCheck },
    { label: t.nav.warrantyTerms, description: t.nav.warrantyTermsDesc, href: "/garanti/kosullar", icon: "garanti-kosullari", cta: s.ctaWarrantyTerms },
  ];
}

/** Destek ve Garanti > Destek */
function supportLinks(t: Dictionary): MenuLink[] {
  const s = t.supportHub;
  return [
    { label: t.support.faqTitle, description: t.support.faqCardText, href: "/sss", icon: "sss", cta: s.ctaFaq },
    { label: t.nav.findDealerService, description: t.support.dealerCardText, href: "/yetkili-bayi-ve-servis-agi", icon: "bayi-servis", cta: s.ctaDealer },
    { label: t.service.title, description: t.service.menuText, href: "/servis-talebi", icon: "servis-talebi", cta: s.ctaService },
  ];
}

/**
 * Ust menudeki Destek ve Garanti ile /destek sayfasi: Destek'in sonunda
 * Iade ve Degisim de var. (Alt bilgide Iade ve Degisim, Politikalar &
 * Yasal'da durdugu icin orada tekrar edilmez.)
 */
export function supportWarrantyColumns(t: Dictionary): MenuColumn[] {
  return [
    {
      label: t.nav.support,
      links: [
        ...supportLinks(t),
        { label: t.nav.returnsExchange, description: t.nav.returnsExchangeDesc, href: legalPath("iade"), icon: "iade", cta: t.supportHub.ctaReturns },
      ],
    },
    { label: t.nav.warranty, links: warrantyLinks(t) },
  ];
}

const plainLinks = (links: MenuLink[]) => links.map(({ label, href }) => ({ label, href }));

/**
 * ALT BILGI
 *
 * Ust menunun aynisi ve ayni sirada: Kesfet'in alt basliklari, Destek,
 * Garanti; sonda Politikalar & Yasal. Yasal metinlerin adlari yonetim
 * panelinden (Yasal Metinler) degisebildigi icin veritabanindan okunur.
 */
export function useFooterMenu() {
  const t = useT();
  const db = useDatabase();
  return useMemo(
    () => [
      ...exploreColumns(t).map((col) => ({ title: col.label, links: plainLinks(col.links) })),
      { title: t.nav.support, links: plainLinks(supportLinks(t)) },
      { title: t.nav.warranty, links: plainLinks(warrantyLinks(t)) },
      {
        title: t.footer.legal,
        links: listLegalPages(db).map((p) => ({
          label: p.title,
          href: legalPath(p.id as LegalPageId),
        })),
      },
    ],
    [t, db],
  );
}
