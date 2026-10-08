"use client";

import { useMemo } from "react";
import { useDatabase } from "@zenweld/store";
import { localeSlug, productHighlights, type TopLevelSection } from "@zenweld/data";
import type { Dictionary } from "@zenweld/i18n";
import { useLocale, useT } from "./i18n-client";

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
export const MENU_PRODUCT_LIMIT = 6;

export interface MenuColumn {
  /** Sol kolondaki grup (Unimig'deki "Welding Machines" gibi). Bos ise alt baslik yok. */
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
          href: `/${id}?grup=${localeSlug(group, locale)}`,
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
                href: `/${id}/${localeSlug(c, locale)}`,
                productCount: inCategory.length,
                products: inCategory.slice(0, MENU_PRODUCT_LIMIT).map((p) => ({
                  id: p.id,
                  name: p.name,
                  href: `/urun/${p.slug}`,
                  imageUrl: p.images[0]?.url,
                  highlights: productHighlights(p, locale, 3),
                })),
              };
            }),
        })),
      };
    });

    // Urun disi menuler. Alt basligi olmayan menuler tek, basliksiz
    // kolondan olusur (label: ""); mega menu bunu sol bolmesiz gosterir.
    const warranty: TopMenu = {
      id: "garanti",
      label: t.nav.warranty,
      href: "/garanti",
      columns: [
        {
          label: "",
          href: "/garanti",
          links: [
            { label: t.nav.warrantyRegister, description: t.explore.registerWarrantyDesc, href: "/garanti/kayit" },
            { label: t.nav.warrantyCheck, description: t.explore.checkWarrantyDesc, href: "/garanti/sorgulama" },
            { label: t.nav.warrantyTerms, description: t.nav.warrantyTermsDesc, href: "/garanti/kosullar" },
          ],
        },
      ],
    };

    const dealerNetwork: TopMenu = {
      id: "bayi-agi",
      label: t.nav.dealerNetwork,
      href: "/yetkili-bayi-ve-servis-agi",
      columns: [
        {
          label: "",
          href: "/yetkili-bayi-ve-servis-agi",
          links: [
            { label: t.nav.findDealerService, description: t.support.dealerCardText, href: "/yetkili-bayi-ve-servis-agi" },
            { label: t.dealerApply.title, description: t.dealerApply.homeText, href: "/bayilik-basvurusu" },
          ],
        },
      ],
    };

    const corporate: TopMenu = {
      id: "kurumsal",
      label: t.nav.corporate,
      href: "/hakkimizda",
      columns: [
        {
          label: t.nav.ourCompany,
          href: "/hakkimizda",
          links: [
            { label: t.explore.about, description: t.explore.aboutDesc, href: "/hakkimizda" },
            { label: t.explore.salesReps, description: t.explore.salesRepsDesc, href: "/satis-temsilcilerimiz" },
            { label: t.support.contactTitle, description: t.support.contactCardText, href: "/iletisim" },
          ],
        },
        {
          label: t.nav.updates,
          href: "/haberler",
          links: [
            { label: t.explore.news, description: t.explore.newsDesc, href: "/haberler" },
            { label: t.explore.events, description: t.explore.eventsDesc, href: "/etkinlikler" },
            { label: t.explore.blog, description: t.explore.blogDesc, href: "/blog" },
            { label: t.explore.weldersClub, description: t.explore.weldersClubDesc, href: "/welders-club" },
          ],
        },
      ],
    };

    const support: TopMenu = {
      id: "destek",
      label: t.nav.support,
      href: "/destek",
      columns: [
        {
          label: "",
          href: "/destek",
          links: [
            { label: t.support.faqTitle, description: t.support.faqCardText, href: "/sss" },
            { label: t.explore.productSelector, description: t.explore.productSelectorDesc, href: "/urun-secici" },
            { label: t.explore.guide, description: t.explore.guideDesc, href: "/kaynak-rehberi" },
            { label: t.explore.msds, description: t.explore.msdsDesc, href: "/msds" },
            { label: t.explore.batchCertificates, description: t.explore.batchCertificatesDesc, href: "/parti-sertifikalari" },
          ],
        },
      ],
    };

    return [...productMenus, warranty, dealerNetwork, corporate, support];
  }, [db, locale, t]);
}

export function useFooterMenu() {
  const t = useT();
  return useMemo(
    () => [
      {
        title: t.footer.support,
        links: [
          { label: t.footer.helpCentre, href: "/destek" },
          { label: t.explore.warranty, href: "/garanti" },
          { label: t.footer.contact, href: "/iletisim" },
        ],
      },
      {
        title: t.footer.tools,
        links: [
          { label: t.footer.msds, href: "/msds" },
          { label: t.footer.batchCertificates, href: "/parti-sertifikalari" },
          { label: t.footer.productSelector, href: "/urun-secici" },
          { label: t.footer.guide, href: "/kaynak-rehberi" },
        ],
      },
      {
        title: t.footer.company,
        links: [
          { label: t.footer.about, href: "/hakkimizda" },
          { label: t.explore.salesReps, href: "/satis-temsilcilerimiz" },
          { label: t.footer.findStore, href: "/yetkili-bayi-ve-servis-agi" },
          { label: t.dealerApply.title, href: "/bayilik-basvurusu" },
          { label: t.footer.contact, href: "/iletisim" },
        ],
      },
      {
        title: t.footer.community,
        links: [
          { label: t.footer.blog, href: "/blog" },
          { label: t.explore.events, href: "/etkinlikler" },
          { label: t.explore.news, href: "/haberler" },
          { label: t.footer.weldersClub, href: "/welders-club" },
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
          { label: t.footer.terms, href: "/yasal/kullanim-kosullari" },
          { label: t.footer.warrantyTerms, href: "/garanti/kosullar" },
          { label: t.footer.privacy, href: "/yasal/gizlilik" },
          { label: t.footer.kvkk, href: "/yasal/kvkk" },
          { label: t.footer.returns, href: "/yasal/iade" },
        ],
      },
    ],
    [t],
  );
}

