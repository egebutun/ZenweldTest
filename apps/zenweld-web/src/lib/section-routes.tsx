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
  findGroup,
  groupDescription,
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
 *   const route = categoryRoute("ekipmanlar");   // /ekipmanlar/[kategori]: grup (kategori kartlari) veya kategori (urunler)
 */

type CategoryParams = { params: Promise<{ kategori: string }> };

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

/** /<bolum>/[kategori] sayfasi: adres bir grubu ya da bir kategoriyi gosterir. */
export function categoryRoute(section: TopLevelSection) {
  const findCategory = (slug: string) =>
    categories.find((c) => c.section === section && c.slug === slug);

  return {
    generateStaticParams() {
      return [
        ...categoryGroups.filter((g) => g.section === section),
        ...categories.filter((c) => c.section === section),
      ].map((x) => ({ kategori: x.slug }));
    },

    async generateMetadata({ params }: CategoryParams): Promise<Metadata> {
      const slug = (await params).kategori;
      const group = findGroup(section, slug);
      if (group) return metadata(`/${section}/${slug}`, group.name, groupDescription(group));
      const category = findCategory(slug);
      if (category) return metadata(`/${section}/${slug}`, category.name, category.description);
      return { title: "Kategori" };
    },

    async Page({ params }: CategoryParams) {
      const slug = (await params).kategori;
      const group = findGroup(section, slug);
      const category = group ? undefined : findCategory(slug);

      // Bilinmeyen veya kaldirilmis adres 404 doner.
      if (!group && !category) notFound();

      const trail = catalogTrail(
        section,
        group ? { groupSlug: group.slug } : { categorySlug: category!.slug },
      );
      return (
        <>
          <JsonLd data={trailJsonLd(trail)} />
          {group ? (
            <GroupHub section={section} groupSlug={group.slug} />
          ) : (
            <CategoryListing section={section} categorySlug={category!.slug} />
          )}
        </>
      );
    },
  };
}
