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
  catalogTrail,
  findGroup,
  groupCategories,
  groupDescription,
  sectionGroups,
  type Crumb,
} from "@/lib/catalog";

/**
 * KATALOG KARTLARI
 *
 *   /ekipmanlar                    -> grup kartlari (SectionHub)
 *   /ekipmanlar/kaynak-makineleri  -> kategori kartlari (GroupHub)
 *   /ekipmanlar/mig-gazalti-...    -> urunler (CategoryListing)
 *
 * Kart gorseli grubun/kategorinin kendi gorselidir (image); yoksa
 * icindeki ilk urunun fotografi kullanilir.
 */

interface HubCard {
  key: string;
  href: string;
  name: string;
  imageUrl?: string;
  productCount: number;
  /** Grup kartinda kategori adlari */
  lines?: string[];
  /** Kategori kartinda kisa aciklama */
  text?: string;
  cta: string;
}

function HubPage({
  title,
  description,
  trail,
  cards,
}: {
  title: string;
  description: string;
  trail: Crumb[];
  cards: HubCard[];
}) {
  const t = useT();
  return (
    <>
      <div className="border-b border-zw-grey-200 bg-zw-grey-50">
        <div className="zw-container pb-10 pt-4">
          <Breadcrumbs trail={trail} current={title} />
          <h1 className="mt-6 font-display text-4xl font-bold uppercase sm:text-5xl">{title}</h1>
          <p className="mt-3 max-w-2xl text-zw-grey-600">{description}</p>
        </div>
      </div>

      <div className="zw-container py-10">
        <div className={`grid grid-cols-1 gap-6 sm:grid-cols-2 ${cards.length > 2 ? "lg:grid-cols-3" : ""}`}>
          {cards.map((card) => (
            <Link
              key={card.key}
              href={card.href}
              className="group flex flex-col overflow-hidden rounded-[4px] border border-zw-grey-200 bg-white transition-shadow hover:shadow-lg"
            >
              <div className="h-56 overflow-hidden border-b border-zw-grey-100 bg-white p-3 sm:h-60">
                <ProductImage
                  src={card.imageUrl}
                  alt={card.name}
                  label={card.name}
                  className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-[1.03]"
                />
              </div>
              <div className="flex flex-1 flex-col p-5">
                <h2 className="font-display text-2xl font-bold uppercase text-zw-ink group-hover:text-zw-red-600">
                  {card.name}
                </h2>
                <p className="mt-1 text-sm text-zw-grey-500">
                  {t.filters.productCount.replace("{count}", String(card.productCount))}
                </p>
                {card.lines && (
                  <ul className="mt-4 flex-1 space-y-1.5">
                    {card.lines.map((line) => (
                      <li key={line} className="flex gap-2 text-sm text-zw-grey-700">
                        <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-zw-red-600" />
                        {line}
                      </li>
                    ))}
                  </ul>
                )}
                {card.text && <p className="mt-3 flex-1 text-sm leading-relaxed text-zw-grey-700">{card.text}</p>}
                <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-zw-red-600">
                  {card.cta}
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

/** /<bolum>: grup kartlari */
export function SectionHub({ section }: { section: TopLevelSection }) {
  const t = useT();
  const db = useDatabase();

  const cards = useMemo(() => {
    const products = listProducts(db);
    return sectionGroups(section, db.categoryGroups).map((group): HubCard => {
      const cats = groupCategories(group, db.categories);
      const inGroup = cats.flatMap((c) => products.filter((p) => p.categorySlug === c.slug));
      return {
        key: group.id,
        href: `/${section}/${group.slug}`,
        name: group.name,
        imageUrl: group.image ?? inGroup[0]?.images[0]?.url,
        productCount: inGroup.length,
        lines: cats.map((c) => c.name),
        cta: t.common.viewCategories,
      };
    });
  }, [db, section, t]);

  return (
    <HubPage
      title={SECTION_TITLES[section]}
      description={SECTION_DESCRIPTIONS[section]}
      trail={[]}
      cards={cards}
    />
  );
}

/** /<bolum>/<grup>: kategori kartlari */
export function GroupHub({ section, groupSlug }: { section: TopLevelSection; groupSlug: string }) {
  const t = useT();
  const db = useDatabase();
  const group = findGroup(section, groupSlug, db.categoryGroups);

  const cards = useMemo(() => {
    if (!group) return [];
    const products = listProducts(db);
    return groupCategories(group, db.categories).map((c): HubCard => {
      const inCategory = products.filter((p) => p.categorySlug === c.slug);
      return {
        key: c.id,
        href: `/${section}/${c.slug}`,
        name: c.name,
        imageUrl: c.image ?? inCategory[0]?.images[0]?.url,
        productCount: inCategory.length,
        text: c.description,
        cta: t.common.viewProducts,
      };
    });
  }, [db, section, group, t]);

  if (!group) return null;
  return (
    <HubPage
      title={group.name}
      description={groupDescription(group, db.categories)}
      trail={catalogTrail(section, { groupSlug }, { categories: db.categories, groups: db.categoryGroups }).slice(0, -1)}
      cards={cards}
    />
  );
}
