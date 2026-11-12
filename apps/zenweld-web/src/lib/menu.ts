"use client";

import { useMemo } from "react";
import { getCompany, listLegalPages, listProducts, useDatabase } from "@zenweld/store";
import { legalPath, productHighlights, type LegalPageId, type TopLevelSection } from "@zenweld/data";
import type { Dictionary } from "@zenweld/i18n";
import type { MenuIconName } from "@/components/common/MenuIcons";
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
  /** Destek ve Garanti ve Kesfet: menude (ve /destek kartlarinda) sembol */
  icon?: MenuIconName;
  /** Destek ve Garanti: /destek kartindaki baglanti metni */
  cta?: string;
}

/** Mega menude gosterilecek en fazla urun sayisi (3 sutun x 2 satir). */
const MENU_PRODUCT_LIMIT = 6;

export interface MenuColumn {
  /**
   * Sol kolondaki grup ("Kaynak Makineleri" gibi). Ustune gelince kategorileri
   * acar. Kesfet'te kolon basligidir; Destek ve Garanti'nin kolonlarinda
   * baslik yoktur (bos).
   */
  label: string;
  /** Urun menulerinde grup sayfasi: /ekipmanlar/kaynak-makineleri */
  href?: string;
  links: MenuLink[];
}

export interface TopMenu {
  id: string;
  label: string;
  /** Kolonu yoksa (FORCE) baslik yalnizca bir baglantidir; menu acilmaz. */
  /** Bolum ya da tanitim sayfasi: /ekipmanlar, /destek. Kesfet'te yok: baslik bir sayfa acmaz. */
  href?: string;
  columns: MenuColumn[];
  /**
   * Menunun solunda baslik ve kisa aciklama; sagda sembollu baglantilar
   * (Destek ve Garanti, Kesfet). Sayfasi olan menude "Tumunu Gor" da vardir.
   */
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

    // Urun disi menuler: solda tanitim, sagda sembollu baglantilar.
    // Destek ve Garanti'nin basligi /destek sayfasina gider; Kesfet'in sayfasi yoktur.
    const supportWarranty: TopMenu = {
      id: "destek-garanti",
      label: t.nav.supportWarranty,
      href: "/destek",
      intro: t.nav.supportWarrantyIntro,
      columns: supportWarrantyColumns(t),
    };
    const explore: TopMenu = {
      id: "kesfet",
      label: t.nav.explore,
      intro: t.nav.exploreIntro,
      columns: exploreColumns(t),
    };

    // En basta: Force serisinin tanitim sayfasi (KARARLAR K-114); menusu yok.
    const force: TopMenu = { id: "force", label: t.nav.force, href: "/force", columns: [] };

    return [force, ...productMenus, supportWarranty, explore];
  }, [db, t]);
}

/**
 * Kesfet menusunun kolonlari (Kurumsal, Guncel, Diger). Ust menu ve alt
 * bilgi ayni listeleri kullanir; bir baglanti eklendiginde iki yerde de
 * gorunur.
 */
function exploreColumns(t: Dictionary): MenuColumn[] {
  return [
    {
      label: t.nav.corporate,
      links: [
        { label: t.explore.about, description: t.explore.aboutDesc, href: "/hakkimizda", icon: "hakkimizda" },
        { label: t.explore.salesReps, description: t.explore.salesRepsDesc, href: "/satis-temsilcilerimiz", icon: "satis-temsilcileri" },
        { label: t.dealerApply.title, description: t.dealerApply.menuText, href: "/bayilik-basvurusu", icon: "bayilik-basvurusu" },
      ],
    },
    {
      label: t.nav.updates,
      links: [
        { label: t.explore.news, description: t.explore.newsDesc, href: "/haberler", icon: "haberler" },
        { label: t.explore.events, description: t.explore.eventsDesc, href: "/etkinlikler", icon: "etkinlikler" },
        { label: t.explore.blog, description: t.explore.blogDesc, href: "/blog", icon: "blog" },
      ],
    },
    {
      label: t.nav.other,
      links: [
        { label: t.explore.productSelector, description: t.explore.productSelectorDesc, href: "/urun-secici", icon: "urun-secici" },
        { label: t.explore.guide, description: t.explore.guideDesc, href: "/kaynak-rehberi", icon: "kaynak-rehberi" },
        { label: t.explore.msds, description: t.explore.msdsDesc, href: "/msds", icon: "msds" },
        { label: t.explore.batchCertificates, description: t.explore.batchCertificatesDesc, href: "/parti-sertifikalari", icon: "parti-sertifikalari" },
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
    { label: t.support.contactTitle, description: t.support.contactCardText, href: "/iletisim", icon: "iletisim", cta: s.ctaContact },
    { label: t.nav.findDealerService, description: t.support.dealerCardText, href: "/yetkili-bayi-ve-servis-agi", icon: "bayi-servis", cta: s.ctaDealer },
    { label: t.service.title, description: t.service.menuText, href: "/servis-talebi", icon: "servis-talebi", cta: s.ctaService },
    { label: t.support.faqTitle, description: t.support.faqCardText, href: "/sss", icon: "sss", cta: s.ctaFaq },
  ];
}

/**
 * Ust menudeki Destek ve Garanti ile /destek sayfasi: iki kolon, basliksiz
 * (telefon menusunde de). Ikinci kolonun sonunda Iade ve Degisim var. (Alt
 * bilgide Iade ve Degisim, Politikalar & Yasal'da durdugu icin orada tekrar
 * edilmez.)
 */
export function supportWarrantyColumns(t: Dictionary): MenuColumn[] {
  return [
    { label: "", links: supportLinks(t) },
    {
      label: "",
      links: [
        ...warrantyLinks(t),
        { label: t.nav.returnsExchange, description: t.nav.returnsExchangeDesc, href: legalPath("iade"), icon: "iade", cta: t.supportHub.ctaReturns },
      ],
    },
  ];
}

const plainLinks = (links: MenuLink[]) => links.map(({ label, href }) => ({ label, href }));

/**
 * ALT BILGI
 *
 * Ust menunun aynisi ve ayni sirada: Destek, Garanti, Kesfet'in kolonlari
 * (Kurumsal, Guncel, Diger); sonda Politikalar & Yasal. Yasal metinlerin adlari yonetim
 * panelinden (Yasal Metinler) degisebildigi icin veritabanindan okunur.
 */
export function useFooterMenu() {
  const t = useT();
  const db = useDatabase();
  return useMemo(
    () => [
      { title: t.nav.support, links: plainLinks(supportLinks(t)) },
      { title: t.nav.warranty, links: plainLinks(warrantyLinks(t)) },
      ...exploreColumns(t).map((col) => ({ title: col.label, links: plainLinks(col.links) })),
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
