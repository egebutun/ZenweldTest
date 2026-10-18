import {
  categories as seedCategories,
  categoryGroups as seedGroups,
  type Category,
  type CategoryGroup,
  type TopLevelSection,
} from "@zenweld/data";
import { tr } from "@zenweld/i18n";

/**
 * URUN KATALOGU — DORT SEVIYE
 *
 *   Bolum     /ekipmanlar                         grup kartlari
 *   Grup      /ekipmanlar/kaynak-makineleri       gruptaki tum urunler
 *   Kategori  /ekipmanlar/mig-gazalti-...         kategorinin urunleri
 *   Urun      /urun/ultimate-250-mtc
 *
 * Grup ve kategori adresleri ayni seviyededir (/<bolum>/<slug>); grup ve
 * kategori slug'lari bu yuzden birbirinden farkli olmalidir.
 */

export const SECTION_TITLES: Record<TopLevelSection, string> = {
  ekipmanlar: tr.nav.equipment,
  guvenlik: tr.nav.safety,
  aksesuarlar: tr.nav.accessories,
  "dolgu-metalleri": tr.nav.fillerMetals,
};

export const SECTION_DESCRIPTIONS: Record<TopLevelSection, string> = {
  ekipmanlar: "Zenweld lazer ve kaynak makinelerini inceleyin, size en yakın yetkili bayiden satın alın.",
  guvenlik: "Zenweld kaynak maskeleri ve koruyucu giyim ürünlerini inceleyin, size en yakın yetkili bayiden satın alın.",
  aksesuarlar: "Zenweld MIG, TIG, MMA ve plazma kesme aksesuarlarını inceleyin, size en yakın yetkili bayiden satın alın.",
  "dolgu-metalleri": "Zenweld MIG ve TIG kaynak tellerini inceleyin, size en yakın yetkili bayiden satın alın.",
};

export interface Crumb {
  label: string;
  href: string;
}

/** Bolumun gruplari, menudeki sirayla. */
export function sectionGroups(
  section: TopLevelSection,
  groups: CategoryGroup[] = seedGroups,
): CategoryGroup[] {
  return groups.filter((g) => g.section === section).sort((a, b) => a.order - b.order);
}

/** Grubun kategorileri, menudeki sirayla. */
export function groupCategories(
  group: CategoryGroup,
  categories: Category[] = seedCategories,
): Category[] {
  return categories
    .filter((c) => c.section === group.section && c.group === group.slug)
    .sort((a, b) => a.order - b.order);
}

export function findGroup(
  section: TopLevelSection,
  slug: string,
  groups: CategoryGroup[] = seedGroups,
): CategoryGroup | undefined {
  return groups.find((g) => g.section === section && g.slug === slug);
}

/** Grup sayfasinin aciklamasi; ayri bir metin girilmedigi icin kategorilerden uretilir. */
export function groupDescription(group: CategoryGroup, categories: Category[] = seedCategories): string {
  const names = groupCategories(group, categories).map((c) => c.name);
  return `Zenweld ${group.name.toLocaleLowerCase("tr")}: ${names.join(", ")}. Size en yakın yetkili bayiden satın alın.`;
}

/**
 * Konum satiri: Bolum › Grup › Kategori (Zenweld ve urun haric).
 * Yalnizca bolum verilirse tek halka doner.
 */
export function catalogTrail(
  section: TopLevelSection,
  { groupSlug, categorySlug }: { groupSlug?: string; categorySlug?: string } = {},
  data: { categories?: Category[]; groups?: CategoryGroup[] } = {},
): Crumb[] {
  const categories = data.categories ?? seedCategories;
  const groups = data.groups ?? seedGroups;
  const category = categorySlug
    ? categories.find((c) => c.section === section && c.slug === categorySlug)
    : undefined;
  const group = findGroup(section, category?.group ?? groupSlug ?? "", groups);

  const trail: Crumb[] = [{ label: SECTION_TITLES[section], href: `/${section}` }];
  if (group) trail.push({ label: group.name, href: `/${section}/${group.slug}` });
  if (category) trail.push({ label: category.name, href: `/${section}/${category.slug}` });
  return trail;
}
