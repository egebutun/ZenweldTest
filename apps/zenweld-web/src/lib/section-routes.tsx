import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { categories, categoryGroups, type TopLevelSection } from "@zenweld/data";
import { CategoryListing } from "@/components/product/CategoryListing";
import { GroupHub, SectionHub } from "@/components/product/CatalogHub";
import { JsonLd } from "@/components/common/JsonLd";
import {
  SECTION_DESCRIPTIONS,
  SECTION_TITLES,
  catalogTrail,
  categoryHref,
  findGroup,
  groupDescription,
  groupHref,
  type Crumb,
} from "@/lib/catalog";
import { SITE_NAME, absoluteUrl, breadcrumbJsonLd, canonical } from "@/lib/seo";

/**
 * URUN BOLUMU, GRUP VE KATEGORI SAYFALARI — ORTAK KOD
 *
 * Dort bolumun (ekipmanlar, guvenlik, aksesuarlar, dolgu-metalleri) sayfa
 * dosyalari yalnizca bu fonksiyonlari cagirir:
 *
 *   const route = sectionRoute("ekipmanlar");    // /ekipmanlar (grup kartlari)
 *   const route = groupRoute("ekipmanlar");      // /ekipmanlar/[grup] (kategori kartlari)
 *   const route = categoryRoute("ekipmanlar");   // /ekipmanlar/[grup]/[kategori] (urunler)
 */

type GroupParams = { params: Promise<{ grup: string }> };
type CategoryParams = { params: Promise<{ grup: string; kategori: string }> };

const metadata = (path: string, title: string, description: string): Metadata => ({
  title,
  description,
  alternates: canonical(path),
  openGraph: { title, description, url: absoluteUrl(path) },
});

/** Konum satirinin arama motoru icin yapisal hali. */
const trailJsonLd = (trail: Crumb[]) =>
  breadcrumbJsonLd([
    { name: SITE_NAME, path: "/" },
    ...trail.map((c) => ({ name: c.label, path: c.href })),
  ]);

/** /<bolum> sayfasi: bolumun gruplari resimli kartlar halinde. */
export function sectionRoute(section: TopLevelSection) {
  return {
    generateMetadata(): Metadata {
      return metadata(`/${section}`, SECTION_TITLES[section], SECTION_DESCRIPTIONS[section]);
    },
    Page() {
      return (
        <>
          <JsonLd data={trailJsonLd(catalogTrail(section))} />
          <SectionHub section={section} />
        </>
      );
    },
  };
}

/** /<bolum>/[grup] sayfasi: grubun kategorileri resimli kartlar halinde. */
export function groupRoute(section: TopLevelSection) {
  return {
    generateStaticParams() {
      return categoryGroups.filter((g) => g.section === section).map((g) => ({ grup: g.slug }));
    },

    async generateMetadata({ params }: GroupParams): Promise<Metadata> {
      const group = findGroup(section, (await params).grup);
      if (!group) return { title: "Kategori" };
      return metadata(groupHref(group), group.name, groupDescription(group));
    },

    async Page({ params }: GroupParams) {
      const group = findGroup(section, (await params).grup);
      // Bilinmeyen veya kaldirilmis adres 404 doner (eski /<bolum>/<kategori> dahil).
      if (!group) notFound();

      return (
        <>
          <JsonLd data={trailJsonLd(catalogTrail(section, { groupSlug: group.slug }))} />
          <GroupHub section={section} groupSlug={group.slug} />
        </>
      );
    },
  };
}

/** /<bolum>/[grup]/[kategori] sayfasi: kategorinin urunleri. */
export function categoryRoute(section: TopLevelSection) {
  // Kategori yalnizca kendi grubunun adresinde acilir; baska grubun
  // altindan yazilan adres 404 doner (ayni sayfanin tek adresi olur).
  const findCategory = (groupSlug: string, slug: string) =>
    categories.find((c) => c.section === section && c.group === groupSlug && c.slug === slug);

  return {
    generateStaticParams() {
      return categories
        .filter((c) => c.section === section)
        .map((c) => ({ grup: c.group, kategori: c.slug }));
    },

    async generateMetadata({ params }: CategoryParams): Promise<Metadata> {
      const { grup, kategori } = await params;
      const category = findCategory(grup, kategori);
      if (!category) return { title: "Kategori" };
      return metadata(categoryHref(category), category.name, category.description);
    },

    async Page({ params }: CategoryParams) {
      const { grup, kategori } = await params;
      const category = findCategory(grup, kategori);
      if (!category) notFound();

      return (
        <>
          <JsonLd data={trailJsonLd(catalogTrail(section, { categorySlug: category.slug }))} />
          <CategoryListing section={section} categorySlug={category.slug} />
        </>
      );
    },
  };
}
