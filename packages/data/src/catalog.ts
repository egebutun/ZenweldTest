import type { Category, CategoryGroup, Product } from "./types";

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

/**
 * Teklif yalnizca Ekipmanlar'daki urunler icin istenir (KARARLAR K-79):
 * Teklif Al listesinde Ekipmanlar'daki yayindaki urunlerin hepsi cikar.
 */
export function isQuotable(product: Pick<Product, "active" | "section">): boolean {
  return product.active && product.section === "ekipmanlar";
}

/** Markasi yazilmamis urunun markasi. */
export const DEFAULT_BRAND = "Zenweld";

/** Urunun markasi: panelde yazilan, bossa Zenweld. */
export function productBrand(product: Pick<Product, "brand">): string {
  return product.brand?.trim() || DEFAULT_BRAND;
}

/** Kategori icindeki "Önerilen" sira: Sıra numarasi kucuk olan once, esitse ada gore. */
export function byProductOrder(a: Pick<Product, "order" | "name">, b: Pick<Product, "order" | "name">): number {
  return (a.order ?? Infinity) - (b.order ?? Infinity) || a.name.localeCompare(b.name, "tr");
}
