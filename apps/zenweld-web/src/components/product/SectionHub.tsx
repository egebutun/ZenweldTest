"use client";

import { useMemo } from "react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { TopLevelSection } from "@zenweld/data";
import { listProducts, useDatabase } from "@zenweld/store";
import { ProductImage } from "@zenweld/ui";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { useT } from "@/lib/i18n-client";
import {
  SECTION_DESCRIPTIONS,
  SECTION_TITLES,
  groupCategories,
  sectionGroups,
} from "@/lib/catalog";

/**
 * BOLUM SAYFASI (/ekipmanlar)
 *
 * Bolumun gruplari resimli kartlar halinde; kart grup sayfasina
 * (/ekipmanlar/kaynak-makineleri) gider. Kart gorseli gruptaki ilk
 * urunun ilk fotografidir.
 */
export function SectionHub({ section }: { section: TopLevelSection }) {
  const t = useT();
  const db = useDatabase();

  const cards = useMemo(() => {
    const products = listProducts(db);
    return sectionGroups(section, db.categoryGroups).map((group) => {
      const cats = groupCategories(group, db.categories);
      const inGroup = cats.flatMap((c) => products.filter((p) => p.categorySlug === c.slug));
      return {
        group,
        categories: cats,
        productCount: inGroup.length,
        imageUrl: inGroup[0]?.images[0]?.url,
      };
    });
  }, [db, section]);

  const title = SECTION_TITLES[section];

  return (
    <>
      <div className="border-b border-zw-grey-200 bg-zw-grey-50">
        <div className="zw-container pb-10 pt-4">
          <Breadcrumbs trail={[]} current={title} />
          <h1 className="mt-6 font-display text-4xl font-bold uppercase sm:text-5xl">{title}</h1>
          <p className="mt-3 max-w-2xl text-zw-grey-600">{SECTION_DESCRIPTIONS[section]}</p>
        </div>
      </div>

      <div className="zw-container py-10">
        <div
          className={`grid gap-6 sm:grid-cols-2 ${cards.length > 2 ? "lg:grid-cols-3" : ""}`}
        >
          {cards.map(({ group, categories, productCount, imageUrl }) => (
            <Link
              key={group.id}
              href={`/${section}/${group.slug}`}
              className="group flex flex-col overflow-hidden rounded-[4px] border border-zw-grey-200 bg-white transition-shadow hover:shadow-lg"
            >
              <div className="h-56 overflow-hidden bg-zw-grey-50 p-5 sm:h-64">
                <ProductImage
                  src={imageUrl}
                  alt={group.name}
                  label={group.name}
                  className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-[1.03]"
                />
              </div>
              <div className="flex flex-1 flex-col p-5">
                <h2 className="font-display text-2xl font-bold uppercase text-zw-ink group-hover:text-zw-red-600">
                  {group.name}
                </h2>
                <p className="mt-1 text-sm text-zw-grey-500">
                  {t.filters.productCount.replace("{count}", String(productCount))}
                </p>
                <ul className="mt-4 flex-1 space-y-1.5">
                  {categories.map((c) => (
                    <li key={c.id} className="flex gap-2 text-sm text-zw-grey-700">
                      <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-zw-red-600" />
                      {c.name}
                    </li>
                  ))}
                </ul>
                <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-zw-red-600">
                  {t.common.viewProducts}
                  <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
