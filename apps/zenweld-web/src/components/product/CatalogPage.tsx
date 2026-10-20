"use client";

import { notFound } from "next/navigation";
import type { TopLevelSection } from "@zenweld/data";
import { findMovedCatalogPath, useDatabase } from "@zenweld/store";
import { findGroup, groupDescription } from "@/lib/catalog";
import { categorySeo, groupSeo } from "@/lib/seo";
import { useMovedRedirect, useSeoTitle } from "@/lib/page-seo-client";
import { GroupHub } from "./CatalogHub";
import { CategoryListing } from "./CategoryListing";

/**
 * GRUP VE KATEGORI SAYFASI (tarayici)
 *
 * Gruplar ve kategoriler panelden yonetildigi icin sayfa veritabanina bakar:
 * panelde eklenen kayit da acilir, adresi degismis kaydin eski adresi yeni
 * adrese yonlenir, hic olmayan adres 404 doner.
 */
export function GroupPage({ section, groupSlug }: { section: TopLevelSection; groupSlug: string }) {
  const db = useDatabase();
  const group = findGroup(section, groupSlug, db.categoryGroups);
  const moved = group ? undefined : findMovedCatalogPath(`/${section}/${groupSlug}`, db);
  useMovedRedirect(moved);
  useSeoTitle(group && groupSeo(group, groupDescription(group, db.categories)).title);

  if (!group) {
    if (moved) return null;
    notFound();
  }
  return <GroupHub section={section} groupSlug={groupSlug} />;
}

export function CategoryPage({
  section,
  groupSlug,
  categorySlug,
}: {
  section: TopLevelSection;
  groupSlug: string;
  categorySlug: string;
}) {
  const db = useDatabase();
  // Kategori yalnizca kendi grubunun adresinde acilir (her sayfanin tek adresi).
  const category = db.categories.find(
    (c) => c.section === section && c.group === groupSlug && c.slug === categorySlug,
  );
  const moved = category ? undefined : findMovedCatalogPath(`/${section}/${groupSlug}/${categorySlug}`, db);
  useMovedRedirect(moved);
  useSeoTitle(category && categorySeo(category).title);

  if (!category) {
    if (moved) return null;
    notFound();
  }
  return <CategoryListing section={section} categorySlug={categorySlug} />;
}
