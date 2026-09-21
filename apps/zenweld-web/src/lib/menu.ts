"use client";

import { useMemo } from "react";
import { useDatabase } from "@zenweld/store";
import type { TopLevelSection } from "@zenweld/data";
import type { Dictionary } from "@zenweld/i18n";
import { useLocale, useT } from "./i18n-client";

export interface MenuLink {
  label: string;
  description?: string;
  href: string;
}

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
            .map((c) => ({
              label: c.name[locale],
              description: c.description[locale],
              href: `/${id}/${c.slug}`,
            })),
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

export const CONTACT = {
  phone: "+90 850 000 00 00",
  email: "info@zenweld.com",
  address: "Lorem OSB, 1. Cadde No:1, İstanbul / Türkiye",
  social: {
    instagram: "#",
    facebook: "#",
    youtube: "#",
    linkedin: "#",
  },
};
