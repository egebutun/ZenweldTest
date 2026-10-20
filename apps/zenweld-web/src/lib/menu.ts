"use client";

import { useMemo } from "react";
import { listLegalPages, listProducts, useDatabase } from "@zenweld/store";
import { legalPath, productHighlights, type LegalPageId, type TopLevelSection } from "@zenweld/data";
import type { Dictionary } from "@zenweld/i18n";
import { useT } from "./i18n-client";
import { categoryHref, groupHref } from "./catalog";

// Geriye donuk uyumluluk: iletisim verisi artik contact.ts icinde.
export { CONTACT, OFFICES, officeQuery, mapEmbedUrl, mapDirectionsUrl, type Office } from "./contact";

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
  /** Urun menulerinde bolum sayfasi: /ekipmanlar */
  href?: string;
  columns: MenuColumn[];
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

    const supportWarranty: TopMenu = {
      id: "destek-garanti",
      label: t.nav.supportWarranty,
      columns: [
        { label: t.nav.support, links: supportLinks(t) },
        { label: t.nav.warranty, links: warrantyLinks(t) },
      ],
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
  return [
    { label: t.nav.warrantyRegister, description: t.explore.registerWarrantyDesc, href: "/garanti/kayit" },
    { label: t.nav.warrantyCheck, description: t.explore.checkWarrantyDesc, href: "/garanti/sorgulama" },
    { label: t.nav.warrantyTerms, description: t.nav.warrantyTermsDesc, href: "/garanti/kosullar" },
  ];
}

/** Destek ve Garanti > Destek */
function supportLinks(t: Dictionary): MenuLink[] {
  return [
    { label: t.support.faqTitle, description: t.support.faqCardText, href: "/sss" },
    { label: t.nav.findDealerService, description: t.support.dealerCardText, href: "/yetkili-bayi-ve-servis-agi" },
    { label: t.service.title, description: t.service.menuText, href: "/servis-talebi" },
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
