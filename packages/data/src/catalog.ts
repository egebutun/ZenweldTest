import type { Category, CategoryGroup } from "./types";

/**
 * KATALOG ADRESLERI
 *
 * Katalog adresi menudeki yolu izler; adresin her basamagi kendi sayfasidir:
 *   Grup      /ekipmanlar/kaynak-makineleri
 *   Kategori  /ekipmanlar/kaynak-makineleri/mma-ortulu-elektrod-kaynak-makineleri
 * Adresler yalnizca bu iki fonksiyonla uretilir (site, panel, site haritasi).
 */

export function groupHref(group: Pick<CategoryGroup, "section" | "slug">): string {
  return `/${group.section}/${group.slug}`;
}

export function categoryHref(category: Pick<Category, "section" | "group" | "slug">): string {
  return `/${category.section}/${category.group}/${category.slug}`;
}
