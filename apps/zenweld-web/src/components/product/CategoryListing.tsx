"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import type { TopLevelSection, WeldingProcess } from "@zenweld/data";
import { useDatabase } from "@zenweld/store";
import { Button } from "@zenweld/ui";
import { LocaleLink } from "@/components/common/LocaleLink";
import { ProductGrid } from "./ProductGrid";
import {
  applyFilters,
  DEFAULT_FILTERS,
  ProductFilters,
  type FilterState,
} from "./ProductFilters";
import { useLocale, useT } from "@/lib/i18n-client";

interface ListingProps {
  section: TopLevelSection;
  categorySlug?: string;
}

/**
 * Mega menudeki grup basligi buraya "?grup=lazer" seklinde yonlendirir.
 * useSearchParams statik on-uretimde Suspense sinirini gerektirir; sinir
 * cozulene kadar gruplanmamis liste gosterilir.
 */
export function CategoryListing(props: ListingProps) {
  return (
    <Suspense fallback={<Listing {...props} />}>
      <ListingWithGroupParam {...props} />
    </Suspense>
  );
}

function ListingWithGroupParam(props: ListingProps) {
  const groupSlug = useSearchParams().get("grup") ?? undefined;
  return <Listing {...props} groupSlug={groupSlug} />;
}

function Listing({
  section,
  categorySlug,
  groupSlug,
}: ListingProps & { groupSlug?: string }) {
  const t = useT();
  const locale = useLocale();
  const db = useDatabase();
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const category = useMemo(
    () => (categorySlug ? db.categories.find((c) => c.slug === categorySlug) : undefined),
    [db, categorySlug],
  );

  const group = useMemo(
    () => (groupSlug ? db.categoryGroups.find((g) => g.slug === groupSlug) : undefined),
    [db, groupSlug],
  );

  // Kategoriler once ait olduklari grubun sirasina, sonra kendi siralarina gore.
  const sectionCategories = useMemo(() => {
    const groupOrder = new Map(db.categoryGroups.map((g) => [g.slug, g.order]));
    return db.categories
      .filter((c) => c.section === section && (group ? c.group === group.slug : true))
      .sort(
        (a, b) =>
          (groupOrder.get(a.group) ?? 99) - (groupOrder.get(b.group) ?? 99) ||
          a.order - b.order,
      );
  }, [db, section, group]);

  const scoped = useMemo(
    () =>
      db.products.filter(
        (p) =>
          p.active &&
          p.section === section &&
          (categorySlug
            ? p.categorySlug === categorySlug
            : sectionCategories.some((c) => c.slug === p.categorySlug)),
      ),
    [db, section, categorySlug, sectionCategories],
  );

  const availableProcesses = useMemo(
    () =>
      Array.from(new Set(scoped.flatMap((p) => p.processes))) as WeldingProcess[],
    [scoped],
  );

  const filtered = useMemo(() => applyFilters(scoped, filters), [scoped, filters]);

  const sectionTitles: Record<TopLevelSection, string> = {
    ekipmanlar: t.nav.equipment,
    guvenlik: t.nav.safety,
    aksesuarlar: t.nav.accessories,
    "dolgu-metalleri": t.nav.fillerMetals,
  };

  const title = category
    ? category.name[locale]
    : group
      ? group.name[locale]
      : sectionTitles[section];
  const description = category
    ? category.description[locale]
    : "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore.";

  return (
    <>
      <div className="border-b border-zw-grey-200 bg-zw-grey-50">
        <div className="zw-container py-10">
          <h1 className="font-display text-4xl font-bold uppercase sm:text-5xl">{title}</h1>
          <p className="mt-3 max-w-2xl text-zw-grey-600">{description}</p>
        </div>
      </div>

      <div className="border-b border-zw-grey-200">
        <div className="zw-container flex gap-2 overflow-x-auto py-3">
          <LocaleLink
            href={group ? `/${section}?grup=${group.slug}` : `/${section}`}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
              !categorySlug
                ? "bg-zw-ink text-white"
                : "bg-zw-grey-100 text-zw-grey-700 hover:bg-zw-grey-200"
            }`}
          >
            {t.common.all}
          </LocaleLink>
          {sectionCategories.map((c) => (
            <LocaleLink
              key={c.id}
              href={`/${section}/${c.slug}`}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                categorySlug === c.slug
                  ? "bg-zw-ink text-white"
                  : "bg-zw-grey-100 text-zw-grey-700 hover:bg-zw-grey-200"
              }`}
            >
              {c.name[locale]}
            </LocaleLink>
          ))}
        </div>
      </div>

      <div className="zw-container py-8">
        <div className="mb-5 lg:hidden">
          <Button
            variant="outline"
            fullWidth
            onClick={() => setMobileFiltersOpen(true)}
            leftIcon={<SlidersHorizontal size={17} />}
          >
            {t.filters.title} ({filtered.length})
          </Button>
        </div>

        <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <ProductFilters
                value={filters}
                onChange={setFilters}
                availableProcesses={availableProcesses}
                resultCount={filtered.length}
              />
            </div>
          </aside>

          <div>
            <ProductGrid products={filtered} />
          </div>
        </div>
      </div>

      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-[200] lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto rounded-t-[8px] bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl font-bold uppercase">{t.filters.title}</h2>
              <button onClick={() => setMobileFiltersOpen(false)} aria-label={t.common.close}>
                <X size={22} />
              </button>
            </div>
            <ProductFilters
              value={filters}
              onChange={setFilters}
              availableProcesses={availableProcesses}
              resultCount={filtered.length}
            />
            <Button
              fullWidth
              className="mt-6"
              onClick={() => setMobileFiltersOpen(false)}
            >
              {t.filters.productCount.replace("{count}", String(filtered.length))}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
