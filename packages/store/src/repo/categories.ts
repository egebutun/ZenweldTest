"use client";

import {
  categoryHref,
  groupHref,
  type Category,
  type CategoryGroup,
  type ZenweldDatabase,
} from "@zenweld/data";
import { getSnapshot, mutate, uid } from "../database";

/* ------------------------------------------------------------------ */
/* Kategoriler ve gruplar (Urunler > Kategoriler)                      */
/*                                                                     */
/* Urunler kategoriye slug ile, kategoriler gruba grup slug'i ile      */
/* baglidir. Adres degisince (link, grup, grubun linki) eski adres     */
/* previousPaths'e eklenir ve sitede yeni adrese yonlenir.             */
/* ------------------------------------------------------------------ */

export function findCategoryById(id: string, db: ZenweldDatabase = getSnapshot()): Category | undefined {
  return db.categories.find((c) => c.id === id);
}

export function findGroupById(id: string, db: ZenweldDatabase = getSnapshot()): CategoryGroup | undefined {
  return db.categoryGroups.find((g) => g.id === id);
}

/** Kategorideki urun sayisi (yayinda olmayanlar dahil); urunu olan kategori silinemez. */
export function countCategoryProducts(category: Pick<Category, "slug">, db: ZenweldDatabase = getSnapshot()): number {
  return db.products.filter((p) => p.categorySlug === category.slug).length;
}

/** Gruptaki kategori sayisi; kategorisi olan grup silinemez. */
export function countGroupCategories(group: Pick<CategoryGroup, "section" | "slug">, db: ZenweldDatabase = getSnapshot()): number {
  return db.categories.filter((c) => c.section === group.section && c.group === group.slug).length;
}

/** Eski adresi `path` olan grup veya kategorinin bugunku adresi (yonlendirme icin). */
export function findMovedCatalogPath(path: string, db: ZenweldDatabase = getSnapshot()): string | undefined {
  const group = db.categoryGroups.find((g) => g.previousPaths?.includes(path));
  if (group) return groupHref(group);
  const category = db.categories.find((c) => c.previousPaths?.includes(path));
  return category && categoryHref(category);
}

/** Eski adres listesine ekler; bugunku adres listede tutulmaz. */
function withPath(list: string[] | undefined, oldPath: string, current: string): string[] | undefined {
  const next = [...new Set([...(list ?? []), oldPath])].filter((p) => p !== current);
  return next.length ? next : undefined;
}

/** Yeni adres baska bir kaydin eski adresiyse o yonlendirme kalkar. */
function releasePath(db: ZenweldDatabase, path: string): void {
  for (const row of [...db.categoryGroups, ...db.categories]) {
    if (!row.previousPaths?.includes(path)) continue;
    const rest = row.previousPaths.filter((p) => p !== path);
    row.previousPaths = rest.length ? rest : undefined;
  }
}

/* ------------------------------ Kategori ------------------------------ */

export function saveCategory(category: Category): void {
  mutate((db) => {
    const idx = db.categories.findIndex((c) => c.id === category.id);
    const stored = idx >= 0 ? db.categories[idx] : undefined;
    const next: Category = { ...category };
    const path = categoryHref(next);

    if (stored) {
      // Eski adresler kayitli halden alinir (formdaki taslak eski kalmis olabilir).
      const oldPath = categoryHref(stored);
      next.previousPaths = oldPath === path ? stored.previousPaths : withPath(stored.previousPaths, oldPath, path);
      // Link veya bolum degisince kategorinin urunleri de tasinir.
      db.products.forEach((p) => {
        if (p.categorySlug !== stored.slug) return;
        p.categorySlug = next.slug;
        p.section = next.section;
      });
    }

    releasePath(db, path);
    if (idx >= 0) db.categories[idx] = next;
    else db.categories.push(next);
  });
}

/** Yeni kategori grubun sonuna eklenir. */
export function createCategory(partial: Omit<Category, "id" | "order">): Category {
  const db = getSnapshot();
  const siblings = db.categories.filter((c) => c.section === partial.section && c.group === partial.group);
  const category: Category = {
    ...partial,
    id: uid("c"),
    order: Math.max(0, ...siblings.map((c) => c.order)) + 1,
  };
  saveCategory(category);
  return category;
}

/** Urunu olan kategori silinmez (false doner). */
export function deleteCategory(id: string): boolean {
  const category = findCategoryById(id);
  if (!category || countCategoryProducts(category) > 0) return false;
  mutate((db) => {
    db.categories = db.categories.filter((c) => c.id !== id);
  });
  return true;
}

/** Kategoriyi grubunda bir yukari (-1) veya asagi (+1) tasir. */
export function moveCategory(id: string, direction: -1 | 1): void {
  mutate((db) => {
    const category = db.categories.find((c) => c.id === id);
    if (!category) return;
    const siblings = db.categories
      .filter((c) => c.section === category.section && c.group === category.group)
      .sort((a, b) => a.order - b.order);
    reorder(siblings, siblings.indexOf(category), direction);
  });
}

/* -------------------------------- Grup -------------------------------- */

/**
 * Grubun bolumu degismez. Link degisince grubun ve altindaki her kategorinin
 * eski adresi yeni adrese yonlenir.
 */
export function saveGroup(group: CategoryGroup): void {
  mutate((db) => {
    const idx = db.categoryGroups.findIndex((g) => g.id === group.id);
    const stored = idx >= 0 ? db.categoryGroups[idx] : undefined;
    const next: CategoryGroup = { ...group, section: stored?.section ?? group.section };
    const path = groupHref(next);

    if (stored) {
      const oldPath = groupHref(stored);
      next.previousPaths = oldPath === path ? stored.previousPaths : withPath(stored.previousPaths, oldPath, path);
      if (stored.slug !== next.slug) {
        db.categories.forEach((c) => {
          if (c.section !== stored.section || c.group !== stored.slug) return;
          const before = categoryHref(c);
          c.group = next.slug;
          const after = categoryHref(c);
          c.previousPaths = withPath(c.previousPaths, before, after);
          releasePath(db, after);
        });
      }
    }

    releasePath(db, path);
    if (idx >= 0) db.categoryGroups[idx] = next;
    else db.categoryGroups.push(next);
  });
}

/** Yeni grup bolumun sonuna eklenir. */
export function createGroup(partial: Omit<CategoryGroup, "id" | "order">): CategoryGroup {
  const db = getSnapshot();
  const siblings = db.categoryGroups.filter((g) => g.section === partial.section);
  const group: CategoryGroup = {
    ...partial,
    id: uid("g"),
    order: Math.max(0, ...siblings.map((g) => g.order)) + 1,
  };
  saveGroup(group);
  return group;
}

/** Kategorisi olan grup silinmez (false doner). */
export function deleteGroup(id: string): boolean {
  const group = findGroupById(id);
  if (!group || countGroupCategories(group) > 0) return false;
  mutate((db) => {
    db.categoryGroups = db.categoryGroups.filter((g) => g.id !== id);
  });
  return true;
}

/** Grubu bolumunde bir yukari (-1) veya asagi (+1) tasir. */
export function moveGroup(id: string, direction: -1 | 1): void {
  mutate((db) => {
    const group = db.categoryGroups.find((g) => g.id === id);
    if (!group) return;
    const siblings = db.categoryGroups
      .filter((g) => g.section === group.section)
      .sort((a, b) => a.order - b.order);
    reorder(siblings, siblings.indexOf(group), direction);
  });
}

/** Siradaki yerini degistirir ve sira numaralarini 1, 2, 3 ... yapar. */
function reorder(list: { order: number }[], index: number, direction: -1 | 1): void {
  const target = index + direction;
  if (index < 0 || target < 0 || target >= list.length) return;
  [list[index], list[target]] = [list[target], list[index]];
  list.forEach((row, i) => {
    row.order = i + 1;
  });
}
